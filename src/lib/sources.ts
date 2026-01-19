import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { x as untar } from "tar";

import { runShellCommand } from "./commands.js";

export type ResolvedSource =
  | { kind: "file"; path: string }
  | { kind: "dir"; path: string };

export async function resolveSource(source: string): Promise<ResolvedSource> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const githubSource = githubUrlToSource(source);
    if (githubSource) return await downloadGitHubToTemp(githubSource);

    return await downloadUrlToTempFile(source);
  }

  if (source.startsWith("github:")) {
    return await downloadGitHubToTemp(source);
  }

  // local filesystem
  const localPath = path.resolve(source);
  const stat = await fs.stat(localPath);
  return stat.isDirectory()
    ? { kind: "dir", path: localPath }
    : { kind: "file", path: localPath };
}

export function githubUrlToSource(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Ignore query/hash for mapping purposes.
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.replaceAll(/\/+$/g, "");
  const segments = pathname.split("/").filter(Boolean);

  // https://github.com/<owner>/<repo>/blob/<ref>/<path>
  // https://github.com/<owner>/<repo>/tree/<ref>/<path>
  if (host === "github.com") {
    if (segments.length < 5) return null;
    const [owner, repoRaw, type, ref, ...rest] = segments;
    if (!owner || !repoRaw || !type || !ref) return null;
    if (type !== "blob" && type !== "tree") return null;
    if (rest.length === 0) return null;
    const repo = repoRaw.endsWith(".git") ? repoRaw.slice(0, -4) : repoRaw;
    const subpath = rest.join("/");
    return `github:${owner}/${repo}#${decodeURIComponent(ref)}:${decodeURIComponent(
      subpath,
    )}`;
  }

  // https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>
  if (host === "raw.githubusercontent.com") {
    if (segments.length < 4) return null;
    const [owner, repoRaw, ref, ...rest] = segments;
    if (!owner || !repoRaw || !ref) return null;
    if (rest.length === 0) return null;
    const repo = repoRaw.endsWith(".git") ? repoRaw.slice(0, -4) : repoRaw;
    const subpath = rest.join("/");
    return `github:${owner}/${repo}#${decodeURIComponent(ref)}:${decodeURIComponent(
      subpath,
    )}`;
  }

  return null;
}

async function downloadUrlToTempFile(url: string): Promise<ResolvedSource> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );

  const buffer = Buffer.from(await response.arrayBuffer());
  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "harbor-templater-url-"),
  );
  const filePath = path.join(tmpDir, "download");
  await fs.writeFile(filePath, buffer);

  return { kind: "file", path: filePath };
}

// github:<owner>/<repo>#<ref>:<path>
// If <path> points to a directory, returns kind=dir.
async function downloadGitHubToTemp(source: string): Promise<ResolvedSource> {
  const parsed = parseGitHubSource(source);

  const transport = (process.env.HARBOR_TEMPLATER_GITHUB_TRANSPORT ?? "auto")
    .trim()
    .toLowerCase();

  if (transport !== "auto" && transport !== "tarball" && transport !== "git") {
    throw new Error(
      `Invalid HARBOR_TEMPLATER_GITHUB_TRANSPORT: ${process.env.HARBOR_TEMPLATER_GITHUB_TRANSPORT}. Expected auto|tarball|git.`,
    );
  }

  if (transport === "tarball") {
    return await downloadGitHubTarballToTemp(parsed);
  }

  if (transport === "git") {
    return await downloadGitHubViaGitToTemp(parsed);
  }

  // auto
  try {
    return await downloadGitHubTarballToTemp(parsed);
  } catch (error) {
    // Private repos via codeload typically return 404 (and sometimes 403).
    // In those cases, fall back to git so the user's local credentials are used.
    const message = String((error as Error).message ?? error);
    if (message.includes(" 404 ") || message.includes(" 403 ")) {
      return await downloadGitHubViaGitToTemp(parsed);
    }
    throw error;
  }
}

async function downloadGitHubTarballToTemp(parsed: {
  owner: string;
  repo: string;
  ref: string;
  subpath: string;
}): Promise<ResolvedSource> {
  const subpath = normalizeGitHubSubpath(parsed.subpath);
  const tarballUrl = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/tar.gz/${parsed.ref}`;

  const response = await fetch(tarballUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${tarballUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "harbor-templater-gh-"),
  );
  const tarPath = path.join(tmpDir, "repo.tgz");
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(tarPath, buffer);

  // GitHub tarballs wrap content in a single top-level folder: <repo>-<shaOrRef>/
  const extractDir = path.join(tmpDir, "extract");
  await fs.mkdir(extractDir);
  await untar({ file: tarPath, cwd: extractDir });

  const entries = await fs.readdir(extractDir);
  if (entries.length === 0)
    throw new Error("Downloaded GitHub tarball was empty");

  const firstEntry = entries[0];
  if (!firstEntry) throw new Error("Downloaded GitHub tarball was empty");

  const root = path.join(extractDir, firstEntry);
  const candidate = path.join(root, subpath);
  const stat = await fs.stat(candidate);

  return stat.isDirectory()
    ? { kind: "dir", path: candidate }
    : { kind: "file", path: candidate };
}

async function downloadGitHubViaGitToTemp(parsed: {
  owner: string;
  repo: string;
  ref: string;
  subpath: string;
}): Promise<ResolvedSource> {
  const subpath = normalizeGitHubSubpath(parsed.subpath);

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "harbor-templater-gh-git-"),
  );
  const repoDir = path.join(tmpDir, "repo");
  const extractDir = path.join(tmpDir, "extract");
  await fs.mkdir(repoDir, { recursive: true });
  await fs.mkdir(extractDir, { recursive: true });

  const httpsUrl = `https://github.com/${parsed.owner}/${parsed.repo}.git`;
  const sshUrl = `git@github.com:${parsed.owner}/${parsed.repo}.git`;
  const preferred = (process.env.HARBOR_TEMPLATER_GITHUB_CLONE_PROTOCOL ?? "")
    .trim()
    .toLowerCase();

  const urls =
    preferred === "ssh"
      ? [sshUrl, httpsUrl]
      : preferred === "https" || preferred === ""
        ? [httpsUrl, sshUrl]
        : (() => {
            throw new Error(
              `Invalid HARBOR_TEMPLATER_GITHUB_CLONE_PROTOCOL: ${process.env.HARBOR_TEMPLATER_GITHUB_CLONE_PROTOCOL}. Expected https|ssh.`,
            );
          })();

  await runShellCommand("git init", repoDir);

  let lastError: unknown;
  for (const [idx, url] of urls.entries()) {
    try {
      if (idx === 0) {
        await runShellCommand(
          `git remote add origin ${escapeShellArg(url)}`,
          repoDir,
        );
      } else {
        await runShellCommand(
          `git remote set-url origin ${escapeShellArg(url)}`,
          repoDir,
        );
      }

      // Fetch only what's needed for the requested ref.
      await runShellCommand(
        `git fetch --depth 1 origin ${escapeShellArg(parsed.ref)}`,
        repoDir,
      );

      const archivePath = path.join(tmpDir, "archive.tar");
      await runShellCommand(
        `git archive --format=tar --output=${escapeShellArg(archivePath)} FETCH_HEAD ${escapeShellArg(subpath)}`,
        repoDir,
      );

      await untar({ file: archivePath, cwd: extractDir });

      const candidate = path.join(extractDir, subpath);
      const stat = await fs.stat(candidate);
      return stat.isDirectory()
        ? { kind: "dir", path: candidate }
        : { kind: "file", path: candidate };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Failed to fetch GitHub source via git for ${parsed.owner}/${parsed.repo}#${parsed.ref}:${subpath}. Ensure you have access to the repo and that your git credentials (credential helper / SSH agent) are configured.\n\n${String(
      (lastError as Error | undefined)?.message ?? lastError,
    )}`,
  );
}

function normalizeGitHubSubpath(input: string): string {
  const cleaned = input.replaceAll("\\\\", "/").trim();
  if (cleaned.length === 0)
    throw new Error("GitHub source path cannot be empty");
  if (cleaned.includes("\u0000"))
    throw new Error("GitHub source path contains invalid characters");
  if (path.posix.isAbsolute(cleaned))
    throw new Error("GitHub source path must be relative");

  const segments = cleaned.split("/");
  if (segments.some((s) => s === ".."))
    throw new Error("GitHub source path must not contain '..'");

  return cleaned;
}

function escapeShellArg(value: string): string {
  // Minimal POSIX-style escaping (works on macOS/Linux shells; Windows uses separate .cmd entrypoints).
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function parseGitHubSource(input: string): {
  owner: string;
  repo: string;
  ref: string;
  subpath: string;
} {
  const trimmed = input.slice("github:".length);
  const hashIdx = trimmed.indexOf("#");
  const colonIdx = trimmed.indexOf(":");

  if (hashIdx === -1 || colonIdx === -1 || colonIdx < hashIdx) {
    throw new Error(
      `Invalid github source: ${input}. Expected github:<owner>/<repo>#<ref>:<path>`,
    );
  }

  const repoPart = trimmed.slice(0, hashIdx);
  const refPart = trimmed.slice(hashIdx + 1, colonIdx);
  const pathPart = trimmed.slice(colonIdx + 1);

  const [owner, repo] = repoPart.split("/");
  if (!owner || !repo)
    throw new Error(`Invalid github source: ${input} (missing owner/repo)`);
  if (!refPart)
    throw new Error(`Invalid github source: ${input} (missing ref)`);
  if (!pathPart)
    throw new Error(`Invalid github source: ${input} (missing path)`);

  return { owner, repo, ref: refPart, subpath: pathPart };
}

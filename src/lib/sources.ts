import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { x as untar } from "tar";

export type ResolvedSource =
  | { kind: "file"; path: string }
  | { kind: "dir"; path: string };

export async function resolveSource(source: string): Promise<ResolvedSource> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
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
  const candidate = path.join(root, parsed.subpath);
  const stat = await fs.stat(candidate);

  return stat.isDirectory()
    ? { kind: "dir", path: candidate }
    : { kind: "file", path: candidate };
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

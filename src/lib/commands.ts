import { spawn } from "node:child_process";

export async function runShellCommand(
  command: string,
  cwd: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const maxCaptureBytes = 64 * 1024;
    let stdoutBytes = 0;
    let stderrBytes = 0;

    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(chunk);
      if (stdoutBytes < maxCaptureBytes) {
        stdoutChunks.push(chunk);
        stdoutBytes += chunk.length;
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
      if (stderrBytes < maxCaptureBytes) {
        stderrChunks.push(chunk);
        stderrBytes += chunk.length;
      }
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();

      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");

      const details = [
        stdout.trim() ? `stdout:\n${stdout.trim()}` : "",
        stderr.trim() ? `stderr:\n${stderr.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      reject(
        new Error(
          details
            ? `Command failed (${code}): ${command}\n\n${details}`
            : `Command failed (${code}): ${command}`,
        ),
      );
    });
  });
}

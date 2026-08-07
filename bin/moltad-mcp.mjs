#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "..", "src", "index.ts");
const require = createRequire(import.meta.url);

function resolveTsxCli() {
  try {
    return require.resolve("tsx/cli");
  } catch {
    try {
      return createRequire(path.join(__dirname, "../../../package.json")).resolve(
        "tsx/cli",
      );
    } catch {
      return null;
    }
  }
}

const tsxCli = resolveTsxCli();
const args = tsxCli ? [tsxCli, entry] : ["--import", "tsx", entry];
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

import net from "node:net";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

async function isPortFree(port) {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort({ start, end, avoid }) {
  for (let port = start; port <= end; port += 1) {
    if (avoid.has(port)) continue;
    if (await isPortFree(port)) return port;
  }
  return null;
}

async function main() {
  const preferred = Number(process.env.PORT ?? "3000");
  const port =
    (await isPortFree(preferred))
      ? preferred
      : await findPort({ start: 3000, end: 3100, avoid: new Set([3001]) });

  if (!port) {
    console.error("No free port found in range 3000-3100 (excluding 3001).");
    process.exit(1);
  }

  const require = createRequire(import.meta.url);
  const nextBin = require.resolve("next/dist/bin/next");

  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

void main();

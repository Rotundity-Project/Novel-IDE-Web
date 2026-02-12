import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const apiDir = path.join(repoRoot, "app", "app", "api", "v1");
const apiDocPath = path.join(repoRoot, "docs", "API文档.md");

function normalizeRoutePath(routeFile) {
  const rel = path.relative(apiDir, routeFile).replaceAll(path.sep, "/");
  const withoutSuffix = rel.replace(/\/route\.ts$/, "");
  if (!withoutSuffix || withoutSuffix === "route.ts") {
    return "/";
  }

  const segments = withoutSuffix.split("/").filter(Boolean);
  const normalized = segments
    .map((seg) => {
      const match = /^\[(.+)\]$/.exec(seg);
      if (match) {
        return `{${match[1]}}`;
      }
      return seg;
    })
    .join("/");

  return `/${normalized}`;
}

async function listRouteFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listRouteFiles(full)));
    } else if (entry.isFile() && entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function extractMethods(sourceText) {
  const methods = new Set();
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
  for (;;) {
    const m = re.exec(sourceText);
    if (!m) break;
    methods.add(m[1]);
  }
  return methods;
}

function extractDocEndpoints(apiDoc) {
  const endpoints = new Set();
  const re = /\*\*(GET|POST|PUT|PATCH|DELETE)\*\*\s+`(\/[^`]+)`/g;
  for (;;) {
    const m = re.exec(apiDoc);
    if (!m) break;
    endpoints.add(`${m[1]} ${m[2]}`);
  }
  return endpoints;
}

const routeFiles = await listRouteFiles(apiDir);
const implemented = new Set();

for (const routeFile of routeFiles) {
  const text = await fs.readFile(routeFile, "utf8");
  const methods = extractMethods(text);
  const routePath = normalizeRoutePath(routeFile);
  for (const method of methods) {
    implemented.add(`${method} ${routePath}`);
  }
}

const apiDoc = await fs.readFile(apiDocPath, "utf8");
const documented = extractDocEndpoints(apiDoc);

const missingInDoc = [...implemented].filter((e) => !documented.has(e)).sort();
const extraInDoc = [...documented].filter((e) => !implemented.has(e)).sort();

if (missingInDoc.length === 0 && extraInDoc.length === 0) {
  process.stdout.write("docs-check-api: OK\n");
  process.exit(0);
}

process.stdout.write("docs-check-api: FAILED\n");
if (missingInDoc.length > 0) {
  process.stdout.write("\nMissing in docs/API文档.md:\n");
  for (const e of missingInDoc) process.stdout.write(`- ${e}\n`);
}
if (extraInDoc.length > 0) {
  process.stdout.write("\nExtra in docs/API文档.md (no matching route handler):\n");
  for (const e of extraInDoc) process.stdout.write(`- ${e}\n`);
}
process.exit(1);


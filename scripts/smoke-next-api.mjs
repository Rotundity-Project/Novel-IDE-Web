const baseUrl = (process.env.APP_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "");

async function requestJson(path) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${path}: ${text.slice(0, 500)}`,
    );
  }

  return json;
}

const health = await requestJson("/api/v1/health");
if (!health || health.success !== true || !health.data || health.data.status !== "ok") {
  throw new Error(`Unexpected /api/v1/health response: ${JSON.stringify(health)}`);
}

process.stdout.write("smoke-next-api: OK\n");


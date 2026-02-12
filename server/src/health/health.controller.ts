import { Controller, Get } from "@nestjs/common";
import { ok } from "@novel/server-core";

@Controller()
export class HealthController {
  @Get("/health")
  public health() {
    return ok({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  @Get("/api/v1/health")
  public v1Health() {
    return ok({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}


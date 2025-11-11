import { storage } from "../storage";
import { randomUUID } from "crypto";

export interface MetricData {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  userRole?: string;
  userAgent?: string;
}

export async function recordMetric(data: MetricData): Promise<void> {
  try {
    await storage.createMetric({
      requestId: randomUUID(),
      ...data,
    });
  } catch (error) {
    console.error("Failed to record metric:", error);
  }
}

export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data: any) {
      const durationMs = Date.now() - startTime;
      
      // Log if exceeds p95 budget
      if (durationMs > 250) {
        console.warn(`⚠️ Endpoint ${req.method} ${req.path} exceeded p95 budget: ${durationMs}ms`);
      }

      // Record metric asynchronously
      recordMetric({
        route: req.path,
        method: req.method,
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?.userId,
        userRole: req.user?.role,
        userAgent: req.get("user-agent"),
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

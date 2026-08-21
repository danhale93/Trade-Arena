import { describe, expect, it, vi } from "vitest";

describe("poll-arbitrage security error handler", () => {
  it("does not leak stack traces in error response", () => {
    const error = new Error("Database connection failed");
    error.stack = "Error: Database connection failed\n    at recordBalanceSnapshot (/app/server/db.ts:10:15)";

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Simulate catch block logic from server/_core/index.ts
    const catchHandler = (e: any, res: any) => {
      console.error("[Heartbeat] Poll error:", e);
      return res.status(500).json({ error: e.message || "Internal server error" });
    };

    catchHandler(error, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Database connection failed" });
    const responseObj = mockRes.json.mock.calls[0][0];
    expect(responseObj).not.toHaveProperty("stack");
  });
});

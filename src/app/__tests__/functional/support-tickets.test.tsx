import { describe, it, expect, vi } from "vitest";
import { registerSupport } from "../../../../supabase/functions/server/routes/support";

// Mock dependencies
vi.mock("../../../../supabase/functions/server/kv_store", () => ({
  getByPrefix: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
}));

vi.mock("../../../../supabase/functions/server/_db", () => ({
  tableReady: vi.fn().mockResolvedValue(false),
  resetTableCache: vi.fn(),
  supabase: {},
}));

vi.mock("../../../../supabase/functions/server/_shared", () => ({
  PREFIX: "/make-server-cc347259",
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  auditLog: vi.fn(),
}));

import * as kv from "../../../../supabase/functions/server/kv_store";
import { requireUser } from "../../../../supabase/functions/server/_shared";

describe("Support Tickets Route", () => {
  it("should return tickets scoped only to the authenticated user", async () => {
    const mockApp = {
      routes: [] as { method: string; path: string; handler: Function }[],
      post(path: string, handler: Function) {
        this.routes.push({ method: "POST", path, handler });
      },
      get(path: string, handler: Function) {
        this.routes.push({ method: "GET", path, handler });
      },
    };

    registerSupport(mockApp);

    const getTicketsRoute = mockApp.routes.find(
      (r) => r.method === "GET" && r.path === "/make-server-cc347259/support/tickets"
    );

    expect(getTicketsRoute).toBeDefined();

    // Mock authenticated user user-123
    (requireUser as any).mockResolvedValue({ id: "user-123", email: "user@example.com" });

    // Mock KV tickets from multiple users
    (kv.getByPrefix as any).mockResolvedValue([
      { id: "t1", userId: "user-123", subject: "Ticket 1", updatedAt: 100 },
      { id: "t2", userId: "user-456", subject: "Ticket 2", updatedAt: 200 },
      { id: "t3", userId: "user-123", subject: "Ticket 3", updatedAt: 300 },
    ]);

    const mockContext = {
      json: (data: any, status?: number) => ({ data, status: status || 200 }),
    };

    const res = await getTicketsRoute!.handler(mockContext);

    expect(res.data.items).toHaveLength(2);
    expect(res.data.items).toEqual([
      { id: "t3", userId: "user-123", subject: "Ticket 3", updatedAt: 300 },
      { id: "t1", userId: "user-123", subject: "Ticket 1", updatedAt: 100 },
    ]);
  });

  it("should reject unauthenticated requests", async () => {
    const mockApp = {
      routes: [] as { method: string; path: string; handler: Function }[],
      post(path: string, handler: Function) {
        this.routes.push({ method: "POST", path, handler });
      },
      get(path: string, handler: Function) {
        this.routes.push({ method: "GET", path, handler });
      },
    };

    registerSupport(mockApp);

    const getTicketsRoute = mockApp.routes.find(
      (r) => r.method === "GET" && r.path === "/make-server-cc347259/support/tickets"
    );

    (requireUser as any).mockResolvedValue({ error: "Authentification requise", status: 401 });

    const mockContext = {
      json: (data: any, status?: number) => ({ data, status: status || 200 }),
    };

    const res = await getTicketsRoute!.handler(mockContext);

    expect(res.status).toBe(401);
    expect(res.data.error).toBe("Authentification requise");
  });
});

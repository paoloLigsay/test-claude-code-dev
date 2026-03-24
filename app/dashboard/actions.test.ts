import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({ insert: mockInsert }));
const mockGetUser = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

const { createFolder } = await import("@/app/dashboard/actions");

describe("createFolder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await createFolder("My Folder", null);

    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("creates folder and returns data on success", async () => {
    const fakeUser = { id: "user-123" };
    const fakeFolder = {
      id: "folder-1",
      name: "My Folder",
      parent_id: null,
      user_id: "user-123",
    };

    mockGetUser.mockResolvedValue({ data: { user: fakeUser } });
    mockSingle.mockResolvedValue({ data: fakeFolder, error: null });

    const result = await createFolder("My Folder", null);

    expect(result).toEqual({ data: fakeFolder });
    expect(mockFrom).toHaveBeenCalledWith("folders");
    expect(mockInsert).toHaveBeenCalledWith({
      name: "My Folder",
      parent_id: null,
      user_id: "user-123",
    });
  });

  it("returns error when insert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "duplicate key" },
    });

    const result = await createFolder("My Folder", null);

    expect(result).toEqual({ error: "duplicate key" });
  });
});

import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/repositories", () => ({ repository: vi.fn() }));
import { repository } from "@/repositories";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { saveMutation } from "./mutations";
import { demoRepository } from "@/repositories/demo";
afterEach(() => vi.clearAllMocks());
it("authorizes, resolves links, completes task without activity, and invalidates dependent screens", async () => {
  const snapshot = await demoRepository.read();
  const mutate = vi.fn().mockResolvedValue({ id: snapshot.tasks[0].id });
  vi.mocked(repository).mockReturnValue({
    mode: "google",
    read: async () => snapshot,
    mutate,
  });
  expect(
    await saveMutation({
      action: "update",
      entity: "task",
      id: snapshot.tasks[0].id,
      data: {
        status: "Готово",
        completedDate: snapshot.plans[0].date,
        result: "Done",
      },
    }),
  ).toEqual({ ok: true, id: snapshot.tasks[0].id });
  expect(requireAuth).toHaveBeenCalledTimes(1);
  expect(mutate).toHaveBeenCalledWith({
    action: "update",
    entity: "task",
    id: snapshot.tasks[0].id,
    data: {
      status: "Готово",
      completedDate: snapshot.plans[0].date,
      result: "Done",
    },
  });
  expect(mutate).toHaveBeenCalledTimes(1);
  expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
});
it("rejects partial update with deadline before existing start, and never revalidates failed writes", async () => {
  const snapshot = await demoRepository.read();
  const mutate = vi.fn();
  vi.mocked(repository).mockReturnValue({
    mode: "google",
    read: async () => snapshot,
    mutate,
  });
  expect(
    await saveMutation({
      action: "update",
      entity: "project",
      id: snapshot.projects[0].id,
      data: { deadline: "2000-01-01" },
    }),
  ).toMatchObject({ ok: false });
  expect(mutate).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
it("does not fake demo writes", async () => {
  vi.mocked(repository).mockReturnValue(demoRepository);
  expect(
    await saveMutation({
      action: "create",
      entity: "project",
      data: { name: "X" },
    }),
  ).toMatchObject({ ok: false });
  expect(revalidatePath).not.toHaveBeenCalled();
});

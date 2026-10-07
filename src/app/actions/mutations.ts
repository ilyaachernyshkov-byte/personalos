"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { repository } from "@/repositories";
import {
  editableData,
  entityConfig,
  validateMutation,
  type Entity,
} from "@/schemas/mutations";
const requestSchema = z
  .object({
    action: z.enum(["create", "update"]),
    entity: z.enum([
      "project",
      "milestone",
      "task",
      "process",
      "plan",
      "activity",
    ]),
    id: z.string().optional(),
    data: z.unknown(),
  })
  .strict();
const collection: Record<
  Entity,
  "projects" | "milestones" | "tasks" | "processes" | "plans" | "activities"
> = {
  project: "projects",
  milestone: "milestones",
  task: "tasks",
  process: "processes",
  plan: "plans",
  activity: "activities",
};
export async function saveMutation(
  input: unknown,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAuth();
  try {
    const request = requestSchema.parse(input);
    const repo = repository();
    if (!repo.mutate)
      return {
        ok: false,
        error:
          "Запись доступна через Google Apps Script. В demo и резервном adapter изменения не сохраняются.",
      };
    const snapshot = await repo.read();
    const current =
      request.action === "update"
        ? snapshot[collection[request.entity]].find(
            (row) => row.id === request.id,
          )
        : undefined;
    if (
      request.action === "update" &&
      (!request.id ||
        !new RegExp(`^${entityConfig[request.entity].prefix}-\\d{3,}$`).test(
          request.id,
        ) ||
        !current)
    )
      throw new Error("Запись больше не существует");
    if (request.action === "create" && request.id)
      throw new Error("ID создаётся backend");
    const incoming = validateMutation(
      request.entity,
      request.data,
      snapshot,
      request.action === "create",
    );
    // Validate partial updates against the full current row as well.
    if (current)
      validateMutation(
        request.entity,
        { ...editableData(request.entity, current), ...incoming },
        snapshot,
        false,
      );
    const result = await repo.mutate({ ...request, data: incoming });
    revalidatePath("/", "layout");
    return { ok: true, id: result.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? error.issues.map((i) => i.message).join(". ")
          : error instanceof Error
            ? error.message
            : "Не удалось сохранить",
    };
  }
}

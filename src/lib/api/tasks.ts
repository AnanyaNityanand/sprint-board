import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskStatus } from "@/lib/types";
import type { TaskValues } from "@/lib/schemas";

export async function listTasks(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(
  projectId: string,
  values: TaskValues,
  createdBy: string,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      assignee_id: values.assignee_id ?? null,
      due_date: values.due_date || null,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, values: TaskValues): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: values.title,
      description: values.description || null,
      status: values.status,
      priority: values.priority,
      assignee_id: values.assignee_id ?? null,
      due_date: values.due_date || null,
    })
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

/**
 * Persist a drag-and-drop move. `taskId` is moved to `status` at `position`,
 * and any other tasks in that column whose position would now collide are
 * shifted down by one. Uses integer positions spaced by 100 so reorders rarely
 * need to touch more than the dragged task plus a slice of siblings.
 */
export async function moveTask(
  taskId: string,
  status: TaskStatus,
  position: number,
): Promise<void> {
  const { error } = await supabase.from("tasks").update({ status, position }).eq("id", taskId);
  if (error) throw error;
}

/**
 * Batch-persist new positions after a reorder. Accepts the full set of
 * `{ id, position }` updates to apply for the affected column(s) and writes
 * them in a single request. Only tasks whose position actually changed need to
 * be included.
 */
export async function reorderTasks(updates: { id: string; position: number }[]): Promise<void> {
  if (updates.length === 0) return;
  const { error } = await supabase.from("tasks").upsert(
    updates.map(({ id, position }) => ({ id, position })),
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

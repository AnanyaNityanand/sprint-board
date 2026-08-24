import { supabase } from "@/integrations/supabase/client";
import type { TaskComment } from "@/lib/types";

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as TaskComment[];
}

export async function createTaskComment(
  taskId: string,
  userId: string,
  content: string,
): Promise<TaskComment> {
  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: userId,
      content,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as TaskComment;
}
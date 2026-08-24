
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/lib/types";

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Notification[];
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  projectId,
  taskId,
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  projectId?: string;
  taskId?: string;
}): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message: message ?? null,
      project_id: projectId ?? null,
      task_id: taskId ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data as Notification;
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

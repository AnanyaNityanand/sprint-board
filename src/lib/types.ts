export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type MemberRole = "owner" | "member";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary extends Project {
  memberCount: number;
  taskCount: number;
  doneCount: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  profile: Profile | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

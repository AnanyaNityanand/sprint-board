import { supabase } from "@/integrations/supabase/client";
import type { Project, ProjectMember, ProjectSummary, TaskStatus } from "@/lib/types";
import type { ProjectValues } from "@/lib/schemas";

type ProjectRow = Project & {
  project_members: { count: number }[];
  tasks: { status: TaskStatus }[];
};

function toSummary(row: ProjectRow): ProjectSummary {
  const tasks = row.tasks ?? [];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    owner_id: row.owner_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    memberCount: row.project_members?.[0]?.count ?? 0,
    taskCount: tasks.length,
    doneCount: tasks.filter((task) => task.status === "done").length,
  };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_members(count), tasks(status)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as ProjectRow[]).map(toSummary);
}

export async function getProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Project not found or you don't have access to it.");
  return data as Project;
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("id, project_id, user_id, role, profile:profiles(id, email, full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ProjectMember[];
}
export async function addProjectMemberByEmail(
  projectId: string,
  email: string,
): Promise<void> {
  const { error } = await supabase.rpc("add_project_member_by_email", {
    _project_id: projectId,
    _email: email,
  });

  if (error) throw error;
}

export async function createProject(values: ProjectValues, ownerId: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: values.name,
      description: values.description || null,
      owner_id: ownerId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(projectId: string, values: ProjectValues): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({ name: values.name, description: values.description || null })
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}


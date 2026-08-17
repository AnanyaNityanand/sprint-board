import { queryOptions } from "@tanstack/react-query";

import { getProject, listProjectMembers, listProjects } from "@/lib/api/projects";
import { listTasks } from "@/lib/api/tasks";

export const projectsQuery = () =>
  queryOptions({ queryKey: ["projects"], queryFn: listProjects });

export const projectQuery = (projectId: string) =>
  queryOptions({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });

export const projectMembersQuery = (projectId: string) =>
  queryOptions({
    queryKey: ["project-members", projectId],
    queryFn: () => listProjectMembers(projectId),
  });

export const tasksQuery = (projectId: string) =>
  queryOptions({ queryKey: ["tasks", projectId], queryFn: () => listTasks(projectId) });

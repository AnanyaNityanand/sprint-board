import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { KanbanBoard } from "@/components/kanban-board";
import { ProjectDialog } from "@/components/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { deleteProject, updateProject } from "@/lib/api/projects";
import { createTask, deleteTask, updateTask } from "@/lib/api/tasks";
import { projectMembersQuery, projectQuery, tasksQuery } from "@/lib/queries";
import type { ProjectValues, TaskValues } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project board — Sprint Board" },
      { name: "description", content: "Manage tasks and members on your Sprint Board project." },
      { property: "og:title", content: "Project board — Sprint Board" },
      { property: "og:description", content: "Manage tasks and members on your project board." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const project = useQuery(projectQuery(projectId));
  const members = useQuery(projectMembersQuery(projectId));
  const tasks = useQuery(tasksQuery(projectId));

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const saveProject = useMutation({
    mutationFn: (values: ProjectValues) => updateProject(projectId, values),
    onSuccess: () => {
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update project"),
  });

  const removeProject = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete project"),
  });

  const addTask = useMutation({
    mutationFn: (values: TaskValues) => {
      if (!user) throw new Error("You need to be signed in.");
      return createTask(projectId, values, user.id);
    },
    onSuccess: () => {
      toast.success("Task created");
      invalidateTasks();
    },
    onError: (error: Error) => toast.error(error.message || "Could not create task"),
  });

  const saveTask = useMutation({
    mutationFn: ({ taskId, values }: { taskId: string; values: TaskValues }) =>
      updateTask(taskId, values),
    onSuccess: () => {
      toast.success("Task updated");
      invalidateTasks();
    },
    onError: (error: Error) => toast.error(error.message || "Could not update task"),
  });

  const removeTask = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      toast.success("Task deleted");
      invalidateTasks();
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete task"),
  });

  if (project.isPending) {
    return (
      <AppShell title="Loading project…">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (project.isError || !project.data) {
    return (
      <AppShell title="Project unavailable">
        <ErrorState
          title="Project not found"
          message="This project doesn't exist or you don't have access to it."
          onRetry={() => project.refetch()}
        />
      </AppShell>
    );
  }

  const isOwner = project.data.owner_id === user?.id;
  const memberList = members.data ?? [];

  return (
    <AppShell
      title={project.data.name}
      description={project.data.description || "No description yet."}
      actions={
        isOwner ? (
          <>
            <ProjectDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              }
              title="Edit project"
              submitLabel="Save changes"
              pending={saveProject.isPending}
              defaultValues={{
                name: project.data.name,
                description: project.data.description ?? "",
              }}
              onSubmit={async (values) => {
                await saveProject.mutateAsync(values);
              }}
            />
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" aria-label="Delete project">
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              }
              title="Delete this project?"
              description="The project, its members and all of its tasks will be permanently deleted. This can't be undone."
              pending={removeProject.isPending}
              onConfirm={() => removeProject.mutate()}
            />
          </>
        ) : null
      }
    >
      <div className="space-y-6">
        <section className="rounded-lg border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Members</h2>
          {members.isPending ? (
            <Skeleton className="mt-3 h-6 w-40" />
          ) : members.isError ? (
            <p className="mt-2 text-sm text-destructive">Could not load members.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {memberList.map((member) => (
                <li key={member.id}>
                  <Badge variant="secondary" className="gap-1.5 font-normal">
                    {member.profile?.full_name || member.profile?.email || "Member"}
                    {member.role === "owner" && (
                      <span className="text-xs text-muted-foreground">owner</span>
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Board</h2>
          {tasks.isPending ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-64 w-full rounded-lg" />
              ))}
            </div>
          ) : tasks.isError ? (
            <ErrorState message="We couldn't load this board." onRetry={() => tasks.refetch()} />
          ) : (
            <KanbanBoard
              tasks={tasks.data}
              members={memberList}
              pending={addTask.isPending || saveTask.isPending || removeTask.isPending}
              onCreate={async (values) => {
                await addTask.mutateAsync(values);
              }}
              onUpdate={async (taskId, values) => {
                await saveTask.mutateAsync({ taskId, values });
              }}
              onDelete={(taskId) => removeTask.mutate(taskId)}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

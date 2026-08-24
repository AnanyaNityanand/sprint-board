import { useEffect , useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { KanbanBoard } from "@/components/kanban-board";
import { MemberDialog } from "@/components/member-dialog";
import { ProjectDialog } from "@/components/project-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  addProjectMemberByEmail,
  deleteProject,
  updateProject,
} from "@/lib/api/projects";
import { createTask, deleteTask, moveTask, reorderTasks, updateTask } from "@/lib/api/tasks";
import { createNotification } from "@/lib/api/notifications";
import { projectMembersQuery, projectQuery, tasksQuery } from "@/lib/queries";
import type { ProjectValues, TaskValues } from "@/lib/schemas";
import type { Task } from "@/lib/types";

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
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const project = useQuery(projectQuery(projectId));
  const members = useQuery(projectMembersQuery(projectId));
  const tasks = useQuery(tasksQuery(projectId));
  useEffect(() => {
  const channel = supabase
    .channel(`project-tasks-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
  queryClient.setQueryData<Task[]>(["tasks", projectId], (oldTasks = []) => {
    if (payload.eventType === "INSERT") {
  const newTask = payload.new as Task;

  const alreadyExists = oldTasks.some(
    (task) => task.id === newTask.id,
  );

  if (alreadyExists) {
    return oldTasks;
  }

  return [...oldTasks, newTask];
}

    if (payload.eventType === "UPDATE") {
      return oldTasks.map((task) =>
        task.id === payload.new["id"] ? (payload.new as Task) : task,
      );
    }

    if (payload.eventType === "DELETE") {
      return oldTasks.filter((task) => task.id !== payload.old["id"]);
    }

    return oldTasks;
  });

  queryClient.invalidateQueries({
    queryKey: ["projects"],
  });
},
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [projectId, queryClient]);
 useEffect(() => {
  if (!user) return;

  const channel = supabase.channel(`project-presence-${projectId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  channel.on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();

    const ids = Object.values(state)
      .flat()
      .map(
        (presence) =>
          (presence as unknown as { user_id: string }).user_id,
      );

    setOnlineUserIds([...new Set(ids)]);
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: user.id,
      });
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}, [projectId, user]);
  const addMember = useMutation({
  mutationFn: (email: string) =>
    addProjectMemberByEmail(projectId, email),
  onSuccess: () => {
    toast.success("Member added");
    queryClient.invalidateQueries({
      queryKey: ["project-members", projectId],
    });
  },
  onError: (error: Error) => {
    toast.error(error.message || "Could not add member");
  },
});

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
  mutationFn: async (values: TaskValues) => {
    if (!user) throw new Error("You need to be signed in.");

    const newTask = await createTask(projectId, values, user.id);

    console.log("1. TASK CREATED:", newTask);

    console.log("2. BEFORE NOTIFICATION");

    if (
  newTask.assignee_id &&
  newTask.assignee_id !== user.id
) {
  try {
    const notification = await createNotification({
      userId: newTask.assignee_id,
      type: "task_assigned",
      title: "New task assigned",
      message: `You were assigned to "${newTask.title}"`,
      projectId,
      taskId: newTask.id,
    });

    console.log("NOTIFICATION SUCCESS:", notification);
  } catch (error) {
    console.error("NOTIFICATION FAILED:", error);
    throw error;
  }
}

    console.log("4. AFTER NOTIFICATION");

    return newTask;
  },

  onSuccess: () => {
    toast.success("Task created");
    invalidateTasks();
  },

  onError: (error: Error) => {
    console.error("ERROR:", error);
    toast.error(error.message || "Could not create task");
  },
});

  
  const saveTask = useMutation({
  mutationFn: async ({
    taskId,
    values,
  }: {
    taskId: string;
    values: TaskValues;
  }) => {
    console.log("✏️ UPDATING TASK:", {
      taskId,
      values,
      currentUser: user?.id,
    });

    // Get the task before updating it
    const existingTask = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (existingTask.error) {
      throw existingTask.error;
    }

    const previousAssigneeId = existingTask.data.assignee_id;

    console.log("👤 PREVIOUS ASSIGNEE:", previousAssigneeId);

    // Update task
    const updatedTask = await updateTask(taskId, values);

    console.log("✅ TASK UPDATED:", updatedTask);
    console.log("👤 NEW ASSIGNEE:", updatedTask.assignee_id);

    // Only notify when a task is assigned to someone new
    if (
      updatedTask.assignee_id &&
      updatedTask.assignee_id !== previousAssigneeId &&
      updatedTask.assignee_id !== user?.id
    ) {
      console.log(
        "🔔 CREATING ASSIGNMENT NOTIFICATION FOR:",
        updatedTask.assignee_id,
      );

      try {
        const notification = await createNotification({
          userId: updatedTask.assignee_id,
          type: "task_assigned",
          title: "New task assigned",
          message: `You were assigned to "${updatedTask.title}"`,
          projectId,
          taskId: updatedTask.id,
        });

        console.log("🔔 NOTIFICATION CREATED:", notification);
      } catch (error) {
        console.error("❌ NOTIFICATION CREATION FAILED:", error);
        throw error;
      }
    } else {
      console.log("ℹ️ NO ASSIGNMENT NOTIFICATION CREATED", {
        newAssignee: updatedTask.assignee_id,
        previousAssignee: previousAssigneeId,
        currentUser: user?.id,
      });
    }

    return updatedTask;
  },

  onSuccess: () => {
    toast.success("Task updated");
    invalidateTasks();
  },

  onError: (error: Error) => {
    console.error("❌ TASK UPDATE ERROR:", error);
    toast.error(error.message || "Could not update task");
  },
});

  const removeTask = useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      toast.success("Task deleted");
      invalidateTasks();
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete task"),
  });

  const moveTaskMutation = useMutation({
    mutationFn: async (intent: {
      taskId: string;
      status: Task["status"];
      position: number;
      siblingUpdates: { id: string; position: number }[];
    }) => {
      await moveTask(intent.taskId, intent.status, intent.position);
      if (intent.siblingUpdates.length > 0) {
        await reorderTasks(intent.siblingUpdates);
      }
    },
    onSuccess: () => {
      invalidateTasks();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not move task. Reverting.");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
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
  <div className="flex items-center justify-between gap-4">
    <h2 className="text-sm font-semibold">Members</h2>

    {isOwner && (
      <MemberDialog
        pending={addMember.isPending}
        onSubmit={async (email) => {
          await addMember.mutateAsync(email);
        }}
      />
    )}
  </div>
          {members.isPending ? (
            <Skeleton className="mt-3 h-6 w-40" />
          ) : members.isError ? (
            <p className="mt-2 text-sm text-destructive">Could not load members.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {memberList.map((member) => {
  const isOnline = onlineUserIds.includes(member.user_id);

  return (
    <li key={member.id}>
      <Badge variant="secondary" className="gap-1.5 font-normal">
        <span
          className={`size-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />

        {member.profile?.full_name || member.profile?.email || "Member"}

        {member.role === "owner" && (
          <span className="text-xs text-muted-foreground">owner</span>
        )}

        <span className="text-xs text-muted-foreground">
          {isOnline ? "viewing now" : "offline"}
        </span>
      </Badge>
    </li>
  );
})}
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
              onMove={(intent) => {
                const queryKey = ["tasks", projectId];
                const previous = queryClient.getQueryData<Task[]>(queryKey);
                if (previous) {
                  const next = previous.map((task) => {
                    if (task.id === intent.taskId) {
                      return { ...task, status: intent.status, position: intent.position };
                    }
                    const sibling = intent.siblingUpdates.find((s) => s.id === task.id);
                    if (sibling) return { ...task, position: sibling.position };
                    return task;
                  });
                  queryClient.setQueryData<Task[]>(queryKey, next);
                }
                moveTaskMutation.mutate(intent);
              }}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}

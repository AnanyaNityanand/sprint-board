import { CalendarDays, Clock, Pencil, Trash2, User } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskDialog } from "@/components/task-dialog";
import type { ProjectMember, Task, TaskPriority } from "@/lib/types";
import type { TaskValues } from "@/lib/schemas";

const priorityVariant: Record<TaskPriority, "secondary" | "outline" | "default" | "destructive"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

function formatDate(value: string) {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function TaskCard({
  task,
  members,
  onUpdate,
  onDelete,
  pending,
}: {
  task: Task;
  members: ProjectMember[];
  onUpdate: (values: TaskValues) => Promise<void>;
  onDelete: () => void;
  pending?: boolean | undefined;
}) {
  const assignee = members.find((member) => member.user_id === task.assignee_id);

  return (
    <article
      data-task-id={task.id}
      data-task-status={task.status}
      className="rounded-lg border bg-card p-3 shadow-card"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
        <Badge variant={priorityVariant[task.priority]} className="shrink-0 capitalize">
          {task.priority}
        </Badge>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{task.description}</p>
      )}

      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <User className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Assignee</dt>
          <dd>{assignee?.profile?.full_name || assignee?.profile?.email || "Unassigned"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Due date</dt>
          <dd>{task.due_date ? formatDate(task.due_date) : "No due date"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Created</dt>
          <dd>Created {formatDate(task.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex justify-end gap-1">
        <TaskDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Edit ${task.title}`}>
              <Pencil className="size-4" />
            </Button>
          }
          title="Edit task"
          submitLabel="Save changes"
          members={members}
          pending={pending}
          defaultValues={{
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            priority: task.priority,
            assignee_id: task.assignee_id,
            due_date: task.due_date ?? "",
          }}
          onSubmit={onUpdate}
        />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          }
          title="Delete this task?"
          description={`"${task.title}" will be permanently removed from the board. This can't be undone.`}
          onConfirm={onDelete}
          pending={pending}
        />
      </div>
    </article>
  );
}

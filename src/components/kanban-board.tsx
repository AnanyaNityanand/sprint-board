import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { TaskDialog } from "@/components/task-dialog";
import { TASK_STATUSES, type ProjectMember, type Task, type TaskStatus } from "@/lib/types";
import type { TaskValues } from "@/lib/schemas";

/**
 * Presentational Kanban board. Columns are derived from task status, and each
 * column/card carries `data-*` attributes so drag-and-drop can be layered on
 * later without changing the data model.
 */
export function KanbanBoard({
  tasks,
  members,
  onCreate,
  onUpdate,
  onDelete,
  pending,
}: {
  tasks: Task[];
  members: ProjectMember[];
  onCreate: (values: TaskValues) => Promise<void>;
  onUpdate: (taskId: string, values: TaskValues) => Promise<void>;
  onDelete: (taskId: string) => void;
  pending?: boolean | undefined;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.value);
        return (
          <section
            key={column.value}
            data-column-status={column.value}
            aria-label={column.label}
            className="flex flex-col rounded-lg border bg-secondary/50 p-3"
          >
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {columnTasks.length}
              </span>
            </header>

            <div className="flex-1 space-y-3">
              {columnTasks.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  No tasks here yet
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    pending={pending}
                    onUpdate={(values) => onUpdate(task.id, values)}
                    onDelete={() => onDelete(task.id)}
                  />
                ))
              )}
            </div>

            <AddTaskButton
              status={column.value}
              label={column.label}
              members={members}
              pending={pending}
              onCreate={onCreate}
            />
          </section>
        );
      })}
    </div>
  );
}

function AddTaskButton({
  status,
  label,
  members,
  pending,
  onCreate,
}: {
  status: TaskStatus;
  label: string;
  members: ProjectMember[];
  pending?: boolean | undefined;
  onCreate: (values: TaskValues) => Promise<void>;
}) {
  return (
    <TaskDialog
      trigger={
        <Button variant="ghost" size="sm" className="mt-3 w-full justify-start">
          <Plus className="size-4" aria-hidden="true" />
          Add task to {label}
        </Button>
      }
      title={`New task in ${label}`}
      submitLabel="Create task"
      members={members}
      pending={pending}
      defaultValues={{
        title: "",
        description: "",
        status,
        priority: "medium",
        assignee_id: null,
        due_date: "",
      }}
      onSubmit={onCreate}
    />
  );
}

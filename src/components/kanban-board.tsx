import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SortableTaskCard } from "@/components/sortable-task-card";
import { TaskCard } from "@/components/task-card";
import { TaskDialog } from "@/components/task-dialog";
import { TASK_STATUSES, type ProjectMember, type Task, type TaskStatus } from "@/lib/types";
import type { TaskValues } from "@/lib/schemas";

const POSITION_STEP = 100;

/** Compute integer positions spaced by POSITION_STEP for a list ordered by index. */
function spacedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i * POSITION_STEP);
}

export type MoveIntent = {
  taskId: string;
  status: TaskStatus;
  position: number;
  /** Other tasks in the destination column that need their position rewritten. */
  siblingUpdates: { id: string; position: number }[];
};

/**
 * Kanban board with drag-and-drop. Columns are droppable and cards are sortable
 * items. On drop, the board computes a fresh set of integer positions for the
 * destination column (spaced by 100) and calls `onMove` with the resulting
 * intent; the route applies it optimistically and persists it.
 */
export function KanbanBoard({
  tasks,
  members,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  pending,
}: {
  tasks: Task[];
  members: ProjectMember[];
  onCreate: (values: TaskValues) => Promise<void>;
  onUpdate: (taskId: string, values: TaskValues) => Promise<void>;
  onDelete: (taskId: string) => void;
  onMove: (intent: MoveIntent) => void;
  pending?: boolean | undefined;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const status of TASK_STATUSES) map.set(status.value, []);
    for (const task of tasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    const dragged = tasks.find((t) => t.id === activeTaskId);
    if (!dragged) return;

    const overId = String(over.id);
    const overColumnStatus = (over.data.current?.["status"] as TaskStatus | undefined) ?? null;
    const overTask = tasks.find((t) => t.id === overId);

    // Determine destination status: the column the item was dropped over, else
    // the column of the task it was dropped onto, else unchanged.
    let destinationStatus: TaskStatus;
    if (overColumnStatus) {
      destinationStatus = overColumnStatus;
    } else if (overTask) {
      destinationStatus = overTask.status;
    } else {
      return;
    }

    // Build the destination column's task list without the dragged task.
    const destinationList = (tasksByStatus.get(destinationStatus) ?? []).filter(
      (t) => t.id !== dragged.id,
    );

    let insertIndex = destinationList.length;
    if (overTask && overTask.id !== dragged.id && overTask.status === destinationStatus) {
      insertIndex = destinationList.findIndex((t) => t.id === overTask.id);
      if (insertIndex === -1) insertIndex = destinationList.length;
    } else if (overColumnStatus && destinationStatus !== dragged.status) {
      insertIndex = destinationList.length;
    }

    destinationList.splice(insertIndex, 0, dragged);

    const positions = spacedPositions(destinationList.length);
    const newIndex = destinationList.findIndex((t) => t.id === dragged.id);
    const siblingUpdates = destinationList
      .map((t, i) => ({ id: t.id, position: positions[i]! }))
      .filter((entry) => entry.id !== dragged.id);

    onMove({
      taskId: dragged.id,
      status: destinationStatus,
      position: positions[newIndex]!,
      siblingUpdates,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((column) => {
          const columnTasks = tasksByStatus.get(column.value) ?? [];
          return (
            <Column
              key={column.value}
              status={column.value}
              label={column.label}
              columnTasks={columnTasks}
              members={members}
              pending={pending}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onCreate={onCreate}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? (
          <div className="rotate-2 cursor-grabbing">
            <TaskCard
              task={activeTask}
              members={members}
              pending={pending}
              onUpdate={async () => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  label,
  columnTasks,
  members,
  pending,
  onUpdate,
  onDelete,
  onCreate,
}: {
  status: TaskStatus;
  label: string;
  columnTasks: Task[];
  members: ProjectMember[];
  pending?: boolean | undefined;
  onUpdate: (taskId: string, values: TaskValues) => Promise<void>;
  onDelete: (taskId: string) => void;
  onCreate: (values: TaskValues) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <section
      ref={setNodeRef}
      data-column-status={status}
      aria-label={label}
      className={`flex flex-col rounded-lg border bg-secondary/50 p-3 transition-colors ${
        isOver ? "border-primary/60 ring-1 ring-primary/30" : ""
      }`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {columnTasks.length}
        </span>
      </header>

      <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3">
          {columnTasks.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No tasks here yet
            </p>
          ) : (
            columnTasks.map((task) => (
              <SortableTaskCard
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
      </SortableContext>

      <AddTaskButton
        status={status}
        label={label}
        members={members}
        pending={pending}
        onCreate={onCreate}
      />
    </section>
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

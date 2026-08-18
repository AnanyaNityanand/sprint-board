import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TaskCard } from "@/components/task-card";
import type { ProjectMember, Task } from "@/lib/types";
import type { TaskValues } from "@/lib/schemas";

/**
 * Sortable wrapper around the existing TaskCard. The drag handle is the whole
 * card body (title/description/meta region); the edit/delete buttons sit
 * outside the draggable listener so clicking them never starts a drag.
 */
export function SortableTaskCard({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-40" : undefined}
      {...attributes}
    >
      <DraggableTaskCardBody
        task={task}
        members={members}
        pending={pending}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
      />
    </div>
  );
}

/**
 * Renders the card content with the drag handle attached only to the
 * non-interactive region. Buttons remain fully clickable.
 */
function DraggableTaskCardBody({
  task,
  members,
  onUpdate,
  onDelete,
  pending,
  dragHandleRef,
  dragListeners,
}: {
  task: Task;
  members: ProjectMember[];
  onUpdate: (values: TaskValues) => Promise<void>;
  onDelete: () => void;
  pending?: boolean | undefined;
  dragHandleRef: (el: HTMLElement | null) => void;
  dragListeners: Record<string, (...args: never[]) => void>;
}) {
  return (
    <TaskCard
      task={task}
      members={members}
      pending={pending}
      onUpdate={onUpdate}
      onDelete={onDelete}
      dragHandleRef={dragHandleRef}
      dragListeners={dragListeners}
    />
  );
}

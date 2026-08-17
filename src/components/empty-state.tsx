import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

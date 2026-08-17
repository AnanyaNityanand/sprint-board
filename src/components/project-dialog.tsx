import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { projectSchema, type ProjectValues } from "@/lib/schemas";

export function ProjectDialog({
  trigger,
  title,
  submitLabel,
  defaultValues,
  pending,
  onSubmit,
}: {
  trigger: ReactNode;
  title: string;
  submitLabel: string;
  defaultValues?: ProjectValues;
  pending?: boolean | undefined;
  onSubmit: (values: ProjectValues) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues ?? { name: "", description: "" },
  });

  useEffect(() => {
    if (open) reset(defaultValues ?? { name: "", description: "" });
  }, [open, defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Projects group your board, members and tasks in one place.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            setOpen(false);
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="Website redesign"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              rows={3}
              placeholder="What is this project about?"
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

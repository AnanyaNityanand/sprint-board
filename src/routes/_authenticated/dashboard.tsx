import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ProjectCard } from "@/components/project-card";
import { ProjectDialog } from "@/components/project-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/lib/api/projects";
import { projectsQuery } from "@/lib/queries";
import type { ProjectValues } from "@/lib/schemas";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Sprint Board" },
      { name: "description", content: "All your Sprint Board projects and their sprint progress." },
      { property: "og:title", content: "Dashboard — Sprint Board" },
      { property: "og:description", content: "All your projects and their sprint progress." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const projects = useQuery(projectsQuery());

  const create = useMutation({
    mutationFn: (values: ProjectValues) => {
      if (!user) throw new Error("You need to be signed in.");
      return createProject(values, user.id);
    },
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not create project"),
  });

  const firstName = ((user?.user_metadata?.["full_name"] as string | undefined) || user?.email || "")
    .split(/[\s@]/)[0];

  const newProjectButton = (
    <ProjectDialog
      trigger={
        <Button>
          <Plus className="size-4" aria-hidden="true" />
          New project
        </Button>
      }
      title="Create a project"
      submitLabel="Create project"
      pending={create.isPending}
      onSubmit={async (values) => {
        await create.mutateAsync(values);
      }}
    />
  );

  return (
    <AppShell
      title="Dashboard"
      description={firstName ? `Welcome back, ${firstName}` : undefined}
      actions={newProjectButton}
    >
      <section className="space-y-6">
        <div className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold">Your projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each project has its own Kanban board with Todo, In Progress, Review and Done columns.
          </p>
        </div>

        {projects.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : projects.isError ? (
          <ErrorState
            message="We couldn't load your projects."
            onRetry={() => projects.refetch()}
          />
        ) : projects.data.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="size-5" aria-hidden="true" />}
            title="No projects yet"
            description="Create your first project to start planning tasks on a Kanban board."
            action={newProjectButton}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

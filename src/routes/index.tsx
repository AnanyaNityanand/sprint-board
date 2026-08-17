import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, KanbanSquare, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sprint Board — Kanban project management for teams" },
      {
        name: "description",
        content:
          "Plan sprints, track tasks across Todo, In Progress, Review and Done, and keep your team aligned with Sprint Board.",
      },
      { property: "og:title", content: "Sprint Board — Kanban project management for teams" },
      {
        property: "og:description",
        content:
          "Plan sprints, track tasks across Todo, In Progress, Review and Done, and keep your team aligned.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: KanbanSquare,
    title: "Kanban board built in",
    description:
      "Four focused columns — Todo, In Progress, Review and Done — with priority, assignee and due dates on every card.",
  },
  {
    icon: Users,
    title: "Projects for your team",
    description:
      "Every project has an owner and a member list, so work stays organised as your team grows.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Projects and tasks are only visible to their members. Nothing leaks between teams.",
  },
];

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <KanbanSquare className="size-4" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-bold">Sprint Board</span>
          </div>
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth" search={{ mode: "signin" }}>
                  Log in
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Project management, simplified
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Ship every sprint with a board your team actually keeps up to date
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Sprint Board gives each project a clean Kanban workspace — create tasks, set
              priorities, assign owners and track progress from Todo to Done.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                {isAuthenticated ? (
                  <Link to="/dashboard">Go to your dashboard</Link>
                ) : (
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get started free
                  </Link>
                )}
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link to="/auth" search={{ mode: "signin" }}>
                  I already have an account
                </Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {["No credit card required", "Unlimited projects", "Task priorities and due dates", "Private team workspaces"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div
            aria-hidden="true"
            className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 shadow-panel sm:grid-cols-4 lg:grid-cols-2"
          >
            {boardPreview.map((column) => (
              <div key={column.title} className="rounded-lg bg-secondary/60 p-3">
                <p className="mb-2 text-xs font-semibold">{column.title}</p>
                <div className="space-y-2">
                  {column.cards.map((card) => (
                    <div key={card} className="rounded-md border bg-card px-2.5 py-2">
                      <p className="text-xs font-medium leading-snug">{card}</p>
                      <div className="mt-2 h-1.5 w-10 rounded-full bg-accent" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>



        <section className="border-t bg-card py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything a sprint needs</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              A focused foundation: projects, members, tasks and a board — without the clutter of a
              full enterprise suite.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="shadow-card">
                  <CardContent className="pt-6">
                    <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                      <feature.icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-xl border bg-card p-8 text-center shadow-card sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Start your first board today</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Create a project, invite your team later, and keep the sprint moving.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Sprint Board
        </div>
      </footer>
    </div>
  );
}

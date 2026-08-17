import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectSummary } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const percent =
    project.taskCount === 0 ? 0 : Math.round((project.doneCount / project.taskCount) * 100);

  return (
    <Card className="shadow-card transition-shadow hover:shadow-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="hover:underline"
          >
            {project.name}
          </Link>
        </CardTitle>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description || "No description yet."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
          </span>
          <span>
            {project.doneCount}/{project.taskCount} tasks done
          </span>
        </div>
        <div className="space-y-1.5">
          <Progress value={percent} aria-label={`${percent}% of tasks complete`} />
          <p className="text-xs text-muted-foreground">{percent}% complete</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  createTaskComment,
  listTaskComments,
} from "@/lib/api/comments";
import type { Task } from "@/lib/types";

export function TaskCommentsDialog({
  task,
  trigger,
}: {
  task: Task;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task-comments", task.id],
    queryFn: () => listTaskComments(task.id),
    enabled: open,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        throw new Error("You must be logged in to comment.");
      }

      return createTaskComment(task.id, user.id, content);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments", task.id],
      });

      setComment("");
    },
  });

  const handleSubmit = () => {
    const content = comment.trim();

    if (!content) return;

    createCommentMutation.mutate(content);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>

          <DialogDescription>
            Discuss "{task.title}" with your project members.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-40 max-h-72 space-y-3 overflow-y-auto rounded-md border p-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Loading comments...
            </p>
          )}

          {!isLoading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No comments yet.
            </p>
          )}

          {comments.map((item) => (
            <div
              key={item.id}
              className="rounded-md bg-muted p-3 text-sm"
            >
              <p>{item.content}</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {format(parseISO(item.created_at), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              !comment.trim() ||
              createCommentMutation.isPending
            }
          >
            {createCommentMutation.isPending
              ? "Posting..."
              : "Comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name is required").max(80, "Keep it under 80 characters"),
  description: z.string().trim().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Task title is required").max(120, "Keep it under 120 characters"),
  description: z.string().trim().max(1000, "Keep it under 1000 characters").optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type ProjectValues = z.infer<typeof projectSchema>;
export type TaskValues = z.infer<typeof taskSchema>;

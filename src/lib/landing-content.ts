import { KanbanSquare, ShieldCheck, Users, type LucideIcon } from "lucide-react";

export const features: { icon: LucideIcon; title: string; description: string }[] = [
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

export const boardPreview: { title: string; cards: string[] }[] = [
  { title: "Todo", cards: ["Draft sprint goals", "Audit onboarding copy"] },
  { title: "In Progress", cards: ["Build project settings"] },
  { title: "Review", cards: ["Board empty states"] },
  { title: "Done", cards: ["Set up design system", "Auth flows"] },
];

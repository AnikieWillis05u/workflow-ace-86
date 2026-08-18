import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarRange, Layers, Loader2, Sparkles, Target, Wand2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/common";
import { TaskCard } from "@/components/task-card";
import { Markdown } from "@/components/markdown";
import { generateTaskPlan, prioritizeTasks } from "@/lib/ai.functions";
import { uid, useApp } from "@/lib/store";
import type { Priority, Task, TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Describe a goal and get an AI-generated task plan with priorities, deadlines, subtasks and dependencies.",
      },
      { property: "og:title", content: "AI Task Planner | AI Workplace" },
      {
        property: "og:description",
        content: "Turn any goal into a prioritised, scheduled plan with AI.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Planner />
    </AppShell>
  ),
});

type RawPlan = {
  goal?: string;
  summary?: string;
  tasks?: Array<{
    title?: string;
    description?: string;
    priority?: string;
    estimatedTime?: string;
    dueDate?: string;
    dependencies?: string[];
    subtasks?: string[];
  }>;
};

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const aiActions = [
  { key: "prioritize", label: "Prioritize Tasks", icon: Zap },
  { key: "schedule", label: "Create Schedule", icon: CalendarRange },
  { key: "improve", label: "Improve My Plan", icon: Wand2 },
  { key: "next", label: "Find Next Best Task", icon: Target },
] as const;

function Planner() {
  const { state, addTask } = useApp();
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<{ label: string; content: string } | null>(null);
  const [adviceLoading, setAdviceLoading] = useState<string | null>(null);
  const [planSummary, setPlanSummary] = useState("");

  const breakDown = async () => {
    if (!goal.trim()) {
      toast.error("Describe the goal or project first");
      return;
    }
    setLoading(true);
    try {
      const res = await generateTaskPlan({ data: { goal, context, deadline } });
      const plan = JSON.parse(res.json) as RawPlan;
      const created = (plan.tasks ?? []).map((t) =>
        addTask({
          title: t.title ?? "Untitled task",
          description: t.description ?? "",
          priority: (["low", "medium", "high", "urgent"].includes(t.priority ?? "")
            ? t.priority
            : "medium") as Priority,
          estimatedTime: t.estimatedTime ?? "1h",
          dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate ?? "") ? (t.dueDate as string) : null,
          project: (plan.goal ?? goal).slice(0, 40),
          dependencies: t.dependencies ?? [],
          subtasks: (t.subtasks ?? []).map((s) => ({ id: uid(), title: s, done: false })),
        }),
      );
      setPlanSummary(plan.summary ?? "");
      toast.success(`${created.length} tasks added to your board`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate a plan");
    } finally {
      setLoading(false);
    }
  };

  const tasksAsText = (tasks: Task[]) =>
    tasks
      .map(
        (t) =>
          `- ${t.title} | priority: ${t.priority} | status: ${t.status} | due: ${t.dueDate ?? "none"} | est: ${t.estimatedTime} | project: ${t.project}${t.dependencies.length ? ` | depends on: ${t.dependencies.join(", ")}` : ""}`,
      )
      .join("\n");

  const runAdvice = async (mode: (typeof aiActions)[number]["key"], label: string) => {
    const open = state.tasks.filter((t) => t.status !== "completed");
    if (!open.length) {
      toast.error("Add some tasks first");
      return;
    }
    setAdviceLoading(mode);
    try {
      const res = await prioritizeTasks({ data: { tasks: tasksAsText(open), mode } });
      setAdvice({ label, content: res.content });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI request failed");
    } finally {
      setAdviceLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="AI Task Planner"
        description="Describe a goal — get a structured, prioritised plan you can work from."
      />

      <div className="card-surface space-y-4 p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="goal">Goal or project</Label>
            <Textarea
              id="goal"
              rows={3}
              placeholder="Prepare a marketing presentation for next week's client meeting."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-deadline">Target deadline</Label>
              <Input
                id="p-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-context">Context (optional)</Label>
              <Input
                id="p-context"
                placeholder="Team size, constraints, audience..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void breakDown()} disabled={loading} className="rounded-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Building plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Break Goal Into Tasks
              </>
            )}
          </Button>
          {aiActions.map((a) => (
            <Button
              key={a.key}
              variant="outline"
              className="rounded-full"
              disabled={adviceLoading !== null}
              onClick={() => void runAdvice(a.key, a.label)}
            >
              {adviceLoading === a.key ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <a.icon className="mr-2 size-4" />
              )}
              {a.label}
            </Button>
          ))}
        </div>
        {planSummary && <p className="text-sm text-muted-foreground">{planSummary}</p>}
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {advice && (
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-primary" /> {advice.label}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setAdvice(null)}>
              Dismiss
            </Button>
          </div>
          <div className="mt-3">
            <Markdown>{advice.content}</Markdown>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {columns.map((col) => {
          const items = state.tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl bg-muted/50 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="size-4 text-primary" /> {col.label}
                </h3>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    Nothing here yet.
                  </p>
                )}
                {items.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

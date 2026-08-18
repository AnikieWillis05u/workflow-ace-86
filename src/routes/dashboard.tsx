import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  ListTodo,
  MessagesSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/app-shell";
import { StatCard, TaskCard } from "@/components/task-card";
import { EmptyState } from "@/components/common";
import { isOverdue, priorityRank, useApp } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your productivity overview: tasks completed, pending work, meetings summarised and AI interactions.",
      },
      { property: "og:title", content: "Dashboard | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Track tasks, meetings and AI activity in one workplace dashboard.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const quickActions = [
  {
    to: "/summarizer",
    label: "Summarize Meeting",
    body: "Turn notes into decisions and action items.",
    icon: FileText,
  },
  {
    to: "/planner",
    label: "Create Task Plan",
    body: "Break a goal into a prioritised plan.",
    icon: Sparkles,
  },
  { to: "/chat", label: "Ask AI", body: "Draft, summarise and prioritise.", icon: Bot },
] as const;

function Dashboard() {
  const { state } = useApp();
  const { tasks, meetings, conversations } = state;

  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status !== "completed");
  const overdue = tasks.filter(isOverdue);
  const aiMessages = conversations.reduce(
    (n, c) => n + c.messages.filter((m) => m.role === "user").length,
    0,
  );
  const rate = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      completed: completed.filter((t) => (t.completedAt ?? "").slice(0, 10) === key).length,
    };
  });

  const focus = [...pending]
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] ||
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
    )
    .slice(0, 3);

  const activity = [
    ...meetings.map((m) => ({
      id: m.id,
      text: `Summarised “${m.title}”`,
      time: m.date,
      icon: FileText,
    })),
    ...completed.slice(0, 3).map((t) => ({
      id: t.id,
      text: `Completed “${t.title}”`,
      time: (t.completedAt ?? "").slice(0, 10),
      icon: CheckCircle2,
    })),
    ...conversations
      .filter((c) => c.messages.length)
      .slice(0, 2)
      .map((c) => ({
        id: c.id,
        text: `AI conversation: ${c.title}`,
        time: c.updatedAt.slice(0, 10),
        icon: MessagesSquare,
      })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="card-surface gradient-brand relative overflow-hidden p-6 text-primary-foreground sm:p-8">
        <p className="text-sm opacity-90">{greeting()}, {state.user.name.split(" ")[0]} 👋</p>
        <h1 className="mt-2 max-w-xl text-2xl font-semibold sm:text-3xl">
          You have {pending.length} open tasks and {overdue.length} needing attention today.
        </h1>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {quickActions.map((a) => (
            <Button
              key={a.to}
              asChild
              variant="secondary"
              className="rounded-full transition-transform hover:-translate-y-0.5"
            >
              <Link to={a.to}>
                <a.icon className="mr-2 size-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Tasks completed"
          value={completed.length}
          hint="This week"
        />
        <StatCard icon={ListTodo} label="Pending tasks" value={pending.length} hint={`${overdue.length} overdue`} />
        <StatCard icon={FileText} label="Meetings summarised" value={meetings.length} />
        <StatCard icon={MessagesSquare} label="AI interactions" value={aiMessages} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Productivity trend</h2>
              <p className="text-xs text-muted-foreground">Tasks completed over the last 7 days</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
              <TrendingUp className="size-3.5" /> {rate}% completion
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <RTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    color: "var(--color-card-foreground)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#fillCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Completion rate</span>
              <span>{rate}%</span>
            </div>
            <Progress value={rate} />
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <div className="mt-4 space-y-4">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {activity.map((a) => (
              <div key={a.id + a.text} className="flex gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <a.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Today's focus</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/tasks">
              View all tasks <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        {focus.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {focus.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="Nothing pending"
            description="Create a task plan with AI to fill your day with meaningful work."
            action={
              <Button asChild>
                <Link to="/planner">Create Task Plan</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeading } from "@/components/common";
import { TaskCard } from "@/components/task-card";
import { isOverdue, isToday, priorityRank, useApp } from "@/lib/store";
import type { Priority, TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "My Tasks | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Manage, filter and prioritise your workplace tasks in one place.",
      },
      { property: "og:title", content: "My Tasks | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Filter, sort and manage tasks with an AI-powered workplace assistant.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Tasks />
    </AppShell>
  ),
});

type Bucket = "all" | "today" | "upcoming" | "overdue" | "completed";

const filters: { label: string; value: Bucket }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Overdue", value: "overdue" },
  { label: "Completed", value: "completed" },
];

function Tasks() {
  const { state, addTask, deleteTask } = useApp();
  const [bucket, setBucket] = useState<Bucket>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<"priority" | "due" | "created">("priority");

  const filtered = useMemo(() => {
    let list = state.tasks.filter((t) => {
      const matchesQuery =
        !query ||
        `${t.title} ${t.description} ${t.project}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
      let matchesBucket = true;
      if (bucket === "today") matchesBucket = isToday(t);
      else if (bucket === "upcoming") matchesBucket = !isToday(t) && !isOverdue(t) && t.status !== "completed";
      else if (bucket === "overdue") matchesBucket = isOverdue(t);
      else if (bucket === "completed") matchesBucket = t.status === "completed";
      return matchesQuery && matchesStatus && matchesPriority && matchesBucket;
    });

    list.sort((a, b) => {
      if (sortBy === "priority") {
        return (
          priorityRank[a.priority] - priorityRank[b.priority] ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
        );
      }
      if (sortBy === "due") {
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [state.tasks, bucket, query, statusFilter, priorityFilter, sortBy]);

  const clearFilters = () => {
    setBucket("all");
    setQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("priority");
  };

  const hasFilters = bucket !== "all" || query || statusFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Tasks"
        description="Organise, filter and prioritise your work."
        action={
          <Button
            onClick={() => {
              const task = addTask({ title: "New task", priority: "medium" });
              toast.success("Task created", { description: task.title });
            }}
          >
            <Plus className="mr-2 size-4" /> New task
          </Button>
        }
      />

      <div className="card-surface space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={bucket === f.value ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setBucket(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | "all")}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due">Due date</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1 text-xs">
              <X className="size-3.5" /> Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ListTodo className="size-3.5" /> {filtered.length} shown
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" />
            {state.tasks.filter((t) => t.status === "completed").length} completed
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {state.tasks.filter(isOverdue).length} overdue
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {state.tasks.filter(isToday).length} due today
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No tasks match"
          description={
            hasFilters
              ? "Try clearing filters or create a new task to get started."
              : "Your task list is empty. Create a task or generate a plan from a meeting."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/planner">Create a task plan</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

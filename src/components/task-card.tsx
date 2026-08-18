import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from "@/components/common";
import { isOverdue, uid, useApp } from "@/lib/store";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskCard({ task }: { task: Task }) {
  const { updateTask, deleteTask, setTaskStatus } = useApp();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(task);
  const [newSubtask, setNewSubtask] = useState("");
  const overdue = isOverdue(task);

  const openEdit = () => {
    setDraft(task);
    setEditing(true);
  };

  const save = () => {
    updateTask(task.id, draft);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "card-surface p-4 hover:-translate-y-0.5 hover:shadow-lift",
        task.status === "completed" && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={(v) => setTaskStatus(task.id, v ? "completed" : "todo")}
          aria-label="Mark task complete"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              task.status === "completed" && "line-through",
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  overdue && "font-medium text-destructive",
                )}
              >
                <CalendarDays className="size-3.5" /> {task.dueDate}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {task.estimatedTime}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">{task.project}</span>
          </div>
          {task.subtasks.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {task.subtasks.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={(v) =>
                      updateTask(task.id, {
                        subtasks: task.subtasks.map((x) =>
                          x.id === s.id ? { ...x, done: Boolean(v) } : x,
                        ),
                      })
                    }
                  />
                  <span className={cn(s.done && "text-muted-foreground line-through")}>
                    {s.title}
                  </span>
                </label>
              ))}
            </div>
          )}
          {task.dependencies.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Depends on: {task.dependencies.join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Edit task" onClick={openEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete task"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
        {(["todo", "in_progress", "completed"] as TaskStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={task.status === s ? "default" : "outline"}
            className="h-7 rounded-full px-3 text-[11px]"
            onClick={() => setTaskStatus(task.id, s)}
          >
            {task.status === s && <Check className="mr-1 size-3" />}
            {s === "todo" ? "To do" : s === "in_progress" ? "In progress" : "Completed"}
          </Button>
        ))}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-title">Title</Label>
              <Input
                id="t-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea
                id="t-desc"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["urgent", "high", "medium", "low"].map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-due">Due date</Label>
                <Input
                  id="t-due"
                  type="date"
                  value={draft.dueDate ?? ""}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-est">Estimated time</Label>
                <Input
                  id="t-est"
                  value={draft.estimatedTime}
                  onChange={(e) => setDraft({ ...draft, estimatedTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-proj">Project</Label>
                <Input
                  id="t-proj"
                  value={draft.project}
                  onChange={(e) => setDraft({ ...draft, project: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-notes">Notes</Label>
              <Textarea
                id="t-notes"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtasks</Label>
              {draft.subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Input
                    value={s.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        subtasks: draft.subtasks.map((x) =>
                          x.id === s.id ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove subtask"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        subtasks: draft.subtasks.filter((x) => x.id !== s.id),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!newSubtask.trim()) return;
                    setDraft({
                      ...draft,
                      subtasks: [
                        ...draft.subtasks,
                        { id: uid(), title: newSubtask.trim(), done: false },
                      ],
                    });
                    setNewSubtask("");
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task.title}” will be permanently removed from your workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTask(task.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card-surface p-5 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

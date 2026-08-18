import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  ListPlus,
  MoreHorizontal,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeading, PriorityBadge } from "@/components/common";
import { SummaryView, summaryToText } from "@/components/summary-view";
import { useApp } from "@/lib/store";
import type { Meeting } from "@/lib/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Meeting History | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Browse previous meeting summaries, action items and follow-ups.",
      },
      { property: "og:title", content: "Meeting History | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Search and revisit AI-generated meeting summaries and action items.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <History />
    </AppShell>
  ),
});

function History() {
  const { state, deleteMeeting, convertActionItems } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Meeting | null>(null);

  const meetings = useMemo(() => {
    return state.meetings
      .filter(
        (m) =>
          !query ||
          `${m.title} ${m.type} ${m.summary.overview} ${m.attendees.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.meetings, query]);

  const exportMeeting = (m: Meeting) => {
    const blob = new Blob([summaryToText(m.summary, m.title)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${m.title.replace(/\s+/g, "-").toLowerCase()}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary exported");
  };

  const convert = (m: Meeting) => {
    const count = convertActionItems(m.id, m.summary.actionItems, m.title);
    toast.success(`${count} action items converted to tasks`);
    void navigate({ to: "/tasks" });
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Meeting History"
        description="Revisit past summaries and follow up on action items."
      />

      <div className="card-surface p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search meetings by title, type, attendees or summary..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No meetings yet"
          description="Summarise your first meeting and it will appear here."
          action={
            <Button asChild>
              <Link to="/summarizer">Summarize a meeting</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meetings.map((m) => (
            <div key={m.id} className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewing(m)}>
                      <FileText className="mr-2 size-4" /> Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void navigator.clipboard.writeText(summaryToText(m.summary, m.title));
                        toast.success("Copied summary");
                      }}
                    >
                      <Copy className="mr-2 size-4" /> Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportMeeting(m)}>
                      <Download className="mr-2 size-4" /> Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => convert(m)}>
                      <ListPlus className="mr-2 size-4" /> Convert to tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        deleteMeeting(m.id);
                        toast.success("Meeting deleted");
                      }}
                    >
                      <Trash2 className="mr-2 size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="mt-3 line-clamp-1 text-base font-semibold">{m.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{m.summary.overview}</p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <CalendarClock className="size-3.5" /> {m.date}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <Users className="size-3.5" /> {m.attendees.length}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <CheckCircle2 className="size-3.5" /> {m.summary.actionItems.length} actions
                </span>
              </div>

              {m.summary.actionItems.length > 0 && (
                <div className="mt-4 space-y-2">
                  {m.summary.actionItems.slice(0, 3).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span className="line-clamp-1">{a.task}</span>
                      <PriorityBadge priority={a.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{viewing.date}</span>
                <span>·</span>
                <span>{viewing.type}</span>
                <span>·</span>
                <span>{viewing.attendees.join(", ")}</span>
              </div>
              <SummaryView summary={viewing.summary} />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => exportMeeting(viewing)}>
                  <Download className="mr-1.5 size-4" /> Export
                </Button>
                <Button size="sm" onClick={() => convert(viewing)}>
                  <ListPlus className="mr-1.5 size-4" /> Convert to tasks
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

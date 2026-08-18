import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Copy,
  Download,
  FileText,
  ListPlus,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Save,
  Share2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/common";
import { SummaryView, summaryToText } from "@/components/summary-view";
import { summarizeMeeting } from "@/lib/ai.functions";
import { uid, useApp } from "@/lib/store";
import type { Meeting, MeetingSummary, Priority } from "@/lib/types";

export const Route = createFileRoute("/summarizer")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Paste meeting notes or a transcript and get an AI summary with decisions, action items and follow-ups.",
      },
      { property: "og:title", content: "Meeting Summarizer | AI Workplace" },
      {
        property: "og:description",
        content: "AI-generated meeting overviews, decisions and action items in seconds.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Summarizer />
    </AppShell>
  ),
});

const meetingTypes = [
  "Team Standup",
  "Client Meeting",
  "Project Review",
  "1:1",
  "Workshop",
  "Board Meeting",
  "Retrospective",
];

type RawSummary = {
  overview?: string;
  keyPoints?: string[];
  decisions?: string[];
  actionItems?: Array<{
    task?: string;
    assignee?: string;
    deadline?: string;
    priority?: string;
  }>;
  followUps?: string[];
  openQuestions?: string[];
};

function normalize(raw: RawSummary): MeetingSummary {
  return {
    overview: raw.overview ?? "",
    keyPoints: raw.keyPoints ?? [],
    decisions: raw.decisions ?? [],
    actionItems: (raw.actionItems ?? []).map((a) => ({
      id: uid(),
      task: a.task ?? "Untitled action",
      assignee: a.assignee || "Unassigned",
      deadline: a.deadline || "TBD",
      priority: (["low", "medium", "high", "urgent"].includes(a.priority ?? "")
        ? a.priority
        : "medium") as Priority,
    })),
    followUps: raw.followUps ?? [],
    openQuestions: raw.openQuestions ?? [],
  };
}

function Summarizer() {
  const { state, addMeeting, updateMeeting, convertActionItems, pushNotification } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendees, setAttendees] = useState("");
  const [type, setType] = useState<string>("Team Standup");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setNotes(text);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    toast.success("File loaded into the editor");
  };

  const run = async () => {
    if (!notes.trim()) {
      toast.error("Paste your meeting notes or transcript first");
      return;
    }
    setLoading(true);
    setSummary(null);
    setSavedId(null);
    try {
      const res = await summarizeMeeting({
        data: {
          title,
          date,
          attendees,
          meetingType: type,
          notes,
          tone: state.preferences.tone,
          detail: state.preferences.detail,
        },
      });
      const parsed = normalize(JSON.parse(res.json) as RawSummary);
      setSummary(parsed);
      toast.success("Summary ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not summarise this meeting");
    } finally {
      setLoading(false);
    }
  };

  const meetingRecord = (s: MeetingSummary): Meeting => ({
    id: savedId ?? uid(),
    title: title.trim() || "Untitled meeting",
    date,
    attendees: attendees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean),
    type,
    transcript: notes,
    summary: s,
    createdAt: new Date().toISOString(),
    status: "summarized",
  });

  const save = () => {
    if (!summary) return;
    const record = meetingRecord(summary);
    if (savedId) {
      updateMeeting(savedId, record);
      toast.success("Meeting history updated");
      return;
    }
    addMeeting(record);
    setSavedId(record.id);
    pushNotification({
      title: "Meeting summary ready",
      body: `${record.title} saved with ${summary.actionItems.length} action items.`,
      kind: "meeting",
    });
    toast.success("Saved to Meeting History");
  };

  const convert = () => {
    if (!summary) return;
    let id = savedId;
    if (!id) {
      const record = meetingRecord(summary);
      addMeeting(record);
      setSavedId(record.id);
      id = record.id;
    }
    const count = convertActionItems(id, summary.actionItems, title.trim() || "Meeting");
    toast.success(`${count} action items added to your task planner`);
    void navigate({ to: "/tasks" });
  };

  const sendToChat = () => {
    if (!summary) return;
    sessionStorage.setItem(
      "awpa-chat-prefill",
      `Here is a meeting summary. Help me with follow-up questions:\n\n${summaryToText(summary, title)}`,
    );
    void navigate({ to: "/chat" });
  };

  const exportSummary = () => {
    if (!summary) return;
    const blob = new Blob([summaryToText(summary, title)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "meeting").replace(/\s+/g, "-").toLowerCase()}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary exported");
  };

  const share = async () => {
    if (!summary) return;
    const text = summaryToText(summary, title);
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "Meeting summary", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied — ready to share");
    } catch {
      toast.error("Sharing was cancelled");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Meeting Notes Summarizer"
        description="Paste notes or a transcript and let AI structure the outcome."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="card-surface space-y-4 p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="m-title">Meeting title</Label>
              <Input
                id="m-title"
                placeholder="Q3 Client Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-date">Date</Label>
              <Input
                id="m-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meeting type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="m-att">Attendees</Label>
              <Input
                id="m-att"
                placeholder="Comma separated names"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="m-notes">Notes or transcript</Label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Upload className="size-3.5" /> Upload file
                <input
                  type="file"
                  accept=".txt,.md,.csv,.json,.vtt,.srt"
                  className="hidden"
                  onChange={(e) => void onFile(e.target.files?.[0])}
                />
              </label>
            </div>
            <Textarea
              id="m-notes"
              rows={14}
              placeholder="Paste your raw meeting notes or full transcript here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-y"
            />
          </div>

          <Button onClick={() => void run()} disabled={loading} className="w-full rounded-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Summarizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Summarize with AI
              </>
            )}
          </Button>
        </div>

        <div className="lg:col-span-3">
          {loading && (
            <div className="card-surface space-y-4 p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {!loading && !summary && (
            <div className="card-surface flex h-full min-h-80 flex-col items-center justify-center p-10 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Your AI summary appears here</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Overview, key points, decisions, action items, follow-ups and open questions —
                neatly structured.
              </p>
            </div>
          )}

          {!loading && summary && (
            <div className="card-surface space-y-5 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(summaryToText(summary, title));
                    toast.success("Summary copied");
                  }}
                >
                  <Copy className="mr-1.5 size-4" /> Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditText(summary.overview);
                    setEditing(!editing);
                  }}
                >
                  <Pencil className="mr-1.5 size-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={exportSummary}>
                  <Download className="mr-1.5 size-4" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => void share()}>
                  <Share2 className="mr-1.5 size-4" /> Share
                </Button>
                <Button variant="outline" size="sm" onClick={save}>
                  <Save className="mr-1.5 size-4" /> Save to history
                </Button>
                <Button variant="outline" size="sm" onClick={sendToChat}>
                  <MessageSquarePlus className="mr-1.5 size-4" /> Ask AI
                </Button>
                <Button size="sm" onClick={convert}>
                  <ListPlus className="mr-1.5 size-4" /> Convert action items to tasks
                </Button>
              </div>

              {editing && (
                <div className="space-y-2 rounded-xl bg-muted/60 p-4">
                  <Label htmlFor="edit-overview">Edit overview</Label>
                  <Textarea
                    id="edit-overview"
                    rows={4}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSummary({ ...summary, overview: editText });
                        setEditing(false);
                        toast.success("Summary updated");
                      }}
                    >
                      Save edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <SummaryView summary={summary} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

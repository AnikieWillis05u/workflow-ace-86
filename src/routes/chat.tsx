import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Copy,
  Loader2,
  Paperclip,
  Plus,
  RefreshCcw,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { AppShell } from "@/components/app-shell";
import { Markdown } from "@/components/markdown";
import { chatWithAssistant } from "@/lib/ai.functions";
import { isOverdue, uid, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Chat with a workplace AI assistant that knows your tasks and meetings — draft emails, agendas and plans.",
      },
      { property: "og:title", content: "AI Chat | AI Workplace" },
      {
        property: "og:description",
        content: "A workplace copilot for emails, agendas, summaries and prioritisation.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Chat />
    </AppShell>
  ),
});

const suggestions = [
  "Summarize this document",
  "Create a task plan",
  "Draft a professional email",
  "Prepare a meeting agenda",
  "Help me prioritize my tasks",
];

function Chat() {
  const {
    state,
    newConversation,
    setActiveConversation,
    updateConversation,
    deleteConversation,
  } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const active =
    state.conversations.find((c) => c.id === state.activeConversationId) ?? state.conversations[0];

  useEffect(() => {
    const prefill = sessionStorage.getItem("awpa-chat-prefill");
    if (prefill) {
      setInput(prefill);
      sessionStorage.removeItem("awpa-chat-prefill");
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, loading]);

  const workspaceContext = useMemo(() => {
    const open = state.tasks.filter((t) => t.status !== "completed");
    return [
      `User: ${state.user.name} (${state.user.role}).`,
      `Open tasks (${open.length}):`,
      ...open
        .slice(0, 15)
        .map(
          (t) =>
            `- ${t.title} | ${t.priority} | due ${t.dueDate ?? "none"}${isOverdue(t) ? " (OVERDUE)" : ""} | project ${t.project}`,
        ),
      `Recent meetings:`,
      ...state.meetings
        .slice(0, 3)
        .map((m) => `- ${m.title} (${m.date}): ${m.summary.overview}`),
    ].join("\n");
  }, [state.tasks, state.meetings, state.user]);

  const send = async (text: string, replaceLast = false) => {
    if (!active || !text.trim() || loading) return;
    const base = replaceLast
      ? active.messages.slice(0, active.messages.findLastIndex((m) => m.role === "assistant"))
      : active.messages;
    const history: ChatMessage[] = replaceLast
      ? base
      : [
          ...base,
          { id: uid(), role: "user", content: text.trim(), createdAt: new Date().toISOString() },
        ];

    updateConversation(active.id, {
      messages: history,
      title:
        active.title === "New conversation"
          ? text.trim().slice(0, 42) || "New conversation"
          : active.title,
    });
    setInput("");
    setLoading(true);
    try {
      const res = await chatWithAssistant({
        data: {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context: workspaceContext,
        },
      });
      updateConversation(active.id, {
        messages: [
          ...history,
          {
            id: uid(),
            role: "assistant",
            content: res.content,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The assistant could not respond");
      updateConversation(active.id, { messages: history });
    } finally {
      setLoading(false);
    }
  };

  const attach = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setInput((prev) => `${prev}\n\n--- ${file.name} ---\n${text}`.trim());
    toast.success(`${file.name} attached`);
  };

  const regenerate = () => {
    if (!active) return;
    const lastUser = [...active.messages].reverse().find((m) => m.role === "user");
    if (lastUser) void send(lastUser.content, true);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-4">
      <aside className="card-surface hidden max-h-[75vh] flex-col p-3 lg:flex">
        <Button className="w-full rounded-full" onClick={() => newConversation()}>
          <Plus className="mr-2 size-4" /> New chat
        </Button>
        <ScrollArea className="mt-3 flex-1">
          <div className="space-y-1 pr-2">
            {state.conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConversation(c.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  c.id === active?.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <Trash2
                  className="size-3.5 shrink-0 opacity-60 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <section className="card-surface flex h-[75vh] flex-col overflow-hidden lg:col-span-3">
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <div className="grid size-9 place-items-center rounded-xl gradient-brand text-primary-foreground">
            <Bot className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{active?.title ?? "AI Assistant"}</p>
            <p className="text-xs text-muted-foreground">Knows your tasks and meetings</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => newConversation()} className="lg:hidden">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            Clear
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-4 py-5 sm:px-6">
            {(!active || active.messages.length === 0) && (
              <div className="py-10 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl gradient-brand text-primary-foreground">
                  <Bot className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">How can I help you today?</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Ask me to draft emails, prep agendas, summarise documents or prioritise your day.
                </p>
              </div>
            )}
            {active?.messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-soft">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Bot className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Markdown>{m.content}</Markdown>
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          void navigator.clipboard.writeText(m.content);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="mr-1 size-3.5" /> Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={regenerate}
                      >
                        <RefreshCcw className="mr-1 size-3.5" /> Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
            {loading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Bot className="size-4" />
                </div>
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-3.5 animate-spin" /> Thinking...
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-3 sm:p-4">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <label
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
              <input
                type="file"
                accept=".txt,.md,.csv,.json"
                className="hidden"
                onChange={(e) => void attach(e.target.files?.[0])}
              />
            </label>
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask anything about your work..."
              className="max-h-40 min-h-10 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0 rounded-xl"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SendHorizontal className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </section>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              All messages in this thread will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (active) updateConversation(active.id, { messages: [] });
                toast.success("Conversation cleared");
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

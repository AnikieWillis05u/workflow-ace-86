import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, CalendarCheck, ListChecks, MessagesSquare, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant — Work Smarter with AI" },
      {
        name: "description",
        content:
          "One AI assistant for your entire workday: summarise meetings, plan tasks and chat with an intelligent workplace copilot.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Summarise meetings, generate task plans and chat with an AI copilot — all in one workspace.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: CalendarCheck,
    title: "Meeting Notes Summarizer",
    body: "Turn messy notes into structured summaries, decisions and action items in seconds.",
  },
  {
    icon: ListChecks,
    title: "AI Task Planner",
    body: "Describe a goal and get a prioritised plan with deadlines, subtasks and dependencies.",
  },
  {
    icon: MessagesSquare,
    title: "AI Chat Assistant",
    body: "Draft emails, prep agendas and prioritise your day — with your workspace as context.",
  },
];

function Landing() {
  const { state, ready, signIn } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (ready && state.authed) void navigate({ to: "/dashboard" });
  }, [ready, state.authed, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(name, email);
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
            <Bot className="size-5" />
          </div>
          <span className="font-display text-sm font-semibold sm:text-base">
            AI Workplace Productivity Assistant
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setMode("signin");
            setOpen(true);
          }}
        >
          Sign In
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <section className="animate-rise pt-10 text-center sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Zap className="size-3.5 text-primary" /> One AI assistant for your entire workday
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Work Smarter. <span className="text-gradient-brand">Get More Done with AI.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Your intelligent workplace assistant for meetings, tasks, projects, and everyday
            productivity.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="w-full rounded-full px-8 shadow-soft transition-transform hover:-translate-y-0.5 sm:w-auto"
              onClick={() => {
                setMode("signup");
                setOpen(true);
              }}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-full px-8 sm:w-auto"
              onClick={() => {
                setMode("signin");
                setOpen(true);
              }}
            >
              Sign In
            </Button>
          </div>
        </section>

        <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-surface p-6 hover:-translate-y-1 hover:shadow-lift">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Private by design
          </span>
          <span>Meetings → Tasks → Chat, fully connected</span>
          <span>Works on desktop, tablet and mobile</span>
        </section>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "signup" ? "Create your workspace" : "Welcome back"}</DialogTitle>
            <DialogDescription>
              {mode === "signup"
                ? "Set up your assistant in seconds — no credit card needed."
                : "Sign in to pick up where you left off."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Anikie Willis"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full rounded-full">
              {mode === "signup" ? "Get Started" : "Sign In"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

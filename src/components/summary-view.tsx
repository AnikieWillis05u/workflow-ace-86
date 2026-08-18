import {
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Flag,
  ListChecks,
  Repeat2,
} from "lucide-react";
import { PriorityBadge } from "@/components/common";
import type { MeetingSummary } from "@/lib/types";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Flag;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None captured.</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function SummaryView({ summary }: { summary: MeetingSummary }) {
  return (
    <div className="space-y-5">
      <Section icon={ClipboardList} title="Meeting overview">
        <p className="text-sm leading-relaxed text-muted-foreground">{summary.overview}</p>
      </Section>
      <Section icon={ListChecks} title="Key discussion points">
        <Bullets items={summary.keyPoints} />
      </Section>
      <Section icon={CheckCircle2} title="Decisions made">
        <Bullets items={summary.decisions} />
      </Section>
      <Section icon={Flag} title="Action items">
        {summary.actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No action items.</p>
        ) : (
          <div className="space-y-2">
            {summary.actionItems.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 font-medium">{a.task}</span>
                <span className="text-xs text-muted-foreground">{a.assignee}</span>
                <span className="text-xs text-muted-foreground">{a.deadline}</span>
                <PriorityBadge priority={a.priority} />
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section icon={Repeat2} title="Important follow-ups">
        <Bullets items={summary.followUps} />
      </Section>
      <Section icon={CircleHelp} title="Questions & open issues">
        <Bullets items={summary.openQuestions} />
      </Section>
    </div>
  );
}

export function summaryToText(summary: MeetingSummary, title: string) {
  const lines = [
    `# ${title || "Meeting summary"}`,
    "",
    "## Overview",
    summary.overview,
    "",
    "## Key discussion points",
    ...summary.keyPoints.map((k) => `- ${k}`),
    "",
    "## Decisions made",
    ...summary.decisions.map((d) => `- ${d}`),
    "",
    "## Action items",
    ...summary.actionItems.map(
      (a) => `- ${a.task} — ${a.assignee} — due ${a.deadline} — ${a.priority}`,
    ),
    "",
    "## Important follow-ups",
    ...summary.followUps.map((f) => `- ${f}`),
    "",
    "## Questions & open issues",
    ...summary.openQuestions.map((q) => `- ${q}`),
  ];
  return lines.join("\n");
}

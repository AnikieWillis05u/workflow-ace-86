import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AiError, callGateway, extractJson } from "./ai.server";

const SummarizeSchema = z.object({
  title: z.string(),
  date: z.string(),
  attendees: z.string(),
  meetingType: z.string(),
  notes: z.string().min(1),
  tone: z.string().optional(),
  detail: z.string().optional(),
});

const PlanSchema = z.object({
  goal: z.string().min(1),
  context: z.string().optional(),
  deadline: z.string().optional(),
});

const ChatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  context: z.string().optional(),
});

const PrioritizeSchema = z.object({
  tasks: z.string().min(1),
  mode: z.enum(["prioritize", "schedule", "improve", "next"]),
});

function fail(error: unknown): never {
  if (error instanceof AiError) throw new Error(error.message);
  throw new Error(error instanceof Error ? error.message : "AI request failed.");
}

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummarizeSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content:
              "You are an expert executive assistant that turns raw meeting notes into structured summaries. " +
              `Write in a ${data.tone ?? "professional"} tone with ${data.detail ?? "balanced"} detail. ` +
              'Reply ONLY with JSON matching: {"overview": string, "keyPoints": string[], "decisions": string[], ' +
              '"actionItems": [{"task": string, "assignee": string, "deadline": string, "priority": "low"|"medium"|"high"|"urgent"}], ' +
              '"followUps": string[], "openQuestions": string[]}. Use "Unassigned" and "TBD" when unknown.',
          },
          {
            role: "user",
            content: `Meeting title: ${data.title || "Untitled meeting"}\nDate: ${data.date}\nType: ${data.meetingType}\nAttendees: ${data.attendees}\n\nNotes / transcript:\n${data.notes}`,
          },
        ],
        true,
      );
      return { json: JSON.stringify(extractJson<Record<string, unknown>>(raw)) };
    } catch (error) {
      fail(error);
    }
  });

export const generateTaskPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content:
              "You are an expert project planner. Break the user's goal into an actionable plan of 4-8 tasks. " +
              'Reply ONLY with JSON: {"goal": string, "summary": string, "tasks": [{"title": string, "description": string, ' +
              '"priority": "low"|"medium"|"high"|"urgent", "estimatedTime": string, "dueDate": "YYYY-MM-DD", ' +
              '"dependencies": string[], "subtasks": string[]}]}. Order tasks logically and set realistic deadlines.',
          },
          {
            role: "user",
            content: `Today is ${new Date().toISOString().slice(0, 10)}.\nGoal: ${data.goal}\nContext: ${data.context || "none"}\nTarget deadline: ${data.deadline || "not specified"}`,
          },
        ],
        true,
      );
      return { json: JSON.stringify(extractJson<Record<string, unknown>>(raw)) };
    } catch (error) {
      fail(error);
    }
  });

export const prioritizeTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PrioritizeSchema.parse(input))
  .handler(async ({ data }) => {
    const instruction =
      data.mode === "prioritize"
        ? "Rank the tasks by urgency, importance, deadlines and dependencies. Explain the ordering briefly."
        : data.mode === "schedule"
          ? "Build a realistic day-by-day schedule for the next week covering these tasks."
          : data.mode === "improve"
            ? "Critique the plan and suggest concrete improvements, missing steps and risks."
            : "Pick the single next best task to work on right now and justify it in 3 sentences.";
    try {
      const content = await callGateway([
        {
          role: "system",
          content: `You are a productivity coach. ${instruction} Answer in concise markdown.`,
        },
        { role: "user", content: `Today is ${new Date().toDateString()}.\nTasks:\n${data.tasks}` },
      ]);
      return { content };
    } catch (error) {
      fail(error);
    }
  });

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const content = await callGateway([
        {
          role: "system",
          content:
            "You are the AI Workplace Productivity Assistant: a friendly, sharp workplace copilot. " +
            "You help with emails, summaries, task lists, agendas, reports, brainstorming and prioritisation. " +
            "Answer in clean markdown, be concise and actionable.\n\n" +
            `Workspace context (use when relevant):\n${data.context || "No workspace data available."}`,
        },
        ...data.messages,
      ]);
      return { content };
    } catch (error) {
      fail(error);
    }
  });

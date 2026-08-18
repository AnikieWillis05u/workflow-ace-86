import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionItem,
  AppNotification,
  Conversation,
  Meeting,
  Preferences,
  Priority,
  Task,
  TaskStatus,
  UserProfile,
} from "./types";

const STORAGE_KEY = "awpa-state-v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export type AppState = {
  authed: boolean;
  user: UserProfile;
  preferences: Preferences;
  tasks: Task[];
  meetings: Meeting[];
  conversations: Conversation[];
  notifications: AppNotification[];
  activeConversationId: string | null;
};

function seedState(): AppState {
  const convId = uid();
  return {
    authed: false,
    user: {
      id: uid(),
      name: "Anikie Willis",
      email: "anikie@northwind.io",
      role: "Product Operations Lead",
      avatar: "",
    },
    preferences: {
      theme: "light",
      tone: "professional",
      detail: "balanced",
      autoConvertActionItems: false,
      emailNotifications: true,
      deadlineReminders: true,
      weeklyDigest: false,
      storeHistory: true,
    },
    tasks: [
      {
        id: uid(),
        title: "Draft Q3 client presentation outline",
        description: "Structure the narrative, key metrics and closing ask.",
        priority: "high",
        status: "in_progress",
        dueDate: dayOffset(1),
        estimatedTime: "2h",
        project: "Client Renewal",
        notes: "",
        subtasks: [
          { id: uid(), title: "Collect Q2 performance data", done: true },
          { id: uid(), title: "Write executive summary", done: false },
        ],
        dependencies: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: uid(),
        title: "Review onboarding feedback survey",
        description: "Summarise themes from the 42 responses collected last sprint.",
        priority: "medium",
        status: "todo",
        dueDate: dayOffset(3),
        estimatedTime: "1h 30m",
        project: "Customer Experience",
        notes: "",
        subtasks: [],
        dependencies: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: uid(),
        title: "Send vendor contract for legal review",
        description: "Contract renewal needs sign-off before month end.",
        priority: "urgent",
        status: "todo",
        dueDate: dayOffset(-1),
        estimatedTime: "30m",
        project: "Operations",
        notes: "",
        subtasks: [],
        dependencies: [],
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
      {
        id: uid(),
        title: "Publish weekly team update",
        description: "Share highlights, blockers and next week's focus.",
        priority: "low",
        status: "completed",
        dueDate: dayOffset(-2),
        estimatedTime: "45m",
        project: "Team",
        notes: "",
        subtasks: [],
        dependencies: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        id: uid(),
        title: "Prepare roadmap review deck",
        description: "Align product roadmap with leadership priorities.",
        priority: "high",
        status: "completed",
        dueDate: dayOffset(-4),
        estimatedTime: "3h",
        project: "Product",
        notes: "",
        subtasks: [],
        dependencies: [],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
    ],
    meetings: [
      {
        id: uid(),
        title: "Weekly Product Sync",
        date: dayOffset(-2),
        attendees: ["Anikie Willis", "Sam Rivera", "Priya Naidoo", "Tom Baker"],
        type: "Team Standup",
        transcript: "Discussion of sprint progress, launch blockers and QA capacity.",
        summary: {
          overview:
            "The team reviewed sprint progress, agreed to delay the analytics module by one week and confirmed QA capacity for the launch build.",
          keyPoints: [
            "Sprint is 78% complete with two carry-over stories.",
            "Analytics module blocked by a third-party API change.",
            "QA has capacity for a full regression pass on Thursday.",
          ],
          decisions: [
            "Delay the analytics module to next sprint.",
            "Run the regression pass before the release candidate build.",
          ],
          actionItems: [
            {
              id: uid(),
              task: "Coordinate regression pass with QA",
              assignee: "Priya Naidoo",
              deadline: dayOffset(2),
              priority: "high",
            },
            {
              id: uid(),
              task: "Document the API change impact",
              assignee: "Sam Rivera",
              deadline: dayOffset(4),
              priority: "medium",
            },
          ],
          followUps: ["Confirm launch comms plan with marketing."],
          openQuestions: ["Do we need a fallback if the vendor API slips again?"],
        },
        createdAt: new Date().toISOString(),
        status: "summarized",
      },
    ],
    conversations: [
      {
        id: convId,
        title: "New conversation",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: uid(),
        title: "Task overdue",
        body: "“Send vendor contract for legal review” passed its deadline.",
        kind: "overdue",
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: uid(),
        title: "Meeting summary ready",
        body: "Weekly Product Sync has been summarised with 2 action items.",
        kind: "meeting",
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: uid(),
        title: "AI recommendation",
        body: "Start with the Q3 client presentation outline — it's due tomorrow.",
        kind: "ai",
        createdAt: new Date().toISOString(),
        read: true,
      },
    ],
    activeConversationId: convId,
  };
}

type Ctx = {
  state: AppState;
  ready: boolean;
  setState: (updater: (prev: AppState) => AppState) => void;
  signIn: (name?: string, email?: string) => void;
  signOut: () => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  toggleTheme: () => void;
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  convertActionItems: (meetingId: string, items: ActionItem[], project: string) => number;
  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markNotificationsRead: () => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setInternal] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInternal({ ...seedState(), ...(JSON.parse(raw) as AppState) });
    } catch {
      /* ignore corrupt state */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full */
    }
  }, [state, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", state.preferences.theme === "dark");
  }, [state.preferences.theme, ready]);

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    setInternal((prev) => updater(prev));
  }, []);

  const value = useMemo<Ctx>(() => {
    const patch = (fn: (prev: AppState) => AppState) => setInternal(fn);
    return {
      state,
      ready,
      setState,
      signIn: (name, email) =>
        patch((p) => ({
          ...p,
          authed: true,
          user: {
            ...p.user,
            name: name?.trim() || p.user.name,
            email: email?.trim() || p.user.email,
          },
        })),
      signOut: () => patch((p) => ({ ...p, authed: false })),
      setPreferences: (prefPatch) =>
        patch((p) => ({ ...p, preferences: { ...p.preferences, ...prefPatch } })),
      toggleTheme: () =>
        patch((p) => ({
          ...p,
          preferences: {
            ...p.preferences,
            theme: p.preferences.theme === "dark" ? "light" : "dark",
          },
        })),
      addTask: (task) => {
        const created: Task = {
          id: uid(),
          title: task.title,
          description: task.description ?? "",
          priority: (task.priority as Priority) ?? "medium",
          status: (task.status as TaskStatus) ?? "todo",
          dueDate: task.dueDate ?? null,
          estimatedTime: task.estimatedTime ?? "1h",
          project: task.project ?? "General",
          notes: task.notes ?? "",
          subtasks: task.subtasks ?? [],
          dependencies: task.dependencies ?? [],
          createdAt: new Date().toISOString(),
          completedAt: null,
        };
        patch((p) => ({ ...p, tasks: [created, ...p.tasks] }));
        return created;
      },
      updateTask: (id, taskPatch) =>
        patch((p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...taskPatch } : t)),
        })),
      deleteTask: (id) => patch((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) })),
      setTaskStatus: (id, status) =>
        patch((p) => ({
          ...p,
          tasks: p.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === "completed" ? new Date().toISOString() : null,
                }
              : t,
          ),
        })),
      addMeeting: (meeting) => patch((p) => ({ ...p, meetings: [meeting, ...p.meetings] })),
      updateMeeting: (id, meetingPatch) =>
        patch((p) => ({
          ...p,
          meetings: p.meetings.map((m) => (m.id === id ? { ...m, ...meetingPatch } : m)),
        })),
      deleteMeeting: (id) =>
        patch((p) => ({ ...p, meetings: p.meetings.filter((m) => m.id !== id) })),
      convertActionItems: (meetingId, items, project) => {
        const fresh = items.filter((i) => !i.converted);
        if (!fresh.length) return 0;
        const newTasks: Task[] = fresh.map((i) => ({
          id: uid(),
          title: i.task,
          description: `From meeting: ${project}${i.assignee ? ` · Owner: ${i.assignee}` : ""}`,
          priority: i.priority,
          status: "todo",
          dueDate: /^\d{4}-\d{2}-\d{2}$/.test(i.deadline) ? i.deadline : null,
          estimatedTime: "1h",
          project,
          notes: "",
          subtasks: [],
          dependencies: [],
          createdAt: new Date().toISOString(),
          completedAt: null,
        }));
        patch((p) => ({
          ...p,
          tasks: [...newTasks, ...p.tasks],
          meetings: p.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  summary: {
                    ...m.summary,
                    actionItems: m.summary.actionItems.map((a) =>
                      fresh.some((f) => f.id === a.id) ? { ...a, converted: true } : a,
                    ),
                  },
                }
              : m,
          ),
        }));
        return newTasks.length;
      },
      newConversation: () => {
        const id = uid();
        patch((p) => ({
          ...p,
          activeConversationId: id,
          conversations: [
            {
              id,
              title: "New conversation",
              messages: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...p.conversations,
          ],
        }));
        return id;
      },
      setActiveConversation: (id) => patch((p) => ({ ...p, activeConversationId: id })),
      updateConversation: (id, convPatch) =>
        patch((p) => ({
          ...p,
          conversations: p.conversations.map((c) =>
            c.id === id ? { ...c, ...convPatch, updatedAt: new Date().toISOString() } : c,
          ),
        })),
      deleteConversation: (id) =>
        patch((p) => {
          const conversations = p.conversations.filter((c) => c.id !== id);
          return {
            ...p,
            conversations,
            activeConversationId:
              p.activeConversationId === id
                ? (conversations[0]?.id ?? null)
                : p.activeConversationId,
          };
        }),
      pushNotification: (n) =>
        patch((p) => ({
          ...p,
          notifications: [
            { ...n, id: uid(), createdAt: new Date().toISOString(), read: false },
            ...p.notifications,
          ].slice(0, 30),
        })),
      markNotificationsRead: () =>
        patch((p) => ({
          ...p,
          notifications: p.notifications.map((n) => ({ ...n, read: true })),
        })),
    };
  }, [state, ready, setState]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function isOverdue(task: Task) {
  return (
    task.status !== "completed" &&
    !!task.dueDate &&
    new Date(task.dueDate) < new Date(new Date().toDateString())
  );
}

export function isToday(task: Task) {
  return !!task.dueDate && task.dueDate === new Date().toISOString().slice(0, 10);
}

export const priorityRank: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

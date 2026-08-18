export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  estimatedTime: string;
  project: string;
  notes: string;
  subtasks: Subtask[];
  dependencies: string[];
  createdAt: string;
  completedAt: string | null;
};

export type ActionItem = {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: Priority;
  converted?: boolean;
};

export type MeetingSummary = {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  followUps: string[];
  openQuestions: string[];
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  type: string;
  transcript: string;
  summary: MeetingSummary;
  createdAt: string;
  status: "summarized" | "draft";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  kind: "deadline" | "overdue" | "completed" | "meeting" | "ai";
  createdAt: string;
  read: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
};

export type Preferences = {
  theme: "light" | "dark";
  tone: "professional" | "friendly" | "concise";
  detail: "brief" | "balanced" | "detailed";
  autoConvertActionItems: boolean;
  emailNotifications: boolean;
  deadlineReminders: boolean;
  weeklyDigest: boolean;
  storeHistory: boolean;
};

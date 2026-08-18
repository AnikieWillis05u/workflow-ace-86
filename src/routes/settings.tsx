import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Bot,
  Mail,
  Moon,
  Save,
  Sun,
  Trash2,
  User,
  Palette,
  Shield,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/app-shell";
import { PageHeading } from "@/components/common";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content: "Manage your profile, AI preferences and workspace settings.",
      },
      { property: "og:title", content: "Settings | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Customise AI tone, notifications, appearance and data preferences.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Settings />
    </AppShell>
  ),
});

function Settings() {
  const { state, setPreferences, toggleTheme, signOut, setState } = useApp();
  const navigate = useNavigate();

  const [draft, setDraft] = useState({
    name: state.user.name,
    email: state.user.email,
    role: state.user.role,
  });

  const saveProfile = () => {
    setState((p) => ({
      ...p,
      user: { ...p.user, name: draft.name, email: draft.email, role: draft.role },
    }));
    toast.success("Profile updated");
  };

  const clearHistory = () => {
    if (confirm("This will delete all meetings and conversations. Tasks will be kept. Continue?")) {
      setState((p) => ({ ...p, meetings: [], conversations: [] }));
      toast.success("History cleared");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading title="Settings" description="Manage your workspace and AI preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface space-y-5 p-5 lg:col-span-2">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Profile</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={saveProfile}>
              <Save className="mr-2 size-4" /> Save profile
            </Button>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">AI preferences</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={state.preferences.tone}
                  onValueChange={(v) => setPreferences({ tone: v as typeof state.preferences.tone })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Detail level</Label>
                <Select
                  value={state.preferences.detail}
                  onValueChange={(v) => setPreferences({ detail: v as typeof state.preferences.detail })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Auto-convert action items</p>
                <p className="text-xs text-muted-foreground">
                  Turn meeting action items into tasks automatically when saving a summary.
                </p>
              </div>
              <Switch
                checked={state.preferences.autoConvertActionItems}
                onCheckedChange={(v) => setPreferences({ autoConvertActionItems: v })}
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Notifications</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Email notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates about meetings and tasks.</p>
                </div>
                <Switch
                  checked={state.preferences.emailNotifications}
                  onCheckedChange={(v) => setPreferences({ emailNotifications: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Deadline reminders</p>
                  <p className="text-xs text-muted-foreground">Get reminded when tasks are due or overdue.</p>
                </div>
                <Switch
                  checked={state.preferences.deadlineReminders}
                  onCheckedChange={(v) => setPreferences({ deadlineReminders: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Weekly digest</p>
                  <p className="text-xs text-muted-foreground">A weekly summary of completed work and upcoming priorities.</p>
                </div>
                <Switch
                  checked={state.preferences.weeklyDigest}
                  onCheckedChange={(v) => setPreferences({ weeklyDigest: v })}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="card-surface space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Palette className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Appearance</h2>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                {state.preferences.theme === "dark" ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground capitalize">{state.preferences.theme} mode</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme}>
                Switch
              </Button>
            </div>
          </div>

          <div className="card-surface space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Data & privacy</h2>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Your workspace data is stored locally in this browser.</p>
              <p>Meetings and conversations can be cleared without affecting tasks.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={clearHistory}>
              <Trash2 className="mr-2 size-4" /> Clear history
            </Button>
          </div>

          <div className="card-surface space-y-4 p-5">
            <h2 className="text-sm font-semibold">Account</h2>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                signOut();
                void navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  CalendarClock,
  CheckSquare,
  FileText,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/summarizer", label: "Meeting Summarizer", icon: FileText },
  { to: "/planner", label: "Task Planner", icon: Sparkles },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/history", label: "Meeting History", icon: CalendarClock },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
        <Bot className="size-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">AI Workplace</p>
          <p className="text-xs text-muted-foreground">Productivity Assistant</p>
        </div>
      )}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className={cn("size-4.5 shrink-0", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function pageTitle(pathname: string) {
  return nav.find((n) => n.to === pathname)?.label ?? "Dashboard";
}

function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { state } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const go = (to: string) => {
    setOpen(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tasks, meetings and conversations..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Tasks">
          {state.tasks.slice(0, 8).map((t) => (
            <CommandItem key={t.id} value={`task ${t.title} ${t.project}`} onSelect={() => go("/tasks")}>
              <CheckSquare className="mr-2 size-4" /> {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Meetings">
          {state.meetings.map((m) => (
            <CommandItem
              key={m.id}
              value={`meeting ${m.title} ${m.summary.overview}`}
              onSelect={() => go("/history")}
            >
              <FileText className="mr-2 size-4" /> {m.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Conversations">
          {state.conversations.map((c) => (
            <CommandItem key={c.id} value={`chat ${c.title}`} onSelect={() => go("/chat")}>
              <Bot className="mr-2 size-4" /> {c.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function Notifications() {
  const { state, markNotificationsRead } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <Popover onOpenChange={(o) => o && markNotificationsRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4.5 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        <ScrollArea className="max-h-80">
          {state.notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            state.notifications.map((n) => (
              <div key={n.id} className="border-b px-4 py-3 last:border-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {n.kind}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, toggleTheme, signOut } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !state.authed) void navigate({ to: "/" });
  }, [ready, state.authed, navigate]);

  const initials = useMemo(
    () =>
      state.user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join(""),
    [state.user.name],
  );

  if (!ready || !state.authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <BrandMark />
        <div className="mt-7 flex-1">
          <NavLinks />
        </div>
        <div className="rounded-xl bg-accent/60 p-3 text-xs text-accent-foreground">
          <p className="font-semibold">One AI assistant for your entire workday.</p>
          <p className="mt-1 opacity-80">Meetings, tasks and chat — connected.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandMark />
              <div className="mt-6">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <h2 className="truncate text-base font-semibold sm:text-lg">{pageTitle(pathname)}</h2>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 w-56 justify-start gap-2 rounded-full px-3 text-muted-foreground md:flex"
            >
              <Search className="size-4" /> Search...
              <kbd className="ml-auto text-[10px] opacity-60">⌘K</kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full md:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {state.preferences.theme === "dark" ? (
                <Sun className="size-4.5" />
              ) : (
                <Moon className="size-4.5" />
              )}
            </Button>
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-1 h-9 gap-2 rounded-full px-1.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="gradient-brand text-xs text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {state.user.name.split(" ")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{state.user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{state.user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void navigate({ to: "/settings" })}>
                  <SettingsIcon className="mr-2 size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    void navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          <div className="animate-rise">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur lg:hidden">
        {nav.slice(0, 4).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}

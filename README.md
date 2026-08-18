# AI Workplace Productivity Assistant

A modern, responsive SaaS application that helps professionals automate everyday workplace tasks using AI. Built as a unified productivity platform with an integrated dashboard, AI meeting summarizer, intelligent task planner, and a contextual AI chatbot.

## Features

- **Unified Dashboard** — productivity analytics, weekly trend charts, quick actions, and a centralized view of tasks, meetings, and AI activity.
- **AI Meeting Summarizer** — paste meeting transcripts and get structured summaries, key takeaways, and actionable next steps powered by AI.
- **Task Planner** — break goals into actionable tasks, prioritize them with AI, and manage work across a Kanban-style board.
- **AI Chatbot** — a workspace-aware assistant that can reference your tasks and meeting history to help with daily work.
- **Integrated Data Flow** — convert meeting action items directly into tasks, share context across tools, and keep everything in sync.
- **Persistent Workspace State** — localStorage-backed store seeded with realistic demo data so the app feels alive from first load.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework with server functions
- [React 19](https://react.dev/) — UI library
- [TypeScript](https://www.typescriptlang.org/) — type-safe development
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) — accessible, composable UI components
- [Recharts](https://recharts.org/) — data visualization
- [Lovable AI Gateway](https://docs.lovable.dev/features/ai-gateway) — AI model access (Gemini 3.7 Flash)

## Project Structure

```
src/
  components/     # Shared UI components and route-specific views
  lib/            # Types, store, AI server functions, and utilities
  routes/         # TanStack Start routes
  styles.css      # Design tokens, theme, and global utilities
```

## Getting Started

### Prerequisites

- Node.js (v20 or later recommended)
- npm, yarn, pnpm, or bun

### Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Build

```bash
npm run build
```

## AI Configuration

The application uses the Lovable AI Gateway to call Gemini 3.7 Flash for meeting summaries, task planning, prioritization, and chat responses. Ensure the `LOVABLE_API_KEY` environment variable is configured in your project settings.

## Deployment

This project can be deployed directly from Lovable or published to a custom domain. It can also be self-hosted from a GitHub repository since it uses standard open-source technologies.

## License

This project is proprietary and built for the AI Workplace Productivity Assistant product.

---

Built with [Lovable](https://lovable.dev).

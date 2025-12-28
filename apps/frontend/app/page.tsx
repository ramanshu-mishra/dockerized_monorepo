
import { prisma } from "@repo/db/client";
import TodoComponent from "../components/todoComponent";

interface todoInterface {
  id: string;
  name: string;
  done: boolean;
}

export default async function Page() {
  const todos: todoInterface[] = await prisma.todo.findMany();

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 py-14">
        <header className="space-y-4 text-center">
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Plan smarter
          </span>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">All your tasks in one beautiful place</h1>
          <p className="mx-auto max-w-2xl text-base text-neutral-400">
            Capture ideas, coordinate with your team, and track progress in real-time. Stay focused and celebrate every checkmark.
          </p>
        </header>

        <TodoComponent initialtodos={todos} />

        <footer className="text-center text-sm text-neutral-500">
          Tip: Invite your teammates to collaborate over live updates powered by websockets.
        </footer>
      </div>
    </main>
  );
}
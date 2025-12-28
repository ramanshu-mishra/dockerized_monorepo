"use client"

import { Dispatch, memo, SetStateAction, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

interface todoInterface {
    id: string;
    name: string;
    done: boolean;
}

export default function TodoComponent({ initialtodos }: { initialtodos: todoInterface[] }) {
    const [todos, setTodos] = useState<todoInterface[]>(initialtodos);
    const [des, setDes] = useState("");
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_SERVER;
        console.log("websocket url: "+wsUrl);
        if (!wsUrl) return;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        addWSEvents(socket, setTodos);

        return () => {
            socket.close();
            wsRef.current = null;
        };
    }, []);


    function toggle(id: string) {
        wsRef.current?.send(JSON.stringify({
            action: "toggle",
            id: id
        }));
        setTodos(prev =>
            prev.map(todo =>
                todo.id === id ? { ...todo, done: !todo.done } : todo
            )
        );
    }

    async function addTodo() {
        if (!des.trim()) return;

        const updatedTodo = await fetch(`${process.env.NEXT_PUBLIC_SERVER}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: des.trim()
            })
        });

        if (updatedTodo.ok) {
            const nTodo = await updatedTodo.json();
            setTodos(prev => [...prev, nTodo.todo]);
            setDes("");
        }
    }

    function deleteTodo(id: string) {
        wsRef.current?.send(JSON.stringify({
            action: "delete",
            id
        }));
    }
    
    return (
        <section className="w-full max-w-2xl space-y-6 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-8 shadow-xl backdrop-blur">
            <header className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Today&apos;s Plan</h2>
                <p className="text-sm text-neutral-400">Add tasks, mark them done, and stay in sync in real-time.</p>
            </header>

            <form
                className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:flex-row"
                onSubmit={(e) => {
                    e.preventDefault();
                    addTodo();
                }}
            >
                <input
                    value={des}
                    onChange={(e) => setDes(e.target.value)}
                    type="text"
                    placeholder="What needs to get done?"
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                    Add Task
                </button>
            </form>

            <div className="space-y-3">
                {todos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/60 p-8 text-center text-neutral-400">
                        You&apos;re all caught up! Add a new task to get started.
                    </div>
                ) : (
                    todos.map((todo, idx) => (
                        <TodoClient
                            key={todo.id}
                            id={todo.id}
                            idx={idx}
                            name={todo.name}
                            done={todo.done}
                            toggle={toggle}
                            deleteTodo={deleteTodo}
                        />
                    ))
                )}
            </div>
        </section>
    );
}



const TodoClient = memo(({ idx, name, done, id, deleteTodo, toggle }: { idx: number; name: string; done: boolean; id: string; deleteTodo: (id: string) => void; toggle: (id: string) => void }) => {
    return (
        <article className="group flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/60 px-5 py-4 shadow transition hover:border-neutral-700 hover:bg-neutral-950/80">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-neutral-400">
                    {idx + 1}
                </span>
                <p className={cn(
                    "text-base font-medium transition truncate",
                    done ? "text-neutral-500 line-through" : "text-neutral-100"
                )}>
                    {name}
                </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    type="button"
                    onClick={() => toggle(id)}
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition",
                        done 
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                            : "border-neutral-700 bg-neutral-900 text-neutral-600 hover:border-emerald-500 hover:text-emerald-400"
                    )}
                    aria-label={done ? "Mark as incomplete" : "Mark as complete"}
                >
                    ✓
                </button>
                <button
                    type="button"
                    onClick={() => deleteTodo(id)}
                    className="rounded-lg border border-transparent bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                    aria-label="Delete task"
                >
                    Delete
                </button>
            </div>
        </article>
    );
});

TodoClient.displayName = 'TodoClient';





function addWSEvents(ws: WebSocket, setTodos: Dispatch<SetStateAction<todoInterface[]>>) {
    ws.addEventListener("message", (message) => {
        try {
            const data = JSON.parse(String(message.data));
            if (data.action === "update") {
                const todo = data.todo;
                setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, name: todo.name } : t));
            }
            else if (data.action === "delete") {
                const id = data.id;
                setTodos(prev => prev.filter(t => t.id !== id));
            }
            else if (data.action === "toggle") {
                const id = data.id;
                setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
            }
        } catch (error) {
            console.error("Failed to parse WebSocket message", error);
        }
    });
}
"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import type { TaskPayload, TaskResponse } from '../lib/api';
import { createTask, getTasks, updateTask } from '../lib/api';

const statusLabels: Record<TaskResponse['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export default function Home() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await getTasks();
      setTasks(results);
    } catch (err) {
      setError('Failed to load tasks from the backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = useCallback(
    async (task: TaskPayload) => {
      console.log('[Home] handleCreate', task);
      setSaving(true);
      setError(null);

      try {
        const created = await createTask(task);
        await fetchTasks();
        return created;
      } catch (err) {
        setError('Unable to create task. Please try again.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchTasks]
  );

  const handleUpdate = async (task: TaskResponse, changes: Partial<TaskPayload>) => {
    setError(null);

    try {
      const updated = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        urgent: task.urgent,
        important: task.important,
        status: task.status,
        dueDate: task.dueDate ?? null,
        ...changes,
      });
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError('Unable to update task status. Please refresh and try again.');
    }
  };

  const statusCounts = useMemo(() => {
    return tasks.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] += 1;
        return acc;
      },
      { total: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>
    );
  }, [tasks]);

  const nextStatus = (status: TaskResponse['status']) => {
    if (status === 'TODO') return 'IN_PROGRESS';
    if (status === 'IN_PROGRESS') return 'DONE';
    return 'TODO';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Smart Task Manager</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Keep work moving with status and priority controls.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Create tasks, review the backlog, and update status directly from the dashboard. All changes sync with the backend API at{' '}
              <code className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">http://localhost:8080/api/tasks</code>.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total tasks</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{statusCounts.total}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">To do</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{statusCounts.TODO}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">In progress</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{statusCounts.IN_PROGRESS}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[420px_1fr]">
          <section>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">New task</h2>
                  <p className="mt-1 text-sm text-slate-500">Add a fresh task to your workflow.</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-opacity ${
                    saving ? 'opacity-100 bg-sky-100 text-sky-700' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  Saving…
                </span>
              </div>
              <TaskForm onSubmit={handleCreate} />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Task backlog</h2>
                  <p className="mt-1 text-sm text-slate-500">Manage task status and priorities with one click.</p>
                </div>
                <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                  {tasks.length} tasks loaded
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">No tasks yet. Add one to get started.</div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <TaskCard task={task} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdate(task, { status: nextStatus(task.status) })}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        {task.status === 'DONE' ? 'Reopen task' : task.status === 'TODO' ? 'Start task' : 'Complete task'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(task, { urgent: !task.urgent })}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${task.urgent ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {task.urgent ? 'Mark not urgent' : 'Mark urgent'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(task, { important: !task.important })}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${task.important ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {task.important ? 'Mark not important' : 'Mark important'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

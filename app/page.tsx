"use client";

import { useCallback, useEffect, useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import type {
  AuthResponse,
  LoginRequest,
  TaskPayload,
  TaskResponse,
} from '../lib/api';
import {
  createTask,
  getTasks,
  login,
  logout as logoutApi,
  register as registerUser,
  startGoogleOAuth,
  updateTask,
} from '../lib/api';

const AUTH_TOKEN_KEY = 'task-manager-token';
const AUTH_USER_KEY = 'task-manager-user';
const GOOGLE_OAUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

interface AuthState {
  token: string | null;
  username: string | null;
}

export default function Home() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthState>({ token: null, username: null });
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [credentials, setCredentials] = useState<LoginRequest>({ username: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  const saveAuth = useCallback((token: string, username: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, username);
    setAuth({ token, username });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuth({ token: null, username: null });
    setTasks([]);
  }, []);

  const fetchTasks = useCallback(
    async (token: string | null) => {
      setLoading(true);
      setError(null);

      if (!token) {
        setTasks([]);
        setLoading(false);
        return;
      }

      try {
        const results = await getTasks(token);
        setTasks(results);
      } catch {
        setError('Failed to load tasks from the backend. Please log in again.');
        clearAuth();
      } finally {
        setLoading(false);
      }
    },
    [clearAuth]
  );

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      await Promise.resolve();
      if (cancelled) return;

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const username = localStorage.getItem(AUTH_USER_KEY);
      if (token && username) {
        setAuth({ token, username });
        await fetchTasks(token);
      } else {
        setLoading(false);
      }
    };

    void initializeAuth();
    return () => {
      cancelled = true;
    };
  }, [fetchTasks]);

  const handleCreate = useCallback(
    async (task: TaskPayload) => {
      if (!auth.token) {
        throw new Error('Authentication required');
      }
      setSaving(true);
      setError(null);

      try {
        const created = await createTask(task, auth.token);
        await fetchTasks(auth.token);
        return created;
      } catch (err) {
        setError('Unable to create task. Please try again.');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [auth.token, fetchTasks]
  );

  const handleUpdate = async (task: TaskResponse, changes: Partial<TaskPayload>) => {
    if (!auth.token) {
      setError('Authentication required to update tasks.');
      return;
    }

    setError(null);

    try {
      const updated = await updateTask(
        task.id,
        {
          title: task.title,
          description: task.description,
          urgent: task.urgent,
          important: task.important,
          status: task.status,
          dueDate: task.dueDate ?? null,
          ...changes,
        },
        auth.token
      );
      setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setError('Unable to update task status. Please refresh and try again.');
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setMessage(null);

    try {
      if (mode === 'register') {
        await registerUser(credentials);
        setMessage('Registration successful. Please log in.');
        setMode('login');
        setCredentials({ username: credentials.username, password: '' });
        return;
      }

      const result: AuthResponse = await login(credentials);
      saveAuth(result.token, result.username);
      setMessage(`Welcome back, ${result.username}!`);
      await fetchTasks(result.token);
    } catch {
      setAuthError('Unable to authenticate. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    setError(null);
    setMessage(null);
    if (auth.token) {
      try {
        await logoutApi(auth.token);
      } catch {
        // ignore logout API failure for stateless token
      }
    }
    clearAuth();
  };

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
              A task workspace secured with JWT authentication.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Register or log in to access your task list. Tasks are stored per user and protected by bearer tokens.
            </p>
          </div>
          {auth.username ? (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{auth.username}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 inline-flex rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>

        {auth.token ? (
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
                    <p className="mt-1 text-sm text-slate-500">Manage your personal tasks and update status securely.</p>
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
        ) : (
          <div className="mt-10 grid gap-8 xl:grid-cols-[420px_1fr]">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{mode === 'login' ? 'Log in' : 'Register'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {mode === 'login'
                      ? 'Use your credentials to access tasks.'
                      : 'Create an account to protect your task list.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {mode === 'login' ? 'Switch to register' : 'Switch to log in'}
                </button>
              </div>

              {message ? (
                <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
              ) : null}
              {authError ? (
                <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{authError}</div>
              ) : null}

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Username
                  <input
                    value={credentials.username}
                    onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter username"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter password"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  {mode === 'login' ? 'Log in' : 'Register'}
                </button>

                {GOOGLE_OAUTH_ENABLED ? (
                  <button
                    type="button"
                    onClick={startGoogleOAuth}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Continue with Google
                  </button>
                ) : null}
              </form>
            </section>

            <section className="space-y-4">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-semibold text-slate-950">Why sign in?</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li>• Your tasks are stored per account.</li>
                  <li>• API access requires authenticated bearer tokens.</li>
                  <li>• Logout clears access and protects your list.</li>
                </ul>
              </div>
              <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm ring-1 ring-slate-900/5">
                <p className="text-sm leading-6">
                  Once signed in, you can create tasks, update status, and manage priorities. Authentication is enforced by Spring Security on all task endpoints.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

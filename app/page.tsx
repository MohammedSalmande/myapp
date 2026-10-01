"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskCard, { quadrantOf, type Quadrant } from '../components/TaskCard';
import {
  AlertIcon,
  BoltIcon,
  CheckIcon,
  FlameIcon,
  GoogleIcon,
  GridIcon,
  ListIcon,
  LogOutIcon,
  StarIcon,
} from '../components/icons';
import type {
  AuthResponse,
  LoginRequest,
  TaskPayload,
  TaskResponse,
} from '../lib/api';
import {
  createTask,
  deleteTask,
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

type StatusFilter = 'ALL' | TaskResponse['status'];

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
];

const QUADRANTS: { key: Quadrant; title: string; hint: string; header: string }[] = [
  { key: 'do', title: 'Do first', hint: 'Urgent & important', header: 'bg-flame text-paper' },
  { key: 'schedule', title: 'Schedule', hint: 'Important, not urgent', header: 'bg-sun text-ink' },
  { key: 'delegate', title: 'Delegate', hint: 'Urgent, not important', header: 'bg-ink text-paper' },
  { key: 'later', title: 'Later', hint: 'Neither urgent nor important', header: 'bg-paper text-ink' },
];

// Open tasks first, then by due date (undated last), newest first as tiebreaker.
function sortTasks(list: TaskResponse[]) {
  return [...list].sort((a, b) => {
    const doneDiff = Number(a.status === 'DONE') - Number(b.status === 'DONE');
    if (doneDiff !== 0) return doneDiff;
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    if (a.dueDate !== b.dueDate) return a.dueDate ? -1 : 1;
    return b.id - a.id;
  });
}

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-ink bg-sun text-ink">
        <BoltIcon className="h-5 w-5" />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${inverted ? 'text-paper' : 'text-ink'}`}>
        Smart<span className={inverted ? 'text-sun' : 'text-flame'}>Task</span>
      </span>
    </div>
  );
}

function displayName(username: string) {
  return username.includes('@') ? username.split('@')[0] : username;
}

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
  const [view, setView] = useState<'matrix' | 'list'>('matrix');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

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

      // The backend's Google callback redirects back here with the result in the URL fragment.
      const oauthResult = new URLSearchParams(window.location.hash.slice(1));
      if (oauthResult.has('oauth_token') || oauthResult.has('oauth_error')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        const oauthToken = oauthResult.get('oauth_token');
        const oauthUser = oauthResult.get('oauth_user');
        if (oauthToken && oauthUser) {
          saveAuth(oauthToken, oauthUser);
          setMessage(`Welcome, ${oauthUser}!`);
          await fetchTasks(oauthToken);
          return;
        }
        setAuthError(
          oauthResult.get('oauth_error') === 'account_conflict'
            ? 'This email is already registered with a password. Please log in with your password.'
            : 'Google sign-in failed. Please try again.'
        );
      }

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
  }, [fetchTasks, saveAuth]);

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


  const handleDelete = async (task: TaskResponse) => {
    if (!auth.token) return;
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    setError(null);
    try {
      await deleteTask(task.id, auth.token);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch {
      setError('Unable to delete the task. Please try again.');
    }
  };

  const nextStatus = (status: TaskResponse['status']) => {
    if (status === 'TODO') return 'IN_PROGRESS';
    if (status === 'IN_PROGRESS') return 'DONE';
    return 'TODO';
  };

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      done: tasks.filter((t) => t.status === 'DONE').length,
      urgent: tasks.filter((t) => t.urgent && t.status !== 'DONE').length,
    }),
    [tasks]
  );

  const visibleTasks = useMemo(
    () => sortTasks(filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  );

  const renderCard = (task: TaskResponse) => (
    <TaskCard
      key={task.id}
      task={task}
      onAdvance={() => handleUpdate(task, { status: nextStatus(task.status) })}
      onToggleUrgent={() => handleUpdate(task, { urgent: !task.urgent })}
      onToggleImportant={() => handleUpdate(task, { important: !task.important })}
      onDelete={() => handleDelete(task)}
    />
  );

  /* ---------- Signed in: task board ---------- */
  if (auth.token) {
    const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

    return (
      <div className="flex-1">
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-ink">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Logo inverted />
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden truncate text-sm text-paper/70 sm:block">{auth.username}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-2 border-paper/20 px-3 text-sm font-semibold text-paper transition-colors duration-150 hover:border-flame hover:bg-flame"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Greeting + stats */}
          <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Hello, <span className="bg-sun px-1.5">{displayName(auth.username ?? '')}</span>
              </h1>
              <p className="mt-2 text-muted">
                {stats.urgent > 0
                  ? `You have ${stats.urgent} urgent ${stats.urgent === 1 ? 'task' : 'tasks'} waiting. Let's go!`
                  : stats.total > 0
                    ? 'Nothing urgent right now. Keep the momentum going.'
                    : 'Add your first task and start getting things done.'}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border-2 border-ink bg-paper px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Open</dt>
                <dd className="mt-1 text-2xl font-extrabold">{stats.todo + stats.inProgress}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink bg-sun px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wider">In progress</dt>
                <dd className="mt-1 text-2xl font-extrabold">{stats.inProgress}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink bg-flame px-4 py-3 text-paper">
                <dt className="text-xs font-semibold uppercase tracking-wider text-paper/85">Urgent</dt>
                <dd className="mt-1 text-2xl font-extrabold">{stats.urgent}</dd>
              </div>
              <div className="rounded-xl border-2 border-ink bg-ink px-4 py-3 text-paper">
                <dt className="text-xs font-semibold uppercase tracking-wider text-paper/70">Done</dt>
                <dd className="mt-1 text-2xl font-extrabold">
                  {stats.done}
                  <span className="ml-1 text-sm font-semibold text-sun">{progress}%</span>
                </dd>
              </div>
            </dl>
          </section>

          {message ? (
            <div role="status" className="mt-6 flex items-center gap-2 rounded-xl border-2 border-ink bg-sun-soft px-4 py-3 text-sm font-semibold">
              <CheckIcon className="h-4 w-4" /> {message}
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="mt-6 flex items-center gap-2 rounded-xl border-2 border-flame bg-flame-soft px-4 py-3 text-sm font-semibold text-flame">
              <AlertIcon className="h-4 w-4 shrink-0" /> {error}
            </div>
          ) : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
            {/* New task */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border-2 border-ink bg-paper shadow-pop">
                <div className="flex items-center justify-between rounded-t-[14px] border-b-2 border-ink bg-ink px-5 py-4">
                  <h2 className="text-lg font-extrabold text-paper">New task</h2>
                  {saving ? <span className="text-xs font-semibold text-sun">Saving…</span> : null}
                </div>
                <div className="p-5">
                  <TaskForm onSubmit={handleCreate} />
                </div>
              </div>
            </aside>

            {/* Board */}
            <section aria-labelledby="board-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="board-title" className="text-xl font-extrabold">
                  Your tasks <span className="text-muted">({visibleTasks.length})</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div role="group" aria-label="Filter by status" className="flex rounded-xl border-2 border-ink bg-paper p-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        aria-pressed={filter === f.value}
                        onClick={() => setFilter(f.value)}
                        className={`min-h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors duration-150 ${
                          filter === f.value ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div role="group" aria-label="Layout" className="flex rounded-xl border-2 border-ink bg-paper p-1">
                    <button
                      type="button"
                      aria-pressed={view === 'matrix'}
                      aria-label="Priority matrix view"
                      title="Priority matrix"
                      onClick={() => setView('matrix')}
                      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${
                        view === 'matrix' ? 'bg-sun text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <GridIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === 'list'}
                      aria-label="List view"
                      title="List"
                      onClick={() => setView('list')}
                      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${
                        view === 'list' ? 'bg-sun text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading tasks">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-36 animate-pulse rounded-2xl border-2 border-line bg-paper" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-ink/30 bg-paper px-6 py-16 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink bg-sun">
                      <BoltIcon className="h-7 w-7" />
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold">Your board is empty</h3>
                    <p className="mt-1 max-w-sm text-muted">
                      Add a task on the left. Mark it urgent or important and it lands in the right spot of your priority matrix.
                    </p>
                  </div>
                ) : visibleTasks.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-paper px-6 py-12 text-center text-muted">
                    No tasks with this status.
                  </div>
                ) : view === 'list' ? (
                  <div className="space-y-4">{visibleTasks.map(renderCard)}</div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {QUADRANTS.map((q) => {
                      const items = visibleTasks.filter((t) => quadrantOf(t) === q.key);
                      return (
                        <div key={q.key} className="flex flex-col rounded-2xl border-2 border-ink bg-canvas">
                          <div className={`flex items-center justify-between rounded-t-[14px] border-b-2 border-ink px-4 py-3 ${q.header}`}>
                            <div>
                              <h3 className="font-extrabold">{q.title}</h3>
                              <p className="text-xs font-medium opacity-80">{q.hint}</p>
                            </div>
                            <span className="rounded-full border-2 border-current px-2.5 py-0.5 text-sm font-extrabold">
                              {items.length}
                            </span>
                          </div>
                          <div className="flex-1 space-y-3 p-3">
                            {items.length ? (
                              items.map(renderCard)
                            ) : (
                              <p className="py-6 text-center text-sm text-muted">Nothing here.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- Signed out: landing + auth ---------- */
  const inputClass =
    'mt-2 w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 outline-none transition-colors duration-150 focus:border-ink';

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Brand panel */}
      <section className="relative overflow-hidden bg-ink px-6 py-12 text-paper sm:px-10 lg:w-1/2 lg:px-16 lg:py-16">
        <Logo inverted />
        <h1 className="mt-12 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          Focus on what matters.{' '}
          <span className="inline-block -rotate-1 bg-sun px-2 text-ink">Get it done.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-paper/75">
          Sort every task by urgency and importance, track progress at a glance and never miss a deadline again.
        </p>

        <ul className="mt-10 space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flame">
              <FlameIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">Priority matrix</p>
              <p className="text-sm text-paper/65">Know instantly what to do first, schedule, delegate or drop.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sun text-ink">
              <StarIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">Progress tracking</p>
              <p className="text-sm text-paper/65">Move tasks from to-do to done with one click.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper text-ink">
              <CheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">Private & secure</p>
              <p className="text-sm text-paper/65">Your tasks belong to your account only.</p>
            </div>
          </li>
        </ul>

        {/* Mini matrix illustration */}
        <div aria-hidden="true" className="mt-12 hidden max-w-sm grid-cols-2 gap-2 lg:grid">
          <div className="h-16 rounded-lg bg-flame" />
          <div className="h-16 rounded-lg bg-sun" />
          <div className="h-16 rounded-lg border-2 border-paper/30" />
          <div className="h-16 rounded-lg bg-paper/10" />
        </div>
      </section>

      {/* Auth */}
      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border-2 border-ink bg-paper p-6 shadow-pop sm:p-8">
          <div role="tablist" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-xl border-2 border-ink bg-canvas p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setAuthError(null);
                }}
                className={`min-h-10 cursor-pointer rounded-lg text-sm font-bold transition-colors duration-150 ${
                  mode === m ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Create account'}
              </button>
            ))}
          </div>

          <h2 className="mt-6 text-2xl font-extrabold">{mode === 'login' ? 'Welcome back' : 'Start for free'}</h2>
          <p className="mt-1 text-muted">
            {mode === 'login' ? 'Log in to see your tasks.' : 'Create an account in seconds.'}
          </p>

          {message ? (
            <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border-2 border-ink bg-sun-soft px-4 py-3 text-sm font-semibold">
              <CheckIcon className="h-4 w-4 shrink-0" /> {message}
            </div>
          ) : null}
          {authError ? (
            <div role="alert" className="mt-5 flex items-center gap-2 rounded-xl border-2 border-flame bg-flame-soft px-4 py-3 text-sm font-semibold text-flame">
              <AlertIcon className="h-4 w-4 shrink-0" /> {authError}
            </div>
          ) : null}

          {GOOGLE_OAUTH_ENABLED ? (
            <>
              <button
                type="button"
                onClick={startGoogleOAuth}
                className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-ink bg-paper px-4 text-base font-bold transition-colors duration-150 hover:bg-canvas"
              >
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
            </>
          ) : null}

          <form onSubmit={handleAuthSubmit} className={`space-y-4 ${GOOGLE_OAUTH_ENABLED ? '' : 'mt-6'}`}>
            <div>
              <label htmlFor="auth-username" className="block text-sm font-semibold">
                Username
              </label>
              <input
                id="auth-username"
                autoComplete="username"
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                className={inputClass}
                placeholder="Your username"
                required
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="block text-sm font-semibold">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 8 : undefined}
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                className={inputClass}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                required
              />
            </div>
            <button
              type="submit"
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-ink bg-sun px-4 text-base font-extrabold text-ink shadow-pop transition-transform duration-150 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

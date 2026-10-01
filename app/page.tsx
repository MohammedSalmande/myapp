"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskForm, { softFieldClass } from '../components/TaskForm';
import TaskCard, { QUADRANT_ACCENT, quadrantOf, type Quadrant } from '../components/TaskCard';
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

const QUADRANTS: { key: Quadrant; title: string; hint: string }[] = [
  { key: 'do', title: 'Do first', hint: 'Urgent & important' },
  { key: 'schedule', title: 'Schedule', hint: 'Important, not urgent' },
  { key: 'delegate', title: 'Delegate', hint: 'Urgent, not important' },
  { key: 'later', title: 'Later', hint: 'Neither urgent nor important' },
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

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sun text-ink shadow-sun">
        <BoltIcon className="h-5 w-5" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Smart<span className="text-flame-deep">Task</span>
      </span>
    </div>
  );
}

// Circular progress ring for the completion card.
function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0 rounded-full bg-canvas shadow-soft-sm">
      <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--shade)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--sun)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold">{value}%</span>
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


  // Segmented control: recessed track, the active option rises out of it.
  const segment = (active: boolean) =>
    `min-h-9 cursor-pointer rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
      active ? 'bg-canvas text-ink shadow-soft-xs' : 'text-muted hover:text-ink'
    }`;

  /* ---------- Signed in: task board ---------- */
  if (auth.token) {
    const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
    const statCards = [
      { label: 'Open', value: stats.todo + stats.inProgress, Icon: ListIcon, chip: 'bg-canvas text-ink shadow-inset-sm' },
      { label: 'In progress', value: stats.inProgress, Icon: BoltIcon, chip: 'bg-sun text-ink shadow-sun' },
      { label: 'Urgent', value: stats.urgent, Icon: FlameIcon, chip: 'bg-flame text-paper shadow-flame' },
      { label: 'Done', value: stats.done, Icon: CheckIcon, chip: 'bg-ink text-paper shadow-soft-xs' },
    ];

    return (
      <div className="flex-1">
        <header className="sticky top-0 z-20 bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Logo />
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden truncate rounded-full px-4 py-2 text-sm font-medium text-muted shadow-inset-sm sm:block">
                {auth.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-canvas px-4 text-sm font-bold text-ink shadow-soft-sm transition-all duration-200 hover:text-flame-deep active:shadow-inset-sm"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">
          {/* Greeting + daily goal */}
          <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold text-muted">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Hello, {displayName(auth.username ?? '')}!
              </h1>
              <p className="mt-2 text-muted">
                {stats.urgent > 0
                  ? `You have ${stats.urgent} urgent ${stats.urgent === 1 ? 'task' : 'tasks'} waiting. Let's go!`
                  : stats.total > 0
                    ? 'Nothing urgent right now. Keep the momentum going.'
                    : 'Add your first task and start getting things done.'}
              </p>
            </div>

            <div className="flex items-center gap-5 rounded-3xl bg-canvas p-5 shadow-soft-lg">
              <ProgressRing value={progress} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Completed</p>
                <p className="mt-1 text-xl font-extrabold">
                  {stats.done} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {progress === 100 && stats.total > 0 ? 'Everything done. Amazing!' : progress >= 50 ? 'Great progress!' : 'Every task counts.'}
                </p>
              </div>
            </div>
          </section>

          <dl className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {statCards.map(({ label, value, Icon, chip }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl bg-canvas p-4 shadow-soft">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <dd className="text-2xl font-extrabold leading-none">{value}</dd>
                  <dt className="mt-1 text-sm font-medium text-muted">{label}</dt>
                </div>
              </div>
            ))}
          </dl>

          {message ? (
            <div role="status" className="mt-8 flex items-center gap-3 rounded-2xl bg-canvas px-5 py-4 text-sm font-semibold shadow-soft-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sun text-ink">
                <CheckIcon className="h-4 w-4" />
              </span>
              {message}
            </div>
          ) : null}
          {error ? (
            <div role="alert" className="mt-8 flex items-center gap-3 rounded-2xl bg-canvas px-5 py-4 text-sm font-semibold text-flame-deep shadow-soft-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flame text-paper">
                <AlertIcon className="h-4 w-4" />
              </span>
              {error}
            </div>
          ) : null}

          <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
            {/* New task */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl bg-canvas p-6 shadow-soft-lg">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">New task</h2>
                  {saving ? <span className="text-xs font-semibold text-muted">Saving…</span> : null}
                </div>
                <TaskForm onSubmit={handleCreate} />
              </div>
            </aside>

            {/* Board */}
            <section aria-labelledby="board-title">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 id="board-title" className="text-xl font-extrabold">
                  Your tasks <span className="text-muted">({visibleTasks.length})</span>
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div role="group" aria-label="Filter by status" className="flex gap-1 rounded-2xl bg-canvas p-1.5 shadow-inset">
                    {FILTERS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        aria-pressed={filter === f.value}
                        onClick={() => setFilter(f.value)}
                        className={segment(filter === f.value)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div role="group" aria-label="Layout" className="flex gap-1 rounded-2xl bg-canvas p-1.5 shadow-inset">
                    <button
                      type="button"
                      aria-pressed={view === 'matrix'}
                      aria-label="Priority matrix view"
                      title="Priority matrix"
                      onClick={() => setView('matrix')}
                      className={`${segment(view === 'matrix')} inline-flex w-9 items-center justify-center px-0`}
                    >
                      <GridIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={view === 'list'}
                      aria-label="List view"
                      title="List"
                      onClick={() => setView('list')}
                      className={`${segment(view === 'list')} inline-flex w-9 items-center justify-center px-0`}
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {loading ? (
                  <div className="grid gap-5 md:grid-cols-2" aria-busy="true" aria-label="Loading tasks">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-36 animate-pulse rounded-2xl bg-canvas shadow-soft-sm" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center rounded-3xl bg-canvas px-6 py-16 text-center shadow-inset">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sun text-ink shadow-sun">
                      <BoltIcon className="h-8 w-8" />
                    </span>
                    <h3 className="mt-5 text-lg font-extrabold">Your board is empty</h3>
                    <p className="mt-1 max-w-sm text-muted">
                      Add a task on the left. Mark it urgent or important and it lands in the right spot of your priority matrix.
                    </p>
                  </div>
                ) : visibleTasks.length === 0 ? (
                  <div className="rounded-3xl bg-canvas px-6 py-12 text-center text-muted shadow-inset">
                    No tasks with this status.
                  </div>
                ) : view === 'list' ? (
                  <div className="space-y-5">{visibleTasks.map(renderCard)}</div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {QUADRANTS.map((q) => {
                      const items = visibleTasks.filter((t) => quadrantOf(t) === q.key);
                      return (
                        <div key={q.key} className="flex flex-col rounded-3xl bg-canvas p-4 shadow-inset">
                          <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-4">
                            <div className="flex items-center gap-3">
                              <span aria-hidden="true" className={`h-8 w-1.5 rounded-full ${QUADRANT_ACCENT[q.key]}`} />
                              <div>
                                <h3 className="font-extrabold leading-tight">{q.title}</h3>
                                <p className="text-xs font-medium text-muted">{q.hint}</p>
                              </div>
                            </div>
                            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-canvas px-2 text-sm font-extrabold shadow-soft-xs">
                              {items.length}
                            </span>
                          </div>
                          <div className="flex-1 space-y-4">
                            {items.length ? (
                              items.map(renderCard)
                            ) : (
                              <p className="py-8 text-center text-sm text-muted">Nothing here.</p>
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
  const features = [
    { title: 'Priority matrix', text: 'Know instantly what to do first, schedule, delegate or drop.', Icon: FlameIcon, chip: 'bg-flame text-paper shadow-flame' },
    { title: 'Progress tracking', text: 'Move tasks from to-do to done with one click.', Icon: StarIcon, chip: 'bg-sun text-ink shadow-sun' },
    { title: 'Private & secure', text: 'Your tasks belong to your account only.', Icon: CheckIcon, chip: 'bg-ink text-paper shadow-soft-xs' },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-16">
      {/* Brand */}
      <section>
        <Logo />
        <h1 className="mt-10 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Focus on what matters.{' '}
          <span className="relative whitespace-nowrap">
            <span aria-hidden="true" className="absolute inset-x-0 bottom-1 -z-10 h-4 rounded-full bg-sun" />
            Get it done.
          </span>
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted">
          Sort every task by urgency and importance, track progress at a glance and never miss a deadline again.
        </p>

        <ul className="mt-10 space-y-4">
          {features.map(({ title, text, Icon, chip }) => (
            <li key={title} className="flex items-center gap-4 rounded-2xl bg-canvas p-4 shadow-soft-sm">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Auth */}
      <section className="w-full max-w-md justify-self-center rounded-3xl bg-canvas p-6 shadow-soft-lg sm:p-8">
        <div role="tablist" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-2xl bg-canvas p-1.5 shadow-inset">
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
              className={`${segment(mode === m)} min-h-10 font-bold`}
            >
              {m === 'login' ? 'Log in' : 'Create account'}
            </button>
          ))}
        </div>

        <h2 className="mt-7 text-2xl font-extrabold">{mode === 'login' ? 'Welcome back' : 'Start for free'}</h2>
        <p className="mt-1 text-muted">{mode === 'login' ? 'Log in to see your tasks.' : 'Create an account in seconds.'}</p>

        {message ? (
          <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-sm font-semibold shadow-inset-sm">
            <CheckIcon className="h-4 w-4 shrink-0" /> {message}
          </div>
        ) : null}
        {authError ? (
          <div role="alert" className="mt-5 flex items-center gap-3 rounded-2xl bg-flame-soft px-4 py-3 text-sm font-semibold text-flame-deep">
            <AlertIcon className="h-4 w-4 shrink-0" /> {authError}
          </div>
        ) : null}

        {GOOGLE_OAUTH_ENABLED ? (
          <>
            <button
              type="button"
              onClick={startGoogleOAuth}
              className="mt-6 flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-canvas px-4 text-base font-bold shadow-soft-sm transition-all duration-200 hover:shadow-soft active:shadow-inset-sm"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : null}

        <form onSubmit={handleAuthSubmit} className={`space-y-5 ${GOOGLE_OAUTH_ENABLED ? '' : 'mt-6'}`}>
          <div>
            <label htmlFor="auth-username" className="block text-sm font-semibold">
              Username
            </label>
            <input
              id="auth-username"
              autoComplete="username"
              value={credentials.username}
              onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              className={softFieldClass}
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
              className={softFieldClass}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              required
            />
          </div>
          <button
            type="submit"
            className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-sun px-4 text-base font-extrabold text-ink shadow-sun transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-inset"
          >
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
}

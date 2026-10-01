import React from 'react';
import { TaskResponse } from '../lib/api';
import { CalendarIcon, CheckIcon, FlameIcon, PlayIcon, RotateIcon, StarIcon, TrashIcon } from './icons';

export type Quadrant = 'do' | 'schedule' | 'delegate' | 'later';

export function quadrantOf(task: Pick<TaskResponse, 'urgent' | 'important'>): Quadrant {
  if (task.urgent && task.important) return 'do';
  if (task.important) return 'schedule';
  if (task.urgent) return 'delegate';
  return 'later';
}

// Left accent stripe per Eisenhower quadrant.
const STRIPE: Record<Quadrant, string> = {
  do: 'bg-flame',
  schedule: 'bg-sun',
  delegate: 'bg-ink',
  later: 'bg-line',
};

const STATUS_LABEL: Record<TaskResponse['status'], string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

const STATUS_STYLE: Record<TaskResponse['status'], string> = {
  TODO: 'bg-canvas text-ink border-line',
  IN_PROGRESS: 'bg-sun-soft text-ink border-sun',
  DONE: 'bg-ink text-paper border-ink',
};

function parseLocalDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function describeDue(dueDate: string, done: boolean) {
  const due = parseLocalDate(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const label =
    days === 0
      ? 'Today'
      : days === 1
        ? 'Tomorrow'
        : due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: due.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
  return { label, overdue: !done && days < 0, soon: !done && days >= 0 && days <= 1 };
}

interface TaskCardProps {
  task: TaskResponse;
  onAdvance: () => void;
  onToggleUrgent: () => void;
  onToggleImportant: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, onAdvance, onToggleUrgent, onToggleImportant, onDelete }: TaskCardProps) {
  const done = task.status === 'DONE';
  const due = task.dueDate ? describeDue(task.dueDate, done) : null;
  const advance =
    task.status === 'TODO'
      ? { label: 'Start', Icon: PlayIcon }
      : task.status === 'IN_PROGRESS'
        ? { label: 'Complete', Icon: CheckIcon }
        : { label: 'Reopen', Icon: RotateIcon };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border-2 border-ink bg-paper pl-5 shadow-pop-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-pop ${
        done ? 'opacity-70' : ''
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-2 ${STRIPE[quadrantOf(task)]}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 dir="auto" className={`text-base font-bold leading-snug break-words ${done ? 'line-through decoration-2' : ''}`}>
            {task.title}
          </h3>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[task.status]}`}>
            {STATUS_LABEL[task.status]}
          </span>
        </div>

        {task.description ? (
          <p dir="auto" className="mt-1.5 text-sm leading-relaxed text-muted break-words">{task.description}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {task.urgent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-flame px-2.5 py-1 text-paper">
              <FlameIcon className="h-3.5 w-3.5" /> Urgent
            </span>
          ) : null}
          {task.important ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-1 text-ink">
              <StarIcon className="h-3.5 w-3.5" /> Important
            </span>
          ) : null}
          {due ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                due.overdue ? 'bg-flame-soft text-flame' : due.soon ? 'bg-sun-soft text-ink' : 'bg-canvas text-muted'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {due.overdue ? `Overdue · ${due.label}` : due.label}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onAdvance}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-ink px-3.5 text-sm font-bold text-paper transition-colors duration-150 hover:bg-ink/85"
          >
            <advance.Icon className="h-4 w-4" />
            {advance.label}
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleUrgent}
              aria-pressed={task.urgent}
              aria-label={task.urgent ? 'Mark as not urgent' : 'Mark as urgent'}
              title={task.urgent ? 'Mark as not urgent' : 'Mark as urgent'}
              className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${
                task.urgent ? 'bg-flame-soft text-flame' : 'text-muted hover:bg-canvas hover:text-flame'
              }`}
            >
              <FlameIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onToggleImportant}
              aria-pressed={task.important}
              aria-label={task.important ? 'Mark as not important' : 'Mark as important'}
              title={task.important ? 'Mark as not important' : 'Mark as important'}
              className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${
                task.important ? 'bg-sun-soft text-ink' : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              <StarIcon className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete task"
              title="Delete task"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-flame-soft hover:text-flame"
            >
              <TrashIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

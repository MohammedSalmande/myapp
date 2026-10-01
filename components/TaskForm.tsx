"use client";

import React, { memo, useCallback, useState } from 'react';
import { TaskPayload } from '../lib/api';
import { FlameIcon, PlusIcon, StarIcon } from './icons';

interface TaskFormProps {
  onSubmit: (task: TaskPayload) => Promise<unknown>;
  initialValues?: TaskPayload;
}

const defaultValues: TaskPayload = {
  title: '',
  description: '',
  urgent: false,
  important: false,
  status: 'TODO',
  dueDate: null,
};

const STATUS_OPTIONS: { value: TaskPayload['status']; label: string }[] = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
];

// Recessed (inset) fields are the Soft UI cue for "type here".
export const softFieldClass =
  'mt-2 w-full rounded-xl bg-canvas px-4 py-3 text-base text-ink shadow-inset placeholder:text-muted/80 outline-none transition-shadow duration-200 focus:shadow-[var(--shadow-inset),0_0_0_3px_var(--sun)]';

function TaskForm({ onSubmit, initialValues }: TaskFormProps) {
  const [task, setTask] = useState<TaskPayload>(() => initialValues ?? defaultValues);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof TaskPayload, value: string | boolean | null) => {
    setTask((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!task.title.trim()) {
        return;
      }
      try {
        setSubmitting(true);
        await onSubmit(task);
        // only clear after successful submission
        setTask(defaultValues);
      } catch {
        // the parent shows the error message
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, task]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="task-title" className="block text-sm font-semibold">
          Title
        </label>
        <input
          id="task-title"
          dir="auto"
          value={task.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={softFieldClass}
          placeholder="What needs to get done?"
          required
        />
      </div>

      <div>
        <label htmlFor="task-description" className="block text-sm font-semibold">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="task-description"
          dir="auto"
          value={task.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`${softFieldClass} resize-y`}
          placeholder="Add details, links or notes"
          rows={3}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Priority</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={task.urgent}
            onClick={() => handleChange('urgent', !task.urgent)}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
              task.urgent ? 'bg-flame text-paper shadow-flame' : 'bg-canvas text-ink shadow-soft-sm hover:text-flame-deep'
            }`}
          >
            <FlameIcon className="h-4 w-4" />
            Urgent
          </button>
          <button
            type="button"
            aria-pressed={task.important}
            onClick={() => handleChange('important', !task.important)}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
              task.important ? 'bg-sun text-ink shadow-sun' : 'bg-canvas text-ink shadow-soft-sm hover:text-ink/70'
            }`}
          >
            <StarIcon className="h-4 w-4" />
            Important
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Status</legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-canvas p-1.5 shadow-inset">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={task.status === option.value}
              onClick={() => handleChange('status', option.value)}
              className={`cursor-pointer rounded-xl px-2 py-2 text-sm font-semibold transition-all duration-200 ${
                task.status === option.value ? 'bg-canvas text-ink shadow-soft-xs' : 'text-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="task-due" className="block text-sm font-semibold">
          Due date <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="task-due"
          type="date"
          value={task.dueDate ?? ''}
          onChange={(e) => handleChange('dueDate', e.target.value ? e.target.value : null)}
          className={softFieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-sun px-4 py-3.5 text-base font-extrabold text-ink shadow-sun transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-inset disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon className="h-5 w-5" />
        {submitting ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}

const MemoizedTaskForm = memo(TaskForm);

export default MemoizedTaskForm;

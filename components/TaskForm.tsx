"use client";

import React, { memo, useCallback, useState } from 'react';
import { TaskPayload } from '../lib/api';

interface TaskFormProps {
  onSubmit: (task: TaskPayload) => Promise<any>;
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

function TaskForm({ onSubmit, initialValues }: TaskFormProps) {
  const [task, setTask] = useState<TaskPayload>(() => initialValues ?? defaultValues);
  const [submitting, setSubmitting] = useState(false);

  console.log('[TaskForm] render', { title: task.title, description: task.description, submitting });

  const handleChange = useCallback((field: keyof TaskPayload, value: string | boolean | null) => {
    console.log('[TaskForm] handleChange', field, value);
    setTask((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      console.log('[TaskForm] handleSubmit', { task });
      event.preventDefault();
      if (!task.title.trim()) {
        return;
      }
      try {
        setSubmitting(true);
        const result = await onSubmit(task);
        console.log('[TaskForm] submit success', result);
        // only clear after successful submission
        setTask(defaultValues);
      } catch (err) {
        console.error('[TaskForm] submit fail', err);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, task]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input
          value={task.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="Task title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={task.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="Optional details"
          rows={3}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={task.urgent}
            onChange={(e) => handleChange('urgent', e.target.checked)}
          />
          Urgent
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900">
          <input
            type="checkbox"
            checked={task.important}
            onChange={(e) => handleChange('important', e.target.checked)}
          />
          Important
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            value={task.status}
            onChange={(e) => handleChange('status', e.target.value as TaskPayload['status'])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="DONE">DONE</option>
          </select>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Due date</label>
        <input
          type="date"
          value={task.dueDate ?? ''}
          onChange={(e) => handleChange('dueDate', e.target.value ? e.target.value : null)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${submitting ? 'bg-slate-300' : 'bg-sky-600 hover:bg-sky-700'}`}
        >
          {submitting ? 'Saving…' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

const MemoizedTaskForm = memo(TaskForm);

export default MemoizedTaskForm;

import React from 'react';
import { TaskResponse } from '../lib/api';

export default function TaskCard({ task }: { task: TaskResponse }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
          {task.description ? <p className="mt-2 text-sm text-slate-600">{task.description}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-700">
          {task.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-2 py-1 ${task.urgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
          {task.urgent ? 'Urgent' : 'Not urgent'}
        </span>
        <span className={`rounded-full px-2 py-1 ${task.important ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
          {task.important ? 'Important' : 'Not important'}
        </span>
      </div>
    </article>
  );
}

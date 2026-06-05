import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Smart Task Manager</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Eisenhower task board</h1>
            </div>
            <p className="max-w-xl text-sm text-slate-600 sm:text-right">
              Create, classify, and manage tasks with urgent/important labels and status tracking.
            </p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

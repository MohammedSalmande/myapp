"use client";

import { useEffect, useState } from 'react';
import { DownloadIcon } from './icons';

// Chrome/Android fire this before showing their own install UI; not in TS's DOM lib yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Registers the service worker in production builds. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // Installing is optional; the site works without it.
    });
  }, []);
  return null;
}

/**
 * "Install app" button. Only rendered where the browser supports an install
 * prompt (Chrome, Edge, Android) and the app is not already installed.
 */
export function InstallAppButton({ className = '' }: { className?: string }) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPromptEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-sun px-4 text-sm font-bold text-ink shadow-sun transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-inset ${className}`}
    >
      <DownloadIcon className="h-4 w-4" />
      Install app
    </button>
  );
}

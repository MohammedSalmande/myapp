import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – Smart Task Manager',
  description: 'How Smart Task Manager collects, uses and protects your data.',
};

const CONTACT_EMAIL = 'mohammed.salman.de@gmail.com';
const LAST_UPDATED = '1 October 2026';

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-slate-700">
      <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Back to Smart Task Manager
      </Link>

      <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-10 space-y-8 leading-7">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Who we are</h2>
          <p className="mt-2">
            Smart Task Manager (https://mohammed-salman.tech) is a personal task-management app operated by
            Mohammed Salman. If you have any question about this policy or your data, contact{' '}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">What data we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>Account data:</strong> the username you choose, and your password stored only as a
              one-way (BCrypt) hash — we never see or store your password in plain text.
            </li>
            <li>
              <strong>Google sign-in:</strong> if you choose “Continue with Google”, we receive only your
              verified email address from Google. It becomes your username. We do not receive your Google
              password, contacts, files or any other Google data.
            </li>
            <li>
              <strong>Your tasks:</strong> the titles, descriptions, priorities, statuses and due dates you
              enter.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">How we use it</h2>
          <p className="mt-2">
            Your data is used only to sign you in and to store and show your own tasks back to you. We do not
            use it for advertising or profiling, and we do not sell, rent or share it with third parties.
          </p>
          <p className="mt-2">
            Smart Task Manager’s use of information received from Google APIs adheres to the{' '}
            <a
              className="underline"
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Cookies and local storage</h2>
          <p className="mt-2">
            We use no tracking or analytics cookies. Your sign-in token is kept in your browser’s local
            storage so you stay logged in; logging out removes it. During Google sign-in a short-lived,
            strictly necessary security cookie (about 10 minutes) protects the login against forgery.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Where your data is stored</h2>
          <p className="mt-2">
            Data is stored in a database on our own server and is transmitted only over encrypted HTTPS
            connections.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2">
            You can ask at any time to see, correct, export or delete your account and all of your tasks.
            Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will
            act on your request promptly. If you are in the EU, you also have the rights granted by the GDPR,
            including the right to lodge a complaint with a data protection authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900">Changes</h2>
          <p className="mt-2">
            If this policy changes, we will update this page and the “Last updated” date above.
          </p>
        </section>
      </div>
    </main>
  );
}

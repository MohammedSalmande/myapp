import type { Metadata } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Smart Task Manager",
  description: "Prioritize what matters, track progress and get things done.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <footer className="mt-auto">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-sm text-muted sm:flex-row sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Smart Task Manager</p>
            <Link href="/privacy" className="font-medium hover:text-ink hover:underline">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10 text-foreground">
      <div className="w-full max-w-[390px] space-y-3">
        <main className="rounded-md border border-border bg-card px-7 py-9 shadow-sm sm:px-10">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-primary to-primary/70 bg-clip-text font-serif text-4xl font-semibold text-transparent transition-opacity hover:opacity-80"
            >
              Thoughts
            </Link>
            <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </main>
        {footer && (
          <div className="rounded-md border border-border bg-card px-5 py-5 text-center text-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

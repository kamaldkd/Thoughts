import React from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-slate-200">
      {/* Visual Brand Left Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-blue-900/20 border-r border-slate-800/60 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-block transition-opacity hover:opacity-80">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent w-fit">
              Thoughts
            </h1>
          </Link>
          <p className="mt-4 text-slate-400 text-lg max-w-sm">
            Join the conversation and connect with minds that challenge your perspective.
          </p>
        </div>

        {/* Elegant Quote Block */}
        <div className="relative z-10 glass-card p-6 rounded-2xl border-slate-800/50 max-w-lg mb-12 shadow-2xl backdrop-blur-xl bg-slate-900/40">
          <p className="italic text-slate-300 font-light leading-relaxed">
            "We build platforms not just to speak, but to be truly heard across the digital noise."
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-[2px]">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                T
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">The Thoughts Team</p>
              <p className="text-xs text-slate-500">Building for connection</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Content Right Panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto hidden-scrollbar">
        {/* Mobile Logo Overlay */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Thoughts
            </h1>
          </Link>
        </div>

        <div className="w-full max-w-[400px] space-y-8 relative z-10">
          <div className="text-center lg:text-left space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">{title}</h2>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({ label, error, type = "text", className, ...props }: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative mb-5 w-full">
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={cn(
            "block px-4 pb-2.5 pt-6 w-full text-sm text-slate-100 bg-slate-900/40 rounded-xl border appearance-none focus:outline-none focus:ring-0 peer transition-colors",
            error ? "border-red-500/50 focus:border-red-500" : "border-slate-800 focus:border-blue-500/50 hover:border-slate-700",
            className
          )}
          placeholder=" "
        />
        <label
          className={cn(
            "absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text",
            error ? "text-red-400" : "text-slate-500 peer-focus:text-blue-400"
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="absolute -bottom-5 left-1 text-[11px] font-medium text-red-400">{error}</p>}
    </div>
  );
}

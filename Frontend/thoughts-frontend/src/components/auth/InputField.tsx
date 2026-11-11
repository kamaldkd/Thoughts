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
    <div className="relative mb-3 w-full">
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className={cn(
            "peer block w-full appearance-none rounded-md border bg-muted/40 px-3 pb-2 pt-5 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
            error
              ? "border-destructive focus:border-destructive"
              : "border-input hover:border-primary/50 focus:border-primary",
            className
          )}
          placeholder=" "
        />
        <label
          className={cn(
            "absolute text-sm duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 cursor-text",
            error ? "text-destructive" : "text-muted-foreground peer-focus:text-primary"
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="absolute -bottom-5 left-1 text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

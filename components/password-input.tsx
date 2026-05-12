"use client";

import { useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          className ??
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-base text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d3c54] transition"
        }
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={inputId}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0d3c54] transition-colors p-0.5"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

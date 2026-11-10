"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  minLength,
  placeholder,
  required,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-md text-ink/45 hover:text-ink/80"
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

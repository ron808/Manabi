"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function PasswordField({
  value,
  onChange,
  autoComplete,
  minLength,
  maxLength,
  placeholder,
  required,
  ariaLabel = "Password",
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="input pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-white/45 transition-colors hover:text-white/85"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={visible ? "eye-off" : "eye"}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="grid place-items-center"
          >
            {visible ? <EyeOff /> : <Eye />}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

function Eye() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 5.09A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-1.67 2.5" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

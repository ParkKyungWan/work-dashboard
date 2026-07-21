"use client";

import { useSyncExternalStore } from "react";

const THEME_STORAGE_KEY = "work-dashboard-theme";

function getIsDark() {
  return document.documentElement.dataset.theme === "dark";
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      const observer = new MutationObserver(onStoreChange);

      const root = document.documentElement;

      observer.observe(root, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      return () => {
        observer.disconnect();
      };
    },
    getIsDark,
    () => false,
  );

  function toggleTheme() {
    const root = document.documentElement;
    const nextIsDark = !getIsDark();

    root.dataset.theme = nextIsDark ? "dark" : "light";
    root.classList.toggle("dark", nextIsDark);
    localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-medium text-neutral-700">
        테마(다크모드)
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="다크모드"
        onClick={toggleTheme}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-offset-2 ${
          isDark ? "bg-blue-600" : "bg-neutral-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-[#fff] shadow-sm transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

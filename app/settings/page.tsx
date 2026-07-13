// app/settings/page.tsx

import Link from "next/link";

type SettingItem = {
  href: string;
  title: string;
  description: string;
  badge: string;
  badgeClassName: string;
};

const SETTING_ITEMS: SettingItem[] = [
  {
    href: "/settings/leave",
    title: "연차 설정",
    description: "연차, 반차, 특별휴가를 등록하고 관리합니다.",
    badge: "연차",
    badgeClassName: "bg-amber-100 text-amber-800",
  },
  {
    href: "/settings/external-schedules",
    title: "외부 일정",
    description: "개인 일정이나 외부 일정을 등록하고 관리합니다.",
    badge: "일정",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">설정</h1>

            <p className="mt-1 text-sm text-neutral-500">
              업무 도우미의 기능을 설정합니다.
            </p>
          </div>

          <Link
            href="/"
            className="
              rounded-md border border-neutral-300 bg-white
              px-4 py-2 text-sm font-medium
              transition-colors hover:bg-neutral-50
            "
          >
            메인으로
          </Link>
        </header>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {SETTING_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="
        group flex items-center gap-4
        border-b border-neutral-200 px-5 py-4
        transition-colors
        last:border-b-0 hover:bg-neutral-50
      "
            >
              <div
                className={`
          flex h-10 w-10 shrink-0 items-center justify-center
          rounded-lg text-xs font-bold
          ${item.badgeClassName}
        `}
              >
                {item.badge}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-neutral-900">
                  {item.title}
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  {item.description}
                </p>
              </div>

              <span className="text-lg text-neutral-400 transition-transform group-hover:translate-x-0.5">
                ›
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

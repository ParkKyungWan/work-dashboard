// components/setting/SettingCornerLink.tsx

import Link from "next/link";

export default function SettingCornerLink() {
  return (
    <Link
      href="/settings"
      aria-label="설정 열기"
      title="설정"
      className="group fixed right-0 top-0 z-[100] block h-8 w-8 overflow-hidden"
    >
      <span
        className="
          absolute right-0 top-0
          h-0 w-0
          border-l-[28px] border-l-transparent
          border-t-[28px] border-t-neutral-300
          transition-colors
          group-hover:border-t-neutral-500
          group-active:border-t-neutral-600
        "
      />

      <span className="absolute right-0.5 top-0.5 z-10 text-[14px] leading-none text-white">
        ⚙
      </span>
    </Link>
  );
}

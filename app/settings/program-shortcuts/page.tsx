import Link from "next/link";
import ProgramShortcutSettings from "@/components/setting/ProgramShortcutSettings";

export default function ProgramShortcutsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">프로그램 바로가기</h1>
            <p className="mt-1 text-sm text-neutral-500">
              하단 Dock에 표시할 프로그램을 선택합니다.
            </p>
          </div>
          <Link
            href="/settings"
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50"
          >
            설정으로
          </Link>
        </header>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <ProgramShortcutSettings />
        </section>
      </div>
    </main>
  );
}

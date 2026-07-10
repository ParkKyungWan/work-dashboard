// app/work-log/page.tsx

import StickyNoteLayer from "@/components/sticy-note/StickyNoteLayer";

export default function WorkLogPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-bold">일일업무일지</h1>

      <StickyNoteLayer scope="work-log" />
    </main>
  );
}

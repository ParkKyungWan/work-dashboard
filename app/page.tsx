// app/work-log/page.tsx

import StickyNoteLayer from "@/components/sticky-note/StickyNoteLayer";

export default function WorkLogPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <StickyNoteLayer scope="work-log" />
    </main>
  );
}

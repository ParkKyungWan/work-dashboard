// app/work-log/page.tsx

import SettingCornerLink from "@/components/setting/SettingCornerLink";
import WorkspaceLayer from "@/components/workspace/WorkspaceLayer";

export default function WorkLogPage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <SettingCornerLink />
      <WorkspaceLayer scope="work-log" />
    </main>
  );
}

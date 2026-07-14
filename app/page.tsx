// app/work-log/page.tsx

import Dashboard from "@/components/dashboard/Dashboard";
import SettingCornerLink from "@/components/setting/SettingCornerLink";
import WorkspaceLayer from "@/components/workspace/WorkspaceLayer";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7fb] px-3 pb-5 pt-20 text-slate-900 md:px-5 lg:px-6">
      <SettingCornerLink />

      <Dashboard />

      <WorkspaceLayer scope="work-log" />
    </main>
  );
}

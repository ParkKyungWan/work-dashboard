// app/work-log/page.tsx

import Dashboard from "@/components/dashboard/Dashboard";
import SettingCornerLink from "@/components/setting/SettingCornerLink";
import { WorkspaceDateProvider } from "@/components/workspace/WorkspaceDateProvider";
import WorkspaceLayer from "@/components/workspace/WorkspaceLayer";

export default function Page() {
  return (
    <main className="relative min-h-screen page-paper-background px-3 pb-5 pt-20 text-slate-900 md:px-5 lg:px-6">
      <SettingCornerLink />
      <WorkspaceDateProvider>
        <Dashboard />
        <WorkspaceLayer scope="work-log" />
      </WorkspaceDateProvider>
    </main>
  );
}

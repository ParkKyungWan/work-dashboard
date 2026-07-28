export const DOCK_PROGRAM_IDS_KEY = "work-dashboard-dock-program-ids";
export const DOCK_SETTINGS_EVENT = "work-dashboard-dock-settings-change";

export function readDockProgramIds(): string[] {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(DOCK_PROGRAM_IDS_KEY) ?? "[]",
    );

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeDockProgramIds(ids: string[]) {
  window.localStorage.setItem(DOCK_PROGRAM_IDS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(DOCK_SETTINGS_EVENT, { detail: ids }));
}

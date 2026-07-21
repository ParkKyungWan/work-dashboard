// components/sticky-note/sticky-note.types.ts

export type StickyNoteStatus = "ACTIVE" | "ARCHIVED";

export type StickyNoteViewState = "DOCKED" | "PREVIEW" | "OPEN" | "FLOATING";

export type StickyNoteDockSide = "RIGHT";

export type StickyNote = {
  id: string;

  title: string;
  content: string;

  status: StickyNoteStatus;

  startDate: string;
  expiresAt: string | null;

  dockSide: StickyNoteDockSide;
  dockOrder: number;

  x: number | null;
  y: number | null;
  width: number;
  height: number;

  collapsed: boolean;
  pinned: boolean;

  colorHue: number;
  colorSaturation: number;
  colorLightness: number;

  dailyLogId?: string | null;

  archivedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type StickyNoteIndexItem = {
  id: string;
  title: string;
  status: StickyNoteStatus;
  startDate: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StickyNoteLayerProps = {
  scope?: "global" | "work-log";
};

export type StickyNoteCardProps = {
  note: StickyNote;
  index: number;
  viewDate: string;
  onCollapse: (id: string) => void;
  onExpand: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onPinChange: (id: string, pinned: boolean) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onWidthChange: (id: string, width: number, x: number, y: number) => void;
  onHeightChange: (id: string, height: number) => void;
  onExpiresAtChange: (id: string, expiresAt: string) => void;
  onContentChange: (id: string, content: string) => void;
};

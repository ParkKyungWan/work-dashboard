export type ProgramDefinition = {
  id: string;
  name: string;
  description: string;
  entryUrl: string;
  iconUrl: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  allowMultiple: boolean;
};

export type ProgramManifest = {
  id: string;
  name: string;
  description: string;
  entry: string;
  icon: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  allowMultiple: boolean;
};

export type ProgramWindowState = {
  instanceId: string;
  programId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  status: "opening" | "open" | "closing";
  originX: number;
  originY: number;
};

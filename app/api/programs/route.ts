import { readdir, readFile, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type {
  ProgramDefinition,
  ProgramManifest,
} from "@/lib/programs/types";

export const dynamic = "force-dynamic";

const ID_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

function hasSafeFileName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value === path.basename(value) &&
    !value.includes("..")
  );
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isManifest(value: unknown): value is ProgramManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<ProgramManifest>;

  return (
    typeof manifest.id === "string" &&
    ID_PATTERN.test(manifest.id) &&
    typeof manifest.name === "string" &&
    manifest.name.trim().length > 0 &&
    typeof manifest.description === "string" &&
    hasSafeFileName(manifest.entry) &&
    hasSafeFileName(manifest.icon) &&
    isPositiveNumber(manifest.defaultWidth) &&
    isPositiveNumber(manifest.defaultHeight) &&
    isPositiveNumber(manifest.minWidth) &&
    isPositiveNumber(manifest.minHeight) &&
    manifest.defaultWidth >= manifest.minWidth &&
    manifest.defaultHeight >= manifest.minHeight &&
    typeof manifest.allowMultiple === "boolean"
  );
}

async function isFile(filePath: string) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

export async function GET() {
  const programsRoot = path.join(process.cwd(), "public", "programs");

  let folders: Dirent[];
  try {
    folders = await readdir(programsRoot, { withFileTypes: true });
  } catch {
    return NextResponse.json([]);
  }

  const programs = await Promise.all(
    folders
      .filter((folder) => folder.isDirectory() && ID_PATTERN.test(folder.name))
      .map(async (folder): Promise<ProgramDefinition | null> => {
        const folderPath = path.join(programsRoot, folder.name);

        try {
          const manifest = JSON.parse(
            await readFile(path.join(folderPath, "manifest.json"), "utf8"),
          ) as unknown;

          if (!isManifest(manifest) || manifest.id !== folder.name) return null;
          if (
            !(await isFile(path.join(folderPath, manifest.entry))) ||
            !(await isFile(path.join(folderPath, manifest.icon)))
          ) {
            return null;
          }

          const baseUrl = `/programs/${encodeURIComponent(folder.name)}`;
          return {
            id: manifest.id,
            name: manifest.name,
            description: manifest.description,
            entryUrl: `${baseUrl}/${encodeURIComponent(manifest.entry)}`,
            iconUrl: `${baseUrl}/${encodeURIComponent(manifest.icon)}`,
            defaultWidth: manifest.defaultWidth,
            defaultHeight: manifest.defaultHeight,
            minWidth: manifest.minWidth,
            minHeight: manifest.minHeight,
            allowMultiple: manifest.allowMultiple,
          };
        } catch {
          return null;
        }
      }),
  );

  return NextResponse.json(
    programs
      .filter((program): program is ProgramDefinition => program !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "ko")),
  );
}

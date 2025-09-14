import { SettingsType } from "@/generated/prisma";
import { prisma } from "@/utils/prisma";

export async function getSetting<T = string>(key: string): Promise<T | null> {
  const row = await prisma.settings.findUnique({ where: { key } });
  if (!row) return null;

  switch (row.type) {
    case SettingsType.Int:
      return (row.value ? parseInt(row.value, 10) : null) as T;
    case SettingsType.Float:
      return (row.value ? parseFloat(row.value) : null) as T;
    case SettingsType.Boolean:
      return (row.value === "true") as T;
    case SettingsType.Json:
      return (row.value ? JSON.parse(row.value) : null) as T;
    default:
      return (row.value ?? null) as T;
  }
}

export async function setSetting(
  key: string,
  value: any,
  type: SettingsType = SettingsType.String
) {
  let strValue: string | null = null;

  switch (type) {
    case SettingsType.Json:
      strValue = JSON.stringify(value);
      break;
    case SettingsType.Boolean:
      strValue = value ? "true" : "false";
      break;
    default:
      strValue = value !== null && value !== undefined ? String(value) : null;
  }

  return prisma.settings.upsert({
    where: { key },
    create: { key, type, value: strValue },
    update: { type, value: strValue },
  });
}

export async function deleteSetting(key: string) {
  return prisma.settings.delete({ where: { key } }).catch(() => null);
}

export async function getAllSettings() {
  const rows = await prisma.settings.findMany();
  return rows.map((row) => {
    let parsed: any = row.value;
    if (row.type === SettingsType.Int)
      parsed = row.value ? parseInt(row.value, 10) : null;
    if (row.type === SettingsType.Float)
      parsed = row.value ? parseFloat(row.value) : null;
    if (row.type === SettingsType.Boolean) parsed = row.value === "true";
    if (row.type === SettingsType.Json)
      parsed = row.value ? JSON.parse(row.value) : null;

    return { key: row.key, type: row.type, value: parsed };
  });
}

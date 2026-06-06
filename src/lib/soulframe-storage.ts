export type ItemKind = "rune" | "pact" | "weapon" | "totem";

export const ITEM_CATEGORIES = [
  "Espadas Longas",
  "Espadões",
  "Floretes",
  "Armas de Haste",
  "Escudos",
  "Arcos",
  "Adagas",
  "Lâminas Arremessáveis",
  "Armas Mágicas",
] as const;

export interface Item {
  id: string;
  kind: ItemKind;
  name: string;
  category: (typeof ITEM_CATEGORIES)[number];
  rarity: "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário";
  level: number;
  notes: string;
  acquiredAt: string;
}

export interface Profile {
  envoyName: string;
  motto: string;
  level: number;
  realm: string;
}

export interface SaveData {
  profile: Profile;
  items: Item[];
}

const KEY = "soulframe-save-v1";

export const defaultData: SaveData = {
  profile: {
    envoyName: "Andarilho",
    motto: "Do sono, eu despertar.",
    level: 1,
    realm: "Midrath",
  },
  items: [],
};

export function loadFromStorage(): SaveData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...defaultData,
      ...parsed,
      items: (parsed.items ?? []).map((item) => ({
        ...item,
        category: item.category || ITEM_CATEGORIES[0],
      })) as Item[],
    };
  } catch {
    return defaultData;
  }
}

export function saveToStorage(data: SaveData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

// --- CSV ---
const HEADERS = ["section", "id", "kind", "name", "category", "rarity", "level", "notes", "acquiredAt", "envoyName", "motto", "realm"];

function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCSV(data: SaveData): string {
  const rows: string[] = [HEADERS.join(",")];
  rows.push(
    [
      "profile",
      "",
      "",
      "",
      "",
      data.profile.level,
      "",
      "",
      data.profile.envoyName,
      data.profile.motto,
      data.profile.realm,
    ]
      .map(csvEscape)
      .join(","),
  );
  for (const it of data.items) {
    rows.push(
      ["item", it.id, it.kind, it.name, it.category ?? ITEM_CATEGORIES[0], it.rarity, it.level, it.notes, it.acquiredAt, "", "", ""]
        .map(csvEscape)
        .join(","),
    );
  }
  return rows.join("\n");
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === ",") { out.push(cur); cur = ""; }
      else if (c === '"') inQ = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function importCSV(text: string): SaveData {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length === 0) return defaultData;
  const headers = parseCSVLine(lines[0]);
  const idx = (h: string) => headers.indexOf(h);
  const data: SaveData = { profile: { ...defaultData.profile }, items: [] };
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const section = row[idx("section")];
    if (section === "profile") {
      data.profile = {
        envoyName: row[idx("envoyName")] || defaultData.profile.envoyName,
        motto: row[idx("motto")] || defaultData.profile.motto,
        level: Number(row[idx("level")]) || 1,
        realm: row[idx("realm")] || defaultData.profile.realm,
      };
    } else if (section === "item") {
      data.items.push({
        id: row[idx("id")] || crypto.randomUUID(),
        kind: (row[idx("kind")] as ItemKind) || "rune",
        name: row[idx("name")] || "Desconhecido",
        category: (row[idx("category")] as (typeof ITEM_CATEGORIES)[number]) || ITEM_CATEGORIES[0],
        rarity: (row[idx("rarity")] as Item["rarity"]) || "Comum",
        level: Number(row[idx("level")]) || 1,
        notes: row[idx("notes")] || "",
        acquiredAt: row[idx("acquiredAt")] || new Date().toISOString().slice(0, 10),
      });
    }
  }
  return data;
}

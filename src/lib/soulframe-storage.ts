export type ItemKind = "rune" | "pact" | "weapon" | "totem";

export interface CategoryDefinition {
  id: number;
  name: string;
}

export const ITEM_CATEGORIES = [
  { id: 1, name: "Lâminas Longas" },
  { id: 2, name: "Pesadas" },
  { id: 3, name: "Armas de Haste" },
  { id: 4, name: "Escudos" },
  { id: 5, name: "Arcos" },
  { id: 6, name: "Adagas" },
  { id: 7, name: "Lâminas curtas" },
  { id: 8, name: "Mágicas" },
] as const;

export type ItemCategoryId = (typeof ITEM_CATEGORIES)[number]["id"];

export function getCategoryById(categoryId?: number) {
  return ITEM_CATEGORIES.find((category) => category.id === categoryId);
}

export function getCategoryName(categoryId?: number) {
  return getCategoryById(categoryId)?.name ?? ITEM_CATEGORIES[0].name;
}

function getCategoryIdByName(name?: string): ItemCategoryId {
  return ITEM_CATEGORIES.find((category) => category.name === name)?.id ?? ITEM_CATEGORIES[0].id;
}

function normalizeItem(item: Partial<Item> & { category?: string; categoryId?: number }): Item {
  const categoryId: ItemCategoryId =
    typeof item.categoryId === "number" ? (item.categoryId as ItemCategoryId) : getCategoryIdByName(item.category);
  return {
    ...item,
    id: item.id ?? crypto.randomUUID(),
    kind: item.kind ?? "rune",
    name: item.name ?? "Desconhecido",
    categoryId,
    category: item.category || getCategoryName(categoryId),
    rarity: item.rarity ?? "Comum",
    level: item.level ?? 1,
    notes: item.notes ?? "",
    acquiredAt: item.acquiredAt ?? new Date().toISOString().slice(0, 10),
  } as Item;
}

export interface Item {
  id: string;
  kind: ItemKind;
  name: string;
  categoryId: ItemCategoryId;
  category: string;
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
      items: (parsed.items ?? []).map((item) => normalizeItem(item as Partial<Item>)),
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
const HEADERS = ["section", "id", "kind", "name", "categoryId", "category", "rarity", "level", "notes", "acquiredAt", "envoyName", "motto", "realm"];

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
      ["item", it.id, it.kind, it.name, it.categoryId, it.category ?? getCategoryName(it.categoryId), it.rarity, it.level, it.notes, it.acquiredAt, "", "", ""]
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
      const categoryId = (Number(row[idx("categoryId")]) || getCategoryIdByName(row[idx("category")] || "")) as ItemCategoryId;
      data.items.push(
        normalizeItem({
          id: row[idx("id")] || crypto.randomUUID(),
          kind: (row[idx("kind")] as ItemKind) || "rune",
          name: row[idx("name")] || "Desconhecido",
          categoryId,
          category: row[idx("category")] || getCategoryName(categoryId),
          rarity: (row[idx("rarity")] as Item["rarity"]) || "Comum",
          level: Number(row[idx("level")]) || 1,
          notes: row[idx("notes")] || "",
          acquiredAt: row[idx("acquiredAt")] || new Date().toISOString().slice(0, 10),
        }),
      );
    }
  }
  return data;
}

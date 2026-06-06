const fs = require('fs');
let c = fs.readFileSync('src/lib/soulframe-storage.ts', 'utf8');

c = c.replace('const HEADERS = ["section", "id", "kind", "name", "categoryId", "category", "rarity", "level", "notes", "acquiredAt", "partsCount", "partsTotal", "completed", "envoyName", "motto", "realm"];',
  'const HEADERS = [\n  "section", "id", "kind", "name", "categoryId", "category", "rarity", "level", "notes", "acquiredAt", "partsCount", "partsTotal", "completed", "envoyName", "motto", "realm",\n  "helmetCount", "helmetTotal", "helmetOwned", "chestCount", "chestTotal", "chestOwned", "legsCount", "legsTotal", "legsOwned"\n];');

c = c.replace('function csvEscape(v: string | number): string {', 'function csvEscape(v: string | number | boolean): string {');

const oldExportCSV = export function exportCSV(data: SaveData): string {
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
      ["item", it.id, it.kind, it.name, it.categoryId, it.category ?? getCategoryName(it.categoryId), it.rarity, it.level, it.notes, it.acquiredAt, it.partsCount, it.partsTotal, Number(it.completed), "", "", ""]
        .map(csvEscape)
        .join(","),
    );
  }
  return rows.join("\\n");
};

const newExportCSV = export function exportCSV(data: SaveData): string {
  const rows: string[] = [HEADERS.join(",")];
  
  const buildRow = (rowObj: Record<string, any>) => {
    return HEADERS.map(h => csvEscape(rowObj[h] ?? "")).join(",");
  };

  rows.push(buildRow({
    section: "profile",
    level: data.profile.level,
    envoyName: data.profile.envoyName,
    motto: data.profile.motto,
    realm: data.profile.realm,
  }));

  for (const it of data.items) {
    rows.push(buildRow({
      section: "item",
      id: it.id,
      kind: it.kind,
      name: it.name,
      categoryId: it.categoryId,
      category: it.category ?? getCategoryName(it.categoryId),
      rarity: it.rarity,
      level: it.level,
      notes: it.notes,
      acquiredAt: it.acquiredAt,
      partsCount: it.partsCount,
      partsTotal: it.partsTotal,
      completed: Number(it.completed),
    }));
  }

  for (const set of data.armorSets) {
    rows.push(buildRow({
      section: "armorSet",
      id: set.id,
      name: set.name,
      helmetCount: set.helmetCount,
      helmetTotal: set.helmetTotal,
      helmetOwned: Number(set.helmetOwned),
      chestCount: set.chestCount,
      chestTotal: set.chestTotal,
      chestOwned: Number(set.chestOwned),
      legsCount: set.legsCount,
      legsTotal: set.legsTotal,
      legsOwned: Number(set.legsOwned),
    }));
  }

  return rows.join("\\n");
};

c = c.replace(oldExportCSV, newExportCSV);

const oldImportCSVBody =   for (let i = 1; i < lines.length; i++) {
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
          partsCount: Number(row[idx("partsCount")]) || 0,
          partsTotal: Number(row[idx("partsTotal")]) || 5,
          completed: Boolean(row[idx("completed")]) || false,
        }),
      );
    }
  };

const newImportCSVBody =   for (let i = 1; i < lines.length; i++) {
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
      const completedVal = row[idx("completed")];
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
          partsCount: Number(row[idx("partsCount")]) || 0,
          partsTotal: Number(row[idx("partsTotal")]) || 5,
          completed: Boolean(Number(completedVal) || completedVal === "true"),
        }),
      );
    } else if (section === "armorSet") {
      const helmetOwnedVal = row[idx("helmetOwned")];
      const chestOwnedVal = row[idx("chestOwned")];
      const legsOwnedVal = row[idx("legsOwned")];
      data.armorSets.push({
        id: row[idx("id")] || crypto.randomUUID(),
        name: row[idx("name")] || "Set de Armadura",
        helmetCount: Number(row[idx("helmetCount")]) || 0,
        helmetTotal: Number(row[idx("helmetTotal")]) || 5,
        helmetOwned: Boolean(Number(helmetOwnedVal) || helmetOwnedVal === "true"),
        chestCount: Number(row[idx("chestCount")]) || 0,
        chestTotal: Number(row[idx("chestTotal")]) || 5,
        chestOwned: Boolean(Number(chestOwnedVal) || chestOwnedVal === "true"),
        legsCount: Number(row[idx("legsCount")]) || 0,
        legsTotal: Number(row[idx("legsTotal")]) || 5,
        legsOwned: Boolean(Number(legsOwnedVal) || legsOwnedVal === "true"),
      });
    }
  };

c = c.replace(oldImportCSVBody, newImportCSVBody);

if (c.indexOf('legsOwned: Boolean(Number(legsOwnedVal)') !== -1) {
  fs.writeFileSync('src/lib/soulframe-storage.ts', c);
  console.log('Update complete.');
} else {
  console.log('Replacement failed.');
}

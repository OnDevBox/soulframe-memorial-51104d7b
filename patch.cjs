const fs = require("fs");
let c = fs.readFileSync("src/lib/soulframe-storage.ts", "utf8");
c = c.replace(
  "const HEADERS = [\"section\", \"id\", \"kind\", \"name\", \"categoryId\", \"category\", \"rarity\", \"level\", \"notes\", \"acquiredAt\", \"partsCount\", \"partsTotal\", \"completed\", \"envoyName\", \"motto\", \"realm\"];",
  "const HEADERS = [\"section\", \"id\", \"kind\", \"name\", \"categoryId\", \"category\", \"rarity\", \"level\", \"notes\", \"acquiredAt\", \"partsCount\", \"partsTotal\", \"completed\", \"envoyName\", \"motto\", \"realm\", \"helmetCount\", \"helmetTotal\", \"helmetOwned\", \"chestCount\", \"chestTotal\", \"chestOwned\", \"legsCount\", \"legsTotal\", \"legsOwned\"];"
);
c = c.replace("function csvEscape(v: string | number): string {", "function csvEscape(v: string | number | boolean): string {");

const newExport = fs.readFileSync("new_export.txt", "utf8");
const oldExportMatch = c.match(/export function exportCSV\(data: SaveData\): string \{[\s\S]*?return rows\.join\("\\n"\);\r?\n\}/);
if (oldExportMatch) {
    c = c.replace(oldExportMatch[0], newExport);
}

const newImportBody = fs.readFileSync("new_import.txt", "utf8");
const oldImportMatch = c.match(/  for \(let i = 1; i < lines\.length; i\+\+\) \{[\s\S]*?\}\r?\n  \}/);
if (oldImportMatch) {
    c = c.replace(oldImportMatch[0], newImportBody);
}
fs.writeFileSync("src/lib/soulframe-storage.ts", c);
console.log("Success");

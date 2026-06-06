import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Swords,
  ScrollText,
  Save,
  Upload,
  Download,
  Plus,
  Trash2,
  Feather,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type Item,
  type ItemKind,
  type SaveData,
  defaultData,
  exportCSV,
  importCSV,
  loadFromStorage,
  saveToStorage,
} from "@/lib/soulframe-storage";

const KIND_META: Record<
  ItemKind,
  { label: string; icon: typeof Sparkles; color: string; accent: string }
> = {
  rune: { label: "Runes", icon: Sparkles, color: "text-[color:var(--rune)]", accent: "var(--rune)" },
  pact: { label: "Pacts", icon: ScrollText, color: "text-[color:var(--pact)]", accent: "var(--pact)" },
  weapon: { label: "Weapons", icon: Swords, color: "text-[color:var(--weapon)]", accent: "var(--weapon)" },
};

const RARITIES: Item["rarity"][] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

const rarityClass: Record<Item["rarity"], string> = {
  Common: "bg-muted text-muted-foreground border-border",
  Uncommon: "bg-accent/30 text-accent-foreground border-accent/40",
  Rare: "bg-[color:var(--rune)]/20 text-[color:var(--rune)] border-[color:var(--rune)]/40",
  Epic: "bg-[color:var(--pact)]/20 text-[color:var(--pact)] border-[color:var(--pact)]/40",
  Legendary: "bg-[color:var(--ember)]/20 text-[color:var(--ember)] border-[color:var(--ember)]/40",
};

export function Dashboard() {
  const [data, setData] = useState<SaveData>(defaultData);
  const [activeKind, setActiveKind] = useState<ItemKind>("rune");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(loadFromStorage());
  }, []);

  const persistMemory = (next: SaveData) => {
    setData(next);
  };

  const handleSaveStick = () => {
    saveToStorage(data);
    toast.success("Memory inscribed", { description: "Your tale is etched into the memorystick." });
  };

  const handleLoadStick = () => {
    setData(loadFromStorage());
    toast.success("Memory restored", { description: "Echoes recalled from the stone." });
  };

  const handleExport = () => {
    const csv = exportCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soulframe-${data.profile.envoyName || "envoy"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Scroll exported");
  };

  const handleImportClick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = importCSV(text);
      setData(parsed);
      toast.success("Scroll deciphered", { description: `${parsed.items.length} relic(s) loaded.` });
    } catch {
      toast.error("This scroll is unreadable.");
    }
    e.target.value = "";
  };

  const updateProfile = <K extends keyof SaveData["profile"]>(k: K, v: SaveData["profile"][K]) => {
    persistMemory({ ...data, profile: { ...data.profile, [k]: v } });
  };

  const addItem = (kind: ItemKind) => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      kind,
      name: "",
      rarity: "Common",
      level: 1,
      notes: "",
      acquiredAt: new Date().toISOString().slice(0, 10),
    };
    persistMemory({ ...data, items: [newItem, ...data.items] });
  };

  const updateItem = (id: string, patch: Partial<Item>) => {
    persistMemory({
      ...data,
      items: data.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    });
  };

  const deleteItem = (id: string) => {
    persistMemory({ ...data, items: data.items.filter((it) => it.id !== id) });
  };

  const counts = useMemo(() => {
    const c = { rune: 0, pact: 0, weapon: 0 } as Record<ItemKind, number>;
    data.items.forEach((i) => (c[i.kind] += 1));
    return c;
  }, [data.items]);

  return (
    <div className="min-h-screen w-full">
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/40 sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-full grid place-items-center border border-primary/60"
              style={{ background: "radial-gradient(circle, var(--ember), transparent 70%)" }}
            >
              <Feather className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl text-gold font-display">Soulframe Codex</h1>
              <p className="text-xs text-muted-foreground italic">Chronicle of the Envoy</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadStick}>
              <Upload className="h-4 w-4 mr-1" /> Load Memory
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveStick}>
              <Save className="h-4 w-4 mr-1" /> Save Memory
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-1" /> Import CSV
            </Button>
            <Button size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Profile */}
        <section className="rune-card rounded-xl p-6 md:p-8">
          <div className="grid md:grid-cols-[1.2fr_2fr] gap-8 items-center">
            <div className="text-center md:text-left space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Envoy</p>
              <h2 className="text-4xl md:text-5xl font-display text-gold">
                {data.profile.envoyName || "Nameless"}
              </h2>
              <p className="italic text-muted-foreground">"{data.profile.motto}"</p>
              <div className="flex gap-3 justify-center md:justify-start pt-2">
                <Badge className="bg-primary/15 text-primary border border-primary/40">
                  Level {data.profile.level}
                </Badge>
                <Badge className="bg-accent/30 text-accent-foreground border border-accent/40">
                  {data.profile.realm}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Envoy Name">
                <Input
                  value={data.profile.envoyName}
                  onChange={(e) => updateProfile("envoyName", e.target.value)}
                />
              </Field>
              <Field label="Realm">
                <Input
                  value={data.profile.realm}
                  onChange={(e) => updateProfile("realm", e.target.value)}
                />
              </Field>
              <Field label="Level">
                <Input
                  type="number"
                  min={1}
                  value={data.profile.level}
                  onChange={(e) => updateProfile("level", Number(e.target.value) || 1)}
                />
              </Field>
              <Field label="Motto">
                <Input
                  value={data.profile.motto}
                  onChange={(e) => updateProfile("motto", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-4">
          {(Object.keys(KIND_META) as ItemKind[]).map((k) => {
            const m = KIND_META[k];
            const Icon = m.icon;
            return (
              <div
                key={k}
                className="rune-card rounded-xl p-5 flex items-center gap-4"
                style={{ borderColor: `color-mix(in oklab, ${m.accent} 35%, transparent)` }}
              >
                <Icon className={`h-8 w-8 ${m.color}`} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="text-3xl font-display text-gold">{counts[k]}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Items */}
        <section>
          <Tabs value={activeKind} onValueChange={(v) => setActiveKind(v as ItemKind)}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <TabsList className="bg-card border border-border">
                {(Object.keys(KIND_META) as ItemKind[]).map((k) => {
                  const Icon = KIND_META[k].icon;
                  return (
                    <TabsTrigger key={k} value={k} className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                      <Icon className="h-4 w-4 mr-2" />
                      {KIND_META[k].label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <Button onClick={() => addItem(activeKind)} variant="default">
                <Plus className="h-4 w-4 mr-1" /> Inscribe {KIND_META[activeKind].label.slice(0, -1)}
              </Button>
            </div>

            {(Object.keys(KIND_META) as ItemKind[]).map((k) => (
              <TabsContent key={k} value={k} className="mt-0">
                <ItemList
                  items={data.items.filter((i) => i.kind === k)}
                  kind={k}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <footer className="text-center text-xs text-muted-foreground py-8">
          <div className="divider-ornate mx-auto w-40 mb-3" />
          <p className="italic">"All things remembered, never lost."</p>
        </footer>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ItemList({
  items,
  kind,
  onUpdate,
  onDelete,
}: {
  items: Item[];
  kind: ItemKind;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDelete: (id: string) => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  if (items.length === 0) {
    return (
      <Card className="rune-card border-dashed">
        <CardContent className="py-16 text-center">
          <Icon className={`h-10 w-10 mx-auto mb-3 opacity-60 ${meta.color}`} />
          <p className="text-muted-foreground italic">No {meta.label.toLowerCase()} yet inscribed in your codex.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((it) => (
        <Card key={it.id} className="rune-card overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Icon className={`h-5 w-5 ${meta.color}`} />
              <span className="truncate">{it.name || <em className="text-muted-foreground">Unnamed</em>}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(it.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input value={it.name} onChange={(e) => onUpdate(it.id, { name: e.target.value })} />
              </Field>
              <Field label="Level">
                <Input
                  type="number"
                  min={1}
                  value={it.level}
                  onChange={(e) => onUpdate(it.id, { level: Number(e.target.value) || 1 })}
                />
              </Field>
              <Field label="Rarity">
                <Select
                  value={it.rarity}
                  onValueChange={(v) => onUpdate(it.id, { rarity: v as Item["rarity"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Acquired">
                <Input
                  type="date"
                  value={it.acquiredAt}
                  onChange={(e) => onUpdate(it.id, { acquiredAt: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea
                rows={2}
                value={it.notes}
                onChange={(e) => onUpdate(it.id, { notes: e.target.value })}
                placeholder="Whispered lore, effects, origins…"
              />
            </Field>
            <div className="flex justify-between items-center pt-1">
              <Badge variant="outline" className={rarityClass[it.rarity]}>{it.rarity}</Badge>
              <span className="text-xs text-muted-foreground">Lv. {it.level}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

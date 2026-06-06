import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Swords,
  ScrollText,
  Gem,
  Upload,
  Download,
  Plus,
  Trash2,
  Feather,
  Search,
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
  APP_VERSION,
  type Item,
  type ItemKind,
  type SaveData,
  ITEM_CATEGORIES,
  defaultData,
  exportCSV,
  exportJSON,
  getCategoryName,
  importCSV,
  importJSON,
  loadFromStorage,
} from "@/lib/soulframe-storage";

const KIND_META: Record<
  ItemKind,
  { label: string; icon: typeof Sparkles; color: string; accent: string }
> = {
  rune: { label: "Runas", icon: Sparkles, color: "text-[color:var(--rune)]", accent: "var(--rune)" },
  pact: { label: "Pactos", icon: ScrollText, color: "text-[color:var(--pact)]", accent: "var(--pact)" },
  weapon: { label: "Armas", icon: Swords, color: "text-[color:var(--weapon)]", accent: "var(--weapon)" },
  totem: { label: "Totens", icon: Gem, color: "text-[color:var(--ember)]", accent: "var(--ember)" },
};

const RARITIES: Item["rarity"][] = ["Comum", "Incomum", "Raro", "Épico", "Lendário"];

const rarityClass: Record<Item["rarity"], string> = {
  Comum: "bg-muted text-muted-foreground border-border",
  Incomum: "bg-accent/30 text-accent-foreground border-accent/40",
  Raro: "bg-[color:var(--rune)]/20 text-[color:var(--rune)] border-[color:var(--rune)]/40",
  Épico: "bg-[color:var(--pact)]/20 text-[color:var(--pact)] border-[color:var(--pact)]/40",
  Lendário: "bg-[color:var(--ember)]/20 text-[color:var(--ember)] border-[color:var(--ember)]/40",
};

export function Dashboard() {
  const [data, setData] = useState<SaveData>(defaultData);
  const [savedData, setSavedData] = useState<SaveData>(defaultData);
  const [activeKind, setActiveKind] = useState<ItemKind>("rune");
  const [activeCategory, setActiveCategory] = useState<string>("Todas");
  const [activeSection, setActiveSection] = useState<"items" | "armor">("items");
  const [searchQuery, setItemSearchQuery] = useState("");
  const [setSearchQuery, setSetSearchQuery] = useState("");
  const [newSetName, setNewSetName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadFromStorage();
    setData(loaded);
    setSavedData(loaded);
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(savedData),
    [data, savedData],
  );

  const persistMemory = (next: SaveData) => {
    setData(next);
  };

  const handleLoadStick = () => {
    const loaded = loadFromStorage();
    setData(loaded);
    setSavedData(loaded);
    toast.success("Memória restaurada", { description: "Ecos recuperados da pedra." });
  };

  const handleExport = (format: "csv" | "json") => {
    const content = format === "json" ? exportJSON(data) : exportCSV(data);
    const mimeType = format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
    const extension = format === "json" ? "json" : "csv";
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soulframe-${data.profile.envoyName || "enviado"}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    setSavedData(data);
    toast.success(`Salvar (${format.toUpperCase()})`);
  };

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const isJson = file.name.toLowerCase().endsWith(".json") || text.trim().startsWith("{");
    try {
      const parsed = isJson ? importJSON(text) : importCSV(text);
      setData(parsed);
      toast.success("Pergaminho decifrado", { description: `${parsed.items.length} relíquia(s) carregada(s).` });
    } catch {
      toast.error("Este pergaminho é ilegível.");
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
      categoryId: ITEM_CATEGORIES[0].id,
      category: ITEM_CATEGORIES[0].name,
      rarity: "Comum",
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

  const addArmorSet = () => {
    const name = newSetName.trim();
    if (!name) return;
    persistMemory({
      ...data,
      armorSets: [
        {
          id: crypto.randomUUID(),
          name,
          helmetCount: 0,
          helmetTotal: 5,
          helmetOwned: false,
          chestCount: 0,
          chestTotal: 5,
          chestOwned: false,
          legsCount: 0,
          legsTotal: 5,
          legsOwned: false,
        },
        ...data.armorSets,
      ],
    });
    setNewSetName("");
  };

  const updateArmorPartCount = (
    setId: string,
    part: "helmet" | "chest" | "legs",
    nextCount: number,
  ) => {
    persistMemory({
      ...data,
      armorSets: data.armorSets.map((set) => {
        if (set.id !== setId) return set;
        const max = part === "helmet" ? set.helmetTotal : part === "chest" ? set.chestTotal : set.legsTotal;
        const safeCount = Math.max(0, Math.min(nextCount, max));
        return {
          ...set,
          [part === "helmet" ? "helmetCount" : part === "chest" ? "chestCount" : "legsCount"]: safeCount,
        };
      }),
    });
  };

  const updateArmorPartOwned = (
    setId: string,
    part: "helmet" | "chest" | "legs",
    nextOwned: boolean,
  ) => {
    persistMemory({
      ...data,
      armorSets: data.armorSets.map((set) =>
        set.id === setId
          ? {
              ...set,
              [part === "helmet" ? "helmetOwned" : part === "chest" ? "chestOwned" : "legsOwned"]: nextOwned,
            }
          : set,
      ),
    });
  };

  const updateArmorPartTotal = (
    setId: string,
    part: "helmet" | "chest" | "legs",
    nextTotal: number,
  ) => {
    persistMemory({
      ...data,
      armorSets: data.armorSets.map((set) => {
        if (set.id !== setId) return set;
        const safeTotal = Math.max(1, nextTotal);
        const countKey = part === "helmet" ? "helmetCount" : part === "chest" ? "chestCount" : "legsCount";
        const totalKey = part === "helmet" ? "helmetTotal" : part === "chest" ? "chestTotal" : "legsTotal";
        return {
          ...set,
          [totalKey]: safeTotal,
          [countKey]: Math.min(set[countKey as keyof typeof set] as number, safeTotal),
        };
      }),
    });
  };

  const deleteArmorSet = (setId: string) => {
    persistMemory({
      ...data,
      armorSets: data.armorSets.filter((set) => set.id !== setId),
    });
  };

  const counts = useMemo(() => {
    const c = { rune: 0, pact: 0, weapon: 0, totem: 0 } as Record<ItemKind, number>;
    data.items.forEach((i) => (c[i.kind] += 1));
    return c;
  }, [data.items]);

  const showCategoryFilters = activeKind !== "pact";

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!searchLower) return null;
    return data.items.filter((it) => {
      const hay = `${it.name} ${it.notes} ${it.rarity} ${it.kind} ${it.category ?? ""}`.toLowerCase();
      return hay.includes(searchLower);
    });
  }, [data.items, searchLower]);

  const filteredArmorSets = useMemo(() => {
    const query = setSearchQuery.trim().toLowerCase();
    if (!query) return data.armorSets;
    return data.armorSets.filter((set) => {
      const hay = `${set.name} ${set.helmetCount}/${set.helmetTotal} elmo ${set.chestCount}/${set.chestTotal} couraça ${set.legsCount}/${set.legsTotal} calças`.toLowerCase();
      return hay.includes(query);
    });
  }, [data.armorSets, setSearchQuery]);

  return (
    <div className="min-h-screen w-full">
<input ref={fileRef} type="file" accept=".csv,text/csv,.json,application/json" hidden onChange={handleFile} />

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
              <h1 className="text-xl md:text-2xl text-gold font-display">Soulframe Memorial</h1>
              <p className="text-sm text-muted-foreground italic">Crônica do Enviado</p>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Versão {APP_VERSION}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={hasChanges ? "default" : "outline"}
              size="sm"
              onClick={() => handleExport("json")}
              className={hasChanges ? "border-amber-400 bg-amber-500/15 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.25)] animate-pulse" : ""}
            >
              <Download className="h-4 w-4 mr-1" />
              {hasChanges ? "Salvar JSON • pendente" : "Salvar JSON"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <Download className="h-4 w-4 mr-1" /> Salvar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-1" /> Importar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Profile */}
        <section className="rune-card rounded-xl p-6 md:p-8">
          <div className="grid md:grid-cols-[1.2fr_2fr] gap-8 items-center">
            <div className="text-center md:text-left space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Enviado</p>
              <h2 className="text-4xl md:text-5xl font-display text-gold">
                {data.profile.envoyName || "Sem Nome"}
              </h2>
              <p className="italic text-muted-foreground text-lg">"{data.profile.motto}"</p>
              <div className="flex gap-3 justify-center md:justify-start pt-2">
                <Badge className="bg-primary/15 text-primary border border-primary/40 text-sm">
                  Nível {data.profile.level}
                </Badge>
                <Badge className="bg-accent/30 text-accent-foreground border border-accent/40 text-sm">
                  {data.profile.realm}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome do Enviado">
                <Input
                  value={data.profile.envoyName}
                  onChange={(e) => updateProfile("envoyName", e.target.value)}
                />
              </Field>
              <Field label="Reino">
                <Input
                  value={data.profile.realm}
                  onChange={(e) => updateProfile("realm", e.target.value)}
                />
              </Field>
              <Field label="Nível">
                <Input
                  type="number"
                  min={1}
                  value={data.profile.level}
                  onChange={(e) => updateProfile("level", Number(e.target.value) || 1)}
                />
              </Field>
              <Field label="Lema">
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
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="text-3xl font-display text-gold">{counts[k]}</p>
                </div>
              </div>
            );
          })}
        </section>

        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as "items" | "armor")} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-auto w-full max-w-2xl items-stretch rounded-2xl border border-border/80 bg-card/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur md:w-auto md:min-w-[420px]">
              <TabsTrigger value="items" className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-all data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm md:px-6 md:text-base">Itens</TabsTrigger>
              <TabsTrigger value="armor" className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-all data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm md:px-6 md:text-base">Sets de Armadura</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="items" className="mt-0 space-y-6">
            <section className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar runas, pactos, armas, totems, notas, raridade…"
                  value={searchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="pl-10 py-5 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setItemSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </section>

            <section>
          {filteredItems ? (
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-lg font-display text-gold">
                  Resultados da Busca
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filteredItems.length} relíquia{filteredItems.length !== 1 ? "s" : ""} encontrada{filteredItems.length !== 1 ? "s" : ""}
                </p>
              </div>
              {filteredItems.length === 0 ? (
                <Card className="rune-card border-dashed">
                  <CardContent className="py-16 text-center">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-60 text-muted-foreground" />
                    <p className="text-muted-foreground italic text-base">Nenhuma relíquia corresponde à sua busca.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredItems.map((it) => (
                    <ItemCard
                      key={it.id}
                      item={it}
                      onUpdate={updateItem}
                      onDelete={deleteItem}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
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
                  <Plus className="h-4 w-4 mr-1" /> Inscrever {activeKind === "weapon" ? "Arma" : activeKind === "pact" ? "Pacto" : activeKind === "totem" ? "Totem" : "Runa"}
                </Button>
              </div>

              {showCategoryFilters && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("Todas")}
                    className={`rounded-full border px-3 py-1 text-sm ${activeCategory === "Todas" ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
                  >
                    Todas
                  </button>
                  {ITEM_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(String(category.id))}
                      className={`rounded-full border px-3 py-1 text-sm ${activeCategory === String(category.id) ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {(Object.keys(KIND_META) as ItemKind[]).map((k) => (
                <TabsContent key={k} value={k} className="mt-0">
                  <ItemList
                    items={data.items.filter((i) => {
                      if (i.kind !== k) return false;
                      if (k === "pact") return true;
                      return activeCategory === "Todas" || i.categoryId === Number(activeCategory);
                    })}
                    kind={k}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
            </section>
          </TabsContent>

          <TabsContent value="armor" className="mt-0">
            <section className="rune-card rounded-xl p-6 md:p-8 space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Sets de Armadura</p>
                  <h3 className="text-2xl font-display text-gold">Cadastre seus conjuntos e acompanhe quantas partes você já possui</h3>
                </div>
                <div className="flex flex-col gap-2 md:w-[420px]">
                  <div className="flex gap-2">
                    <Input
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      placeholder="Nome do set"
                      className="flex-1"
                    />
                    <Button onClick={addArmorSet} variant="default">Adicionar set</Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={setSearchQuery}
                      onChange={(e) => setSetSearchQuery(e.target.value)}
                      placeholder="Buscar set por nome ou peça…"
                      className="pl-10"
                    />
                    {setSearchQuery && (
                      <button
                        onClick={() => setSetSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredArmorSets.length === 0 ? (
                <Card className="rune-card border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground italic">
                    Nenhum set cadastrado ainda. Adicione um nome e comece a marcar as partes que você possui.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredArmorSets.map((set) => {
                    const completedParts = [set.helmetOwned, set.chestOwned, set.legsOwned].filter(Boolean).length;
                    const complete = completedParts === 3;
                    const progressLabel = `${completedParts}/3`;
                    const parts = [
                      { key: "helmet", label: "Elmo", count: set.helmetCount, total: set.helmetTotal },
                      { key: "chest", label: "Couraça", count: set.chestCount, total: set.chestTotal },
                      { key: "legs", label: "Calças", count: set.legsCount, total: set.legsTotal },
                    ] as const;
                    return (
                      <Card key={set.id} className="rune-card overflow-hidden">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
                          <div>
                            <CardTitle className="text-lg font-display text-gold">{set.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">Progresso: {progressLabel} partes completas</p>
                            <p className="text-xs text-muted-foreground">Use os campos para registrar 2/5, 3/5, etc.</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteArmorSet(set.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-2">
                            {parts.map((part) => (
                              <div
                                key={part.key}
                                className="rounded-lg border border-border bg-card/80 p-3 text-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={part.key === "helmet" ? set.helmetOwned : part.key === "chest" ? set.chestOwned : set.legsOwned}
                                      onChange={(e) =>
                                        updateArmorPartOwned(set.id, part.key, e.target.checked)
                                      }
                                    />
                                    <span className="font-medium text-foreground">{part.label}</span>
                                  </div>
                                  <span className="text-muted-foreground">{part.count}/{part.total}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={part.total}
                                    value={part.count}
                                    onChange={(e) => updateArmorPartCount(set.id, part.key, Number(e.target.value) || 0)}
                                    className="h-9 w-20"
                                  />
                                  <span className="text-muted-foreground">de</span>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={part.total}
                                    onChange={(e) => updateArmorPartTotal(set.id, part.key, Number(e.target.value) || 1)}
                                    className="h-9 w-20"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-3 py-2 text-sm">
                            <span>Tenho o set inteiro</span>
                            <label className="flex items-center gap-2 text-primary">
                              <input type="checkbox" checked={complete} disabled />
                              <span>{complete ? "Completo" : `Em progresso (${progressLabel})`}</span>
                            </label>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-sm text-muted-foreground py-8">
          <div className="divider-ornate mx-auto w-40 mb-3" />
          <p className="italic text-base">"Tudo que é lembrado, nunca se perde."</p>
        </footer>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm uppercase tracking-widest text-muted-foreground">{label}</Label>
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
    const emptyMsg: Record<ItemKind, string> = {
      rune: "Nenhuma runa inscrita no seu códice ainda.",
      pact: "Nenhum pacto inscrito no seu códice ainda.",
      weapon: "Nenhuma arma inscrita no seu códice ainda.",
      totem: "Nenhum totem inscrito no seu códice ainda.",
    };
    return (
      <Card className="rune-card border-dashed">
        <CardContent className="py-16 text-center">
          <Icon className={`h-10 w-10 mx-auto mb-3 opacity-60 ${meta.color}`} />
          <p className="text-muted-foreground italic text-base">{emptyMsg[kind]}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((it) => (
        <ItemCard key={it.id} item={it} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  onUpdate,
  onDelete,
}: {
  item: Item;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onDelete: (id: string) => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  return (
    <Card className="rune-card overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Icon className={`h-5 w-5 ${meta.color}`} />
          <span className="truncate">{item.name || <em className="text-muted-foreground">Sem Nome</em>}</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <Input value={item.name} onChange={(e) => onUpdate(item.id, { name: e.target.value })} />
          </Field>
          <Field label="Nível">
            <Input
              type="number"
              min={1}
              value={item.level}
              onChange={(e) => onUpdate(item.id, { level: Number(e.target.value) || 1 })}
            />
          </Field>
          <Field label="Categoria">
            <Select
              value={String(item.categoryId ?? ITEM_CATEGORIES[0].id)}
              onValueChange={(v) => {
                const nextCategoryId = Number(v);
                onUpdate(item.id, {
                  categoryId: nextCategoryId,
                  category: ITEM_CATEGORIES.find((category) => category.id === nextCategoryId)?.name ?? getCategoryName(nextCategoryId),
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Raridade">
            <Select
              value={item.rarity}
              onValueChange={(v) => onUpdate(item.id, { rarity: v as Item["rarity"] })}
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
          <Field label="Adquirido">
            <Input
              type="date"
              value={item.acquiredAt}
              onChange={(e) => onUpdate(item.id, { acquiredAt: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Notas">
          <Textarea
            rows={2}
            value={item.notes}
            onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
            placeholder="Lore sussurrada, efeitos, origens…"
          />
        </Field>
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={rarityClass[item.rarity]}>{item.rarity}</Badge>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">{item.category ?? getCategoryName(item.categoryId)}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">Nv. {item.level}</span>
        </div>
      </CardContent>
    </Card>
  );
}

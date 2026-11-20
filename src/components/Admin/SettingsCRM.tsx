"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Sliders,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Gamepad2,
  UserCheck,
  Globe,
  Code2,
} from "lucide-react";

interface SubMenuItem {
  id: number | string;
  name: string;
  slug?: string;
  nametext?: string;
  status: boolean;
}

interface MenuItem {
  id: number | string;
  name: string;
  slug?: string;
  nametext?: string;
  status: boolean;
  subItem?: SubMenuItem[];
}

interface PsychologistModules {
  dbId: number;
  clerkUserId: string;
  name: string;
  email: string;
  status: string;
  hasCustomMenu: boolean;
  menu: MenuItem[];
}

interface SettingsCRMProps {
  adminName: string;
  adminEmail: string;
}

type TabKey = "modules" | "create_game" | "profile";

export function SettingsCRM({ adminName, adminEmail }: SettingsCRMProps) {
  const [tab, setTab] = useState<TabKey>("modules");
  const [psychologists, setPsychologists] = useState<PsychologistModules[]>([]);
  const [defaultMenu, setDefaultMenu] = useState<MenuItem[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<"global" | number>("global");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // JSON inspector/editor
  const [showJson, setShowJson] = useState(false);
  const [rawJson, setRawJson] = useState("");

  // Form to add custom module/option
  const [newModName, setNewModName] = useState("");
  const [newModSlug, setNewModSlug] = useState("");

  // Inline edit state for module label
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  // Form to create global game
  const [gameName, setGameName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [addToAllMenus, setAddToAllMenus] = useState(true);

  const loadModules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/modules", { credentials: "include" });
      if (!res.ok) throw new Error("No se pudieron cargar los módulos");
      const data = await res.json();
      setPsychologists(data.psychologists || []);
      setDefaultMenu(data.defaultMenu || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error cargando módulos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const filteredPsychologists = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return psychologists;
    return psychologists.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [psychologists, search]);

  const selectedPsychologist = useMemo(
    () =>
      selectedTarget === "global"
        ? null
        : psychologists.find((p) => p.dbId === selectedTarget) || null,
    [psychologists, selectedTarget]
  );

  const activeMenu = selectedTarget === "global" ? defaultMenu : selectedPsychologist?.menu || [];

  useEffect(() => {
    setRawJson(JSON.stringify({ menu: activeMenu }, null, 2));
    setEditingIdx(null);
  }, [selectedTarget, defaultMenu, selectedPsychologist]);

  const persistMenu = async (
    nextMenu: MenuItem[],
    successMsg: string,
    options?: { applyToExisting?: boolean }
  ) => {
    setSaving(true);
    setFeedback(null);

    if (selectedTarget === "global") {
      setDefaultMenu(nextMenu);
      if (options?.applyToExisting) {
        setPsychologists((prev) => prev.map((p) => ({ ...p, menu: nextMenu, hasCustomMenu: true })));
      }
    } else if (selectedPsychologist) {
      setPsychologists((prev) =>
        prev.map((p) =>
          p.dbId === selectedPsychologist.dbId ? { ...p, menu: nextMenu, hasCustomMenu: true } : p
        )
      );
    }

    try {
      const payload =
        selectedTarget === "global"
          ? { scope: "global", menu: nextMenu, applyToExisting: Boolean(options?.applyToExisting) }
          : { scope: "user", dbId: selectedPsychologist?.dbId, menu: nextMenu };

      const res = await fetch("/api/settings/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo guardar en base de datos");
      setFeedback({ type: "success", text: successMsg });
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error guardando cambios" });
      await loadModules();
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (modIndex: number) => {
    const nextMenu = activeMenu.map((m, idx) =>
      idx === modIndex ? { ...m, status: m.status === false } : m
    );
    const target = nextMenu[modIndex];
    const targetName = selectedTarget === "global" ? "Plantilla Global" : selectedPsychologist?.name;
    persistMenu(
      nextMenu,
      `${target.nametext || target.name} ${target.status ? "activado" : "desactivado"} en ${targetName}`
    );
  };

  const toggleSubModule = (modIndex: number, subIndex: number) => {
    const nextMenu = activeMenu.map((m, idx) => {
      if (idx !== modIndex || !Array.isArray(m.subItem)) return m;
      const nextSubs = m.subItem.map((s, sIdx) =>
        sIdx === subIndex ? { ...s, status: s.status === false } : s
      );
      return { ...m, subItem: nextSubs };
    });
    const sub = nextMenu[modIndex].subItem?.[subIndex];
    const targetName = selectedTarget === "global" ? "Plantilla Global" : selectedPsychologist?.name;
    persistMenu(
      nextMenu,
      `${sub?.nametext || sub?.name} ${sub?.status ? "activado" : "desactivado"} en ${targetName}`
    );
  };

  const handleAddOption = async (e: FormEvent) => {
    e.preventDefault();
    if (!newModName.trim() || !newModSlug.trim()) return;
    const nextMenu: MenuItem[] = [
      ...activeMenu,
      {
        id: Date.now(),
        name: newModSlug.trim(),
        slug: newModSlug.trim(),
        nametext: newModName.trim(),
        status: true,
      },
    ];
    await persistMenu(
      nextMenu,
      `Opción "${newModName.trim()}" agregada`
    );
    setNewModName("");
    setNewModSlug("");
  };

  const handleSaveEditLabel = async (modIndex: number) => {
    if (!editingLabel.trim()) return;
    const nextMenu = activeMenu.map((m, idx) =>
      idx === modIndex ? { ...m, nametext: editingLabel.trim() } : m
    );
    setEditingIdx(null);
    await persistMenu(nextMenu, `Opción renombrada a "${editingLabel.trim()}"`);
  };

  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJson);
      const menuArr = Array.isArray(parsed) ? parsed : parsed?.menu;
      if (!Array.isArray(menuArr)) {
        setFeedback({ type: "error", text: "El JSON debe tener un arreglo 'menu'" });
        return;
      }
      await persistMenu(menuArr, "JSON de menú guardado correctamente");
    } catch {
      setFeedback({ type: "error", text: "JSON inválido — revisa la sintaxis" });
    }
  };

  const handleCreateGame = async (e: FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !gameDesc.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gameName.trim(),
          slug: gameSlug.trim() || gameName.trim().toLowerCase().replace(/\s+/g, "-"),
          description: gameDesc.trim(),
          addToAllMenus,
        }),
      });
      if (!res.ok) throw new Error("No se pudo crear el juego");
      const data = await res.json();
      setFeedback({
        type: "success",
        text: addToAllMenus
          ? `Juego "${gameName.trim()}" creado y enlazado a nuevos y antiguos psicólogos (/client/games/${data.slug})`
          : `Juego "${gameName.trim()}" creado en el catálogo`,
      });
      setGameName("");
      setGameSlug("");
      setGameDesc("");
      await loadModules();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Error creando juego" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="alert"
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button
            onClick={() => setTab("modules")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "modules" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Plantilla y Módulos
          </button>
          <button
            onClick={() => setTab("create_game")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "create_game" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Catálogo de Juegos
          </button>
          <button
            onClick={() => setTab("profile")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "profile" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Perfil Admin
          </button>
        </div>

        <button
          onClick={loadModules}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Sincronizar
        </button>
      </div>

      {tab === "modules" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector: Plantilla Global + Psicólogos */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedTarget("global")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  selectedTarget === "global"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/70"
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">Plantilla Global</p>
                  <p className={`text-[11px] ${selectedTarget === "global" ? "text-indigo-100" : "text-indigo-600"}`}>
                    Menú por defecto al registrarse
                  </p>
                </div>
              </button>
            </div>

            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar psicólogo..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="max-h-[440px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPsychologists.length === 0 ? (
                <p className="p-6 text-center text-xs text-gray-400">Sin psicólogos</p>
              ) : (
                filteredPsychologists.map((p) => {
                  const isSelected = selectedTarget === p.dbId;
                  return (
                    <button
                      key={p.dbId}
                      onClick={() => setSelectedTarget(p.dbId)}
                      className={`w-full text-left p-4 transition-colors ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-900/20 border-l-4 border-indigo-600"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {selectedTarget === "global"
                    ? "Plantilla Global de Registro"
                    : `Módulos de ${selectedPsychologist?.name}`}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedTarget === "global"
                    ? "Define qué módulos y juegos recibe cada psicólogo nuevo al registrarse."
                    : "Los cambios se guardan al instante en su menú."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedTarget === "global" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      persistMenu(
                        defaultMenu,
                        "Plantilla global aplicada a todos los psicólogos existentes",
                        { applyToExisting: true }
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Aplicar a todos los psicólogos
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowJson((s) => !s)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showJson ? "Vista Visual" : "Ver / Editar JSON"}
                </button>
              </div>
            </div>

            {showJson ? (
              <div className="space-y-3">
                <textarea
                  rows={14}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  className="w-full font-mono text-xs p-4 rounded-xl bg-gray-950 text-emerald-300 border border-gray-800"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveRawJson}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    Guardar JSON
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {activeMenu.map((mod, mIdx) => {
                    const enabled = mod.status !== false;
                    return (
                      <div
                        key={`${mod.name}-${mIdx}`}
                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {editingIdx === mIdx ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-white dark:bg-gray-900 border border-indigo-300 rounded-lg flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditLabel(mIdx)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingIdx(null)}
                                className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {mod.nametext || mod.name}
                              </p>
                              <p className="text-[11px] font-mono text-gray-400">/{mod.name}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 shrink-0">
                            {editingIdx !== mIdx && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIdx(mIdx);
                                  setEditingLabel(mod.nametext || mod.name);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleModule(mIdx)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                enabled
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                            >
                              {enabled ? "Activo" : "Desactivado"}
                            </button>
                          </div>
                        </div>

                        {Array.isArray(mod.subItem) && mod.subItem.length > 0 && (
                          <div className="pl-4 border-l-2 border-indigo-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.subItem.map((sub, sIdx) => {
                              const subOn = sub.status !== false;
                              return (
                                <div
                                  key={`${sub.name}-${sIdx}`}
                                  className="flex items-center justify-between bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800"
                                >
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {sub.nametext || sub.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleSubModule(mIdx, sIdx)}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      subOn
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                                  >
                                    {subOn ? "ON" : "OFF"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add custom option */}
                <form
                  onSubmit={handleAddOption}
                  className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    placeholder="Nombre visible (ej. Reportes)"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                  <input
                    type="text"
                    value={newModSlug}
                    onChange={(e) => setNewModSlug(e.target.value)}
                    placeholder="Ruta / slug (ej. reports)"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
                  />
                  <button
                    type="submit"
                    disabled={saving || !newModName.trim() || !newModSlug.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar opción
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "create_game" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 max-w-xl">
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
            Registrar Nuevo Juego Terapéutico
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            El juego se enlazará en el menú bajo <code className="font-mono">/client/games/&lt;slug&gt;</code>.
          </p>
          <form onSubmit={handleCreateGame} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Ej. Mindfulness Diario"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Slug (ruta)</label>
              <input
                type="text"
                value={gameSlug}
                onChange={(e) => setGameSlug(e.target.value)}
                placeholder="mindfulness-diario"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Descripción</label>
              <textarea
                rows={3}
                required
                value={gameDesc}
                onChange={(e) => setGameDesc(e.target.value)}
                placeholder="Objetivo terapéutico del juego..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={addToAllMenus}
                onChange={(e) => setAddToAllMenus(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600"
              />
              Agregar automáticamente al menú de todos los psicólogos (nuevos y antiguos)
            </label>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
            >
              Crear y Enlazar Juego
            </button>
          </form>
        </div>
      )}

      {tab === "profile" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 max-w-xl space-y-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Cuenta Administradora</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase">Nombre</p>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{adminName || "Administrador"}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs font-bold text-gray-400 uppercase">Correo</p>
              <p className="font-bold text-gray-900 dark:text-white mt-1">{adminEmail || "—"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

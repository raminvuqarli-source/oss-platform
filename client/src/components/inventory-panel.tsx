import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Building2,
  UtensilsCrossed,
  Store,
  X,
} from "lucide-react";

export type InventoryScope = "hotel" | "hotel-restaurant" | "standalone-restaurant";

export type InventoryItem = {
  id: string;
  scope: InventoryScope;
  name: string;
  category: string;
  purchaseUnit: string;
  consumptionUnit: string;
  currentStock: number;
  criticalThreshold: number;
  unitCost?: number;
};

export type InventoryExpenseEntry = {
  id: string;
  date: string;
  itemName: string;
  category: string;
  scope: InventoryScope;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

const STORAGE_KEY = "oss_inventory_v1";
const EXPENSES_KEY = "oss_inventory_expenses_v1";

function loadExpenses(): InventoryExpenseEntry[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (raw) return JSON.parse(raw) as InventoryExpenseEntry[];
  } catch {}
  return [];
}

function saveExpenses(entries: InventoryExpenseEntry[]) {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(entries));
  } catch {}
}

function logExpense(entry: Omit<InventoryExpenseEntry, "id">) {
  const entries = loadExpenses();
  entries.unshift({ ...entry, id: `exp_${Date.now()}` });
  saveExpenses(entries.slice(0, 500));
}

export function getInventoryExpenseSummary(scope?: InventoryScope) {
  const entries = loadExpenses();
  const filtered = scope ? entries.filter(e => e.scope === scope) : entries;
  const now = new Date();
  const thisMonth = filtered.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  return {
    allTime: filtered.reduce((s, e) => s + e.totalCost, 0),
    thisMonth: thisMonth.reduce((s, e) => s + e.totalCost, 0),
    entries: filtered.slice(0, 20),
  };
}

export function InventoryExpenseWidget({ scope, accentColor = "emerald" }: { scope?: InventoryScope; accentColor?: "emerald" | "red" }) {
  const { t } = useTranslation();
  const [inv, setInv] = useState(() => getInventoryExpenseSummary(scope));

  useEffect(() => {
    setInv(getInventoryExpenseSummary(scope));
    const handler = () => setInv(getInventoryExpenseSummary(scope));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [scope]);

  if (inv.allTime <= 0) return null;

  const accent = accentColor === "red"
    ? { border: "border-red-200 dark:border-red-900/40", bg: "bg-red-50/30 dark:bg-red-950/10", text: "text-red-600", icon: "text-red-600" }
    : { border: "border-emerald-200 dark:border-emerald-900/40", bg: "bg-emerald-50/40 dark:bg-emerald-950/10", text: "text-emerald-600", icon: "text-emerald-600" };

  return (
    <Card className={`${accent.border} ${accent.bg}`} data-testid="card-inventory-expenses">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className={`h-4 w-4 ${accent.icon}`} />
          {t("inventory.financeTitle", "Anbar Xərcləri")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-background border">
            <p className="text-xs text-muted-foreground mb-1">{t("inventory.thisMonth", "Bu ay")}</p>
            <p className={`text-lg font-bold ${accent.text}`}>₼{inv.thisMonth.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border">
            <p className="text-xs text-muted-foreground mb-1">{t("inventory.allTime", "Ümumi")}</p>
            <p className="text-lg font-bold">₼{inv.allTime.toFixed(2)}</p>
          </div>
        </div>
        {inv.entries.length > 0 && (
          <div className="space-y-0 max-h-40 overflow-y-auto">
            {inv.entries.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate">{e.itemName}</span>
                  <span className="text-muted-foreground ml-2">{new Date(e.date).toLocaleDateString()}</span>
                </div>
                <span className="font-semibold text-red-600 shrink-0 ml-2">-₼{e.totalCost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const DEFAULT_ITEMS: InventoryItem[] = [
  { id: "h1", scope: "hotel", name: "Dəsmal", category: "Otaq Ləvazimatları", purchaseUnit: "Bağlama", consumptionUnit: "Ədəd", currentStock: 85, criticalThreshold: 20 },
  { id: "h2", scope: "hotel", name: "Şampun", category: "Otaq Ləvazimatları", purchaseUnit: "Qutu", consumptionUnit: "Şüşə", currentStock: 12, criticalThreshold: 15 },
  { id: "h3", scope: "hotel", name: "Sabun", category: "Otaq Ləvazimatları", purchaseUnit: "Qutu", consumptionUnit: "Ədəd", currentStock: 30, criticalThreshold: 10 },
  { id: "h4", scope: "hotel", name: "Minibar Su", category: "Minibar", purchaseUnit: "Kərt", consumptionUnit: "Şüşə", currentStock: 7, criticalThreshold: 20 },
  { id: "h5", scope: "hotel", name: "Yataq Örtüyü", category: "Otaq Ləvazimatları", purchaseUnit: "Ədəd", consumptionUnit: "Ədəd", currentStock: 40, criticalThreshold: 10 },
  { id: "hr1", scope: "hotel-restaurant", name: "Un", category: "Baş Ehtiyatlar", purchaseUnit: "Kisə (50kq)", consumptionUnit: "Kq", currentStock: 3, criticalThreshold: 5 },
  { id: "hr2", scope: "hotel-restaurant", name: "Zeytun Yağı", category: "Yağlar", purchaseUnit: "Qutu (12L)", consumptionUnit: "Litr", currentStock: 8, criticalThreshold: 3 },
  { id: "hr3", scope: "hotel-restaurant", name: "Pomidor", category: "Tərəvəz", purchaseUnit: "Kq", consumptionUnit: "Kq", currentStock: 15, criticalThreshold: 5 },
  { id: "hr4", scope: "hotel-restaurant", name: "Şərab", category: "İçkilər", purchaseUnit: "Qab (6 şüşə)", consumptionUnit: "Şüşə", currentStock: 2, criticalThreshold: 6 },
  { id: "sr1", scope: "standalone-restaurant", name: "Qəhvə", category: "İçkilər", purchaseUnit: "Kisə (1kq)", consumptionUnit: "Qram", currentStock: 2400, criticalThreshold: 500 },
  { id: "sr2", scope: "standalone-restaurant", name: "Şəkər", category: "Baş Ehtiyatlar", purchaseUnit: "Kisə (5kq)", consumptionUnit: "Kq", currentStock: 12, criticalThreshold: 3 },
  { id: "sr3", scope: "standalone-restaurant", name: "Salfet", category: "Sərvis", purchaseUnit: "Qutu (1000)", consumptionUnit: "Ədəd", currentStock: 250, criticalThreshold: 100 },
];

function loadItems(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as InventoryItem[];
  } catch {}
  return DEFAULT_ITEMS;
}

function saveItems(items: InventoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

type FormState = {
  name: string;
  category: string;
  purchaseUnit: string;
  consumptionUnit: string;
  currentStock: string;
  criticalThreshold: string;
  unitCost: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  purchaseUnit: "",
  consumptionUnit: "",
  currentStock: "",
  criticalThreshold: "",
  unitCost: "",
};

function StockBar({ current, threshold }: { current: number; threshold: number }) {
  const pct = threshold > 0 ? Math.min(100, (current / Math.max(threshold * 2, current, 1)) * 100) : 100;
  const isCritical = current <= threshold;
  const isWarning = current <= threshold * 1.5 && !isCritical;
  const color = isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function InventoryItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const isCritical = item.currentStock <= item.criticalThreshold;
  const isWarning = item.currentStock <= item.criticalThreshold * 1.5 && !isCritical;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`border transition-colors ${isCritical ? "border-red-400/50 bg-red-50/30 dark:bg-red-950/10" : isWarning ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10" : "border-border/50"}`}
        data-testid={`card-inventory-${item.id}`}
      >
        <CardContent className="p-3.5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold leading-tight truncate" data-testid={`text-item-name-${item.id}`}>
                  {item.name}
                </p>
                {isCritical && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 shrink-0" data-testid={`badge-critical-${item.id}`}>
                    {t("inventory.critical", "Kritik")}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.category}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(item)}
                data-testid={`btn-edit-${item.id}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(item.id)}
                data-testid={`btn-delete-${item.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <StockBar current={item.currentStock} threshold={item.criticalThreshold} />

          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">{t("inventory.currentStock", "Cari Stok")}</p>
                <p className={`text-sm font-bold leading-tight ${isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-foreground"}`} data-testid={`text-stock-${item.id}`}>
                  {item.currentStock} <span className="text-[10px] font-normal text-muted-foreground">{item.consumptionUnit}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("inventory.criticalThreshold", "Kritik Hədd")}</p>
                <p className="text-sm font-medium leading-tight text-muted-foreground">
                  {item.criticalThreshold} <span className="text-[10px]">{item.consumptionUnit}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">{t("inventory.purchaseUnit", "Alış")}</p>
              <p className="text-[11px] font-medium">{item.purchaseUnit}</p>
              {item.unitCost != null && item.unitCost > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5" data-testid={`text-cost-${item.id}`}>
                  ₼{item.unitCost.toFixed(2)}/{item.consumptionUnit}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  scope,
  editItem,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: InventoryScope;
  editItem: InventoryItem | null;
  onSave: (item: Omit<InventoryItem, "id">) => void;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"manual" | "excel">("manual");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode("manual");
      if (editItem) {
        setForm({
          name: editItem.name,
          category: editItem.category,
          purchaseUnit: editItem.purchaseUnit,
          consumptionUnit: editItem.consumptionUnit,
          currentStock: String(editItem.currentStock),
          criticalThreshold: String(editItem.criticalThreshold),
          unitCost: editItem.unitCost != null ? String(editItem.unitCost) : "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, editItem]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: t("inventory.productName", "Məhsulun adı"), description: "Ad daxil edin", variant: "destructive" });
      return;
    }
    const unitCost = parseFloat(form.unitCost) || 0;
    const qty = parseFloat(form.currentStock) || 0;
    onSave({
      scope,
      name: form.name.trim(),
      category: form.category.trim() || "Ümumi",
      purchaseUnit: form.purchaseUnit.trim() || "Ədəd",
      consumptionUnit: form.consumptionUnit.trim() || "Ədəd",
      currentStock: qty,
      criticalThreshold: parseFloat(form.criticalThreshold) || 0,
      unitCost,
    });
    onOpenChange(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      toast({ title: `"${file.name}" ${t("inventory.excelImport", "Excel Import")}`, description: "Excel import funksiyası tezliklə əlçatan olacaq." });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: `"${file.name}" ${t("inventory.excelImport", "Excel Import")}`, description: "Excel import funksiyası tezliklə əlçatan olacaq." });
    }
  };

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-add-product">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {editItem ? t("inventory.edit", "Düzəlt") : t("inventory.addProductTitle", "Yeni Məhsul Əlavə Et")}
          </DialogTitle>
          <DialogDescription>{t("inventory.addProductDesc", "Məhsulu əllə əlavə edin və ya Excel faylından import edin")}</DialogDescription>
        </DialogHeader>

        {!editItem && (
          <div className="flex rounded-lg border border-border overflow-hidden text-sm" data-testid="toggle-mode">
            <button
              onClick={() => setMode("manual")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${mode === "manual" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
              data-testid="btn-mode-manual"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("inventory.manualAdd", "Əllə Əlavə Et")}
            </button>
            <button
              onClick={() => setMode("excel")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors ${mode === "excel" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-muted-foreground"}`}
              data-testid="btn-mode-excel"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {t("inventory.excelImport", "Excel Import")}
            </button>
          </div>
        )}

        {(editItem || mode === "manual") && (
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>{t("inventory.productName", "Məhsulun adı")} *</Label>
                <Input
                  placeholder={t("inventory.productNamePlaceholder", "məs. Dəsmal, Un, Qəhvə")}
                  value={form.name}
                  onChange={set("name")}
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("inventory.category", "Kateqoriya")}</Label>
                <Input
                  placeholder={t("inventory.categoryPlaceholder", "məs. Otaq Ləvazimatları")}
                  value={form.category}
                  onChange={set("category")}
                  data-testid="input-product-category"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("inventory.purchaseUnit", "Alış Vahidi")}</Label>
                <Input
                  placeholder={t("inventory.purchaseUnitPlaceholder", "məs. Qutu, Kisə")}
                  value={form.purchaseUnit}
                  onChange={set("purchaseUnit")}
                  data-testid="input-purchase-unit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("inventory.consumptionUnit", "Sərfiyyat Vahidi")}</Label>
                <Input
                  placeholder={t("inventory.consumptionUnitPlaceholder", "məs. Ədəd, Litr, Kq")}
                  value={form.consumptionUnit}
                  onChange={set("consumptionUnit")}
                  data-testid="input-consumption-unit"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("inventory.currentStock", "Cari Stok")}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.currentStock}
                  onChange={set("currentStock")}
                  data-testid="input-current-stock"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t("inventory.criticalThreshold", "Kritik Hədd")}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.criticalThreshold}
                  onChange={set("criticalThreshold")}
                  data-testid="input-critical-threshold"
                />
                <p className="text-[11px] text-muted-foreground">{t("inventory.criticalThresholdHint", "Bu qiymətdən aşağı düşəndə xəbərdarlıq göstəriləcək")}</p>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>{t("inventory.unitCost", "Vahid Qiymət (₼)")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.unitCost}
                  onChange={set("unitCost")}
                  data-testid="input-unit-cost"
                />
                <p className="text-[11px] text-muted-foreground">{t("inventory.unitCostHint", "Bir vahidin alış qiyməti — maliyyə hesabatına əks olunacaq")}</p>
              </div>
            </div>
          </div>
        )}

        {!editItem && mode === "excel" && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
            onClick={() => fileRef.current?.click()}
            data-testid="excel-drop-zone"
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
            <div className="flex flex-col items-center gap-3">
              <div className={`p-3 rounded-full ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                <Upload className={`h-6 w-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{t("inventory.dragDropArea", "Excel faylını bura sürüşdürün")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("inventory.dragDropOr", "və ya")}{" "}
                  <span className="text-primary underline">{t("inventory.browseFile", "Faylı seçin")}</span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">{t("inventory.dragDropFormats", "Dəstəklənən formatlar: .xlsx, .xls, .csv")}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="btn-cancel-product">
            {t("inventory.cancel", "Ləğv et")}
          </Button>
          {(editItem || mode === "manual") && (
            <Button onClick={handleSave} data-testid="btn-save-product">
              {t("inventory.save", "Saxla")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScopeItemList({
  items,
  scope,
  onEdit,
  onDelete,
}: {
  items: InventoryItem[];
  scope: InventoryScope;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const scopeItems = items.filter(it => it.scope === scope);
  const categories = Array.from(new Set(scopeItems.map(it => it.category))).sort();

  const filtered = scopeItems.filter(it => {
    const matchSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || it.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const critical = filtered.filter(it => it.currentStock <= it.criticalThreshold);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder={t("inventory.searchPlaceholder", "Məhsul axtar...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid={`input-search-${scope}`}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground" data-testid="btn-clear-search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter} data-testid={`select-category-${scope}`}>
          <SelectTrigger className="w-[170px] shrink-0" data-testid={`trigger-category-${scope}`}>
            <SelectValue placeholder={t("inventory.allCategories", "Bütün kateqoriyalar")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allCategories", "Bütün kateqoriyalar")}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {critical.length > 0 && !search && categoryFilter === "all" && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30" data-testid={`alert-critical-${scope}`}>
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">
            <span className="font-bold">{critical.length}</span> {t("inventory.lowStockDesc", "məhsulun stoku kritik həddən aşağıdır")}
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground" data-testid={`empty-${scope}`}>
          <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">{search ? t("inventory.noResults", "Axtarış nəticəsi tapılmadı") : t("inventory.noProducts", "Hələ məhsul əlavə edilməyib")}</p>
          {!search && <p className="text-xs mt-1">{t("inventory.noProductsDesc", "Yuxarıdakı düyməni basaraq ilk məhsulunuzu əlavə edin")}</p>}
        </div>
      ) : (
        <div className="grid gap-2" data-testid={`list-${scope}`}>
          <AnimatePresence mode="popLayout">
            {filtered.map(item => (
              <InventoryItemCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

type PanelMode = "all" | "hotel-only" | InventoryScope;

export function InventoryPanel({ mode = "all" }: { mode?: PanelMode }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>(loadItems);
  const [activeScope, setActiveScope] = useState<InventoryScope>(
    mode === "all" || mode === "hotel-only" ? "hotel" : mode
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const handleSave = (data: Omit<InventoryItem, "id">) => {
    if (editItem) {
      setItems(prev => prev.map(it => it.id === editItem.id ? { ...it, ...data } : it));
      toast({ title: t("inventory.edit", "Düzəlt"), description: `"${data.name}" yeniləndi.` });
    } else {
      const newItem: InventoryItem = { ...data, id: `inv_${Date.now()}` };
      setItems(prev => [...prev, newItem]);
      if (data.unitCost && data.unitCost > 0 && data.currentStock > 0) {
        logExpense({
          date: new Date().toISOString(),
          itemName: data.name,
          category: data.category,
          scope: data.scope,
          quantity: data.currentStock,
          unitCost: data.unitCost,
          totalCost: data.unitCost * data.currentStock,
        });
      }
      toast({ title: t("inventory.addProduct", "+ Yeni Məhsul"), description: `"${data.name}" əlavə edildi.` });
    }
    setEditItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const item = items.find(it => it.id === deleteId);
    setItems(prev => prev.filter(it => it.id !== deleteId));
    setDeleteId(null);
    toast({ title: t("inventory.delete", "Sil"), description: item ? `"${item.name}" silindi.` : "" });
  };

  const scopeCount = (s: InventoryScope) => items.filter(it => it.scope === s).length;
  const scopeCritical = (s: InventoryScope) => items.filter(it => it.scope === s && it.currentStock <= it.criticalThreshold).length;

  const scopes: { value: InventoryScope; label: string; icon: typeof Building2 }[] = [
    { value: "hotel", label: t("inventory.tabHotel", "Otel Anbarı"), icon: Building2 },
    { value: "hotel-restaurant", label: t("inventory.tabHotelRestaurant", "Daxili Restoran Anbarı"), icon: UtensilsCrossed },
    { value: "standalone-restaurant", label: t("inventory.tabStandaloneRestaurant", "Müstəqil Restoran Anbarı"), icon: Store },
  ];

  const visibleScopes = mode === "all"
    ? scopes
    : mode === "hotel-only"
      ? scopes.filter(s => s.value === "hotel" || s.value === "hotel-restaurant")
      : scopes.filter(s => s.value === mode);

  return (
    <div className="space-y-4" data-testid="inventory-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t("inventory.title", "Anbar")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("inventory.subtitle", "Stok idarəetmə sistemi")}</p>
        </div>
        <Button
          onClick={() => { setEditItem(null); setDialogOpen(true); }}
          size="sm"
          className="gap-1.5"
          data-testid="btn-add-product"
        >
          <Plus className="h-4 w-4" />
          {t("inventory.addProduct", "+ Yeni Məhsul")}
        </Button>
      </div>

      {mode === "all" ? (
        <Tabs value={activeScope} onValueChange={v => setActiveScope(v as InventoryScope)}>
          <TabsList className="w-full h-auto flex-wrap gap-0 p-0 bg-transparent border-b border-border rounded-none" data-testid="inventory-tabs">
            {scopes.map(s => {
              const crit = scopeCritical(s.value);
              return (
                <TabsTrigger
                  key={s.value}
                  value={s.value}
                  className="relative flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2.5 text-xs font-medium text-muted-foreground data-[state=active]:text-foreground"
                  data-testid={`tab-${s.value}`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.label.split(" ")[0]}</span>
                  {crit > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {crit}
                    </span>
                  )}
                  <span className="ml-0.5 text-[10px] text-muted-foreground/70">({scopeCount(s.value)})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {scopes.map(s => (
            <TabsContent key={s.value} value={s.value} className="mt-4">
              <ScopeItemList items={items} scope={s.value} onEdit={handleEdit} onDelete={handleDelete} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ScopeItemList items={items} scope={visibleScopes[0]?.value ?? "hotel"} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <AddProductDialog
        open={dialogOpen}
        onOpenChange={v => { setDialogOpen(v); if (!v) setEditItem(null); }}
        scope={activeScope}
        editItem={editItem}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("inventory.delete", "Sil")}</AlertDialogTitle>
            <AlertDialogDescription>{t("inventory.confirmDelete", "Bu məhsulu silmək istədiyinizdən əminsiniz?")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete">{t("inventory.cancel", "Ləğv et")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" data-testid="btn-confirm-delete">
              {t("inventory.delete", "Sil")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

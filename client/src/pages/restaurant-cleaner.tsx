import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { initOneSignal, requestNotificationPermission } from "@/lib/onesignal";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getDemoToken } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, CheckSquare, Clock, MapPin, Camera, CheckCircle2, Loader2, MessageSquare, Archive, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { az as azLocale, tr as trLocale, ru as ruLocale, ar as arLocale, fr as frLocale, de as deLocale, es as esLocale, nl as nlLocale } from "date-fns/locale";
import { faIR } from "date-fns/locale/fa-IR";

const dateFnsLocaleMap: Record<string, Locale> = {
  az: azLocale, tr: trLocale, ru: ruLocale, ar: arLocale,
  fr: frLocale, de: deLocale, es: esLocale, nl: nlLocale, fa: faIR,
};
import { StaffDmChat } from "@/components/staff-dm-chat";

type CleaningTask = {
  id: string;
  description: string;
  location: string | null;
  assignedToId: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  photoUrl: string | null;
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};
// statusLabel now uses t() inline

export default function RestaurantCleaner() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] ?? undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    initOneSignal().then(() => requestNotificationPermission());
  }, []);

  const [showPhotoDialog, setShowPhotoDialog] = useState<CleaningTask | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<CleaningTask[]>({
    queryKey: ["/api/restaurant/cleaning-tasks"],
    refetchInterval: 15000,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      apiRequest("PATCH", `/api/restaurant/cleaning-tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
      setShowPhotoDialog(null);
      setPhotoUrl("");
      toast({ title: t("rcl.taskUpdated") });
    },
    onError: () => toast({ title: t("errors.somethingWentWrong"), variant: "destructive" }),
  });

  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "RESTAURANT_CLEANING_TASK_CREATED" || msg.type === "RESTAURANT_CLEANING_TASK_UPDATED") {
          queryClient.invalidateQueries({ queryKey: ["/api/restaurant/cleaning-tasks"] });
          if (msg.type === "RESTAURANT_CLEANING_TASK_CREATED") {
            toast({
              title: "🧹 Yeni temizlik tapşırığı",
              description: msg.task?.description || "",
            });
          }
        }
      } catch {}
    };
    return () => ws.close();
  }, [queryClient, toast]);

  async function compressImage(file: File, maxPx = 1200, quality = 0.72): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setPhotoUrl(compressed);
    } catch {
      toast({ title: t("errors.somethingWentWrong"), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const pending = tasks.filter(t => t.status !== "done");
  const done = tasks.filter(t => t.status === "done");
  const [activeView, setActiveView] = useState("");

  const hubGroups = [
    {
      title: t("rcl.hubGroupTasks", "My Tasks"),
      icon: <Sparkles className="h-4 w-4 text-emerald-600" />,
      color: "bg-emerald-50 dark:bg-emerald-950/30",
      items: [
        {
          value: "tasks",
          label: t("rcl.tabTasks"),
          icon: <Sparkles className="h-5 w-5" />,
          iconBg: "bg-amber-100 dark:bg-amber-900",
          iconColor: "text-amber-700 dark:text-amber-300",
          desc: t("rcl.hubDescTasks", "Pending & in-progress tasks"),
          badge: pending.length,
          urgent: pending.length > 0,
        },
        {
          value: "archive",
          label: t("rcl.tabArchive"),
          icon: <Archive className="h-5 w-5" />,
          iconBg: "bg-slate-100 dark:bg-slate-800",
          iconColor: "text-slate-600 dark:text-slate-400",
          desc: t("rcl.hubDescArchive", "Completed tasks history"),
          badge: done.length,
          urgent: false,
        },
      ],
    },
    {
      title: t("rcl.hubGroupComms", "Communication"),
      icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-950/30",
      items: [
        {
          value: "messages",
          label: t("rcl.tabMessages"),
          icon: <MessageSquare className="h-5 w-5" />,
          iconBg: "bg-blue-100 dark:bg-blue-900",
          iconColor: "text-blue-700 dark:text-blue-300",
          desc: t("rcl.hubDescMessages", "Chat with team"),
          badge: 0,
          urgent: false,
        },
      ],
    },
  ];

  const currentLabel = hubGroups.flatMap(g => g.items).find(i => i.value === activeView)?.label ?? activeView;

  return (
    <>
      <Helmet><title>{t("rcl.pageTitle")} | O.S.S</title></Helmet>
      <div className="pb-8" data-testid="cleaner-dashboard">

        {activeView === "" ? (
          /* ── HUB VIEW ── */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t("rcl.pageTitle")}</h1>
                  <p className="text-sm text-muted-foreground">{user?.fullName} — {t("rcl.subtitle")}</p>
                </div>
              </div>
              {pending.length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 animate-pulse">
                  {t("rcl.pendingBadge", { count: pending.length })}
                </Badge>
              )}
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{tasks.filter(t => t.status === "pending").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("rcl.statPending")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === "in_progress").length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("rcl.statInProgress")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{done.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("rcl.statDone")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Hub Groups */}
            {hubGroups.map((group, gi) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.07 }}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden"
              >
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${group.color}`}>
                  {group.icon}
                  <span className="text-sm font-semibold">{group.title}</span>
                </div>
                <div className={`grid divide-x divide-y ${group.items.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {group.items.map(item => (
                    <button
                      key={item.value}
                      onClick={() => setActiveView(item.value)}
                      className="flex flex-col items-start gap-2 p-4 text-left hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
                      data-testid={`hub-btn-${item.value}`}
                    >
                      <div className={`p-2 rounded-lg ${item.iconBg} ${item.urgent ? "ring-2 ring-offset-1 ring-amber-400 dark:ring-amber-600" : ""}`}>
                        <span className={item.iconColor}>{item.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          {item.badge > 0 && (
                            <Badge variant={item.urgent ? "destructive" : "secondary"} className={`text-[10px] h-4 px-1.5 rounded-full ${item.urgent ? "animate-pulse" : ""}`}>
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* ── CONTENT VIEW ── */
          <div className="space-y-4">
            {/* Back button */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView("")}
                className="gap-1.5 -ml-1"
                data-testid="btn-back-to-hub"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back", "Back")}
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{currentLabel}</span>
            </div>

            {/* ── Tasks View ── */}
            {activeView === "tasks" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold mb-3">{t("rcl.activeTasks")}</h2>
                  {isLoading ? (
                    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
                  ) : pending.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
                      <p className="font-medium">{t("rcl.noActiveTasks")}</p>
                      <p className="text-sm">{t("rcl.newTasksWillAppear")}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pending.map(task => (
                        <Card key={task.id} className="border-2 border-amber-200 dark:border-amber-800" data-testid={`card-task-${task.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-medium">{task.description}</p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                  {task.location && (
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.location}</span>
                                  )}
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: dateFnsLocale })}</span>
                                </div>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${statusColor[task.status]}`}>
                                {task.status === "pending" ? t("rcl.statusPending") : task.status === "in_progress" ? t("rcl.statusInProgress") : t("rcl.statusDone")}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              {task.status === "pending" && (
                                <Button size="sm" variant="outline" className="flex-1"
                                  onClick={() => updateTask.mutate({ id: task.id, data: { status: "in_progress" } })}
                                  data-testid={`button-start-task-${task.id}`}>
                                  🔄 {t("rcl.startBtn")}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                onClick={() => { setShowPhotoDialog(task); setPhotoUrl(""); }}
                                data-testid={`button-complete-task-${task.id}`}
                              >
                                <Camera className="h-4 w-4 mr-1.5" />
                                {t("rcl.readyBtn")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                {done.length > 0 && (
                  <div>
                    <h2 className="font-semibold mb-3 text-muted-foreground">{t("rcl.completedTasks")}</h2>
                    <div className="space-y-2">
                      {done.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60" data-testid={`row-done-task-${task.id}`}>
                          <div className="flex-1">
                            <p className="text-sm font-medium line-through">{task.description}</p>
                            {task.location && <p className="text-xs text-muted-foreground">{task.location}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {task.photoUrl && <img src={task.photoUrl} alt="şəkil" className="h-8 w-8 rounded object-cover" />}
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">✓ {t("rcl.doneLabel")}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Archive View ── */}
            {activeView === "archive" && (
              <div className="space-y-4">
                <h2 className="font-semibold">{t("rcl.archiveTitle")}</h2>
                {done.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Archive className="h-12 w-12 mb-3 opacity-30" />
                    <p>{t("rcl.archiveEmpty")}</p>
                  </div>
                ) : (
                  (() => {
                    const grouped: Record<string, CleaningTask[]> = {};
                    for (const task of done) {
                      const dateKey = new Date(task.completedAt || task.createdAt).toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" });
                      if (!grouped[dateKey]) grouped[dateKey] = [];
                      grouped[dateKey].push(task);
                    }
                    return Object.entries(grouped).map(([date, dateTasks]) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{date}</span>
                          <div className="flex-1 h-px bg-border" />
                          <Badge variant="secondary" className="text-xs">{dateTasks.length} {t("rcl.archiveCount")}</Badge>
                        </div>
                        <div className="space-y-2">
                          {dateTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30" data-testid={`archive-task-${task.id}`}>
                              <div className="flex-1">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  {task.description}
                                </p>
                                {task.location && <p className="text-xs text-muted-foreground ml-5"><MapPin className="h-3 w-3 inline mr-0.5" />{task.location}</p>}
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                {task.photoUrl && <img src={task.photoUrl} alt="foto" className="h-8 w-8 rounded object-cover border" />}
                                <Badge className="bg-emerald-100 text-emerald-800 text-xs shrink-0">✓</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            )}

            {/* ── Messages View ── */}
            {activeView === "messages" && (
              <StaffDmChat
                peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "waiter", "kitchen_staff", "restaurant_cashier"]}
                panelLabel={t("rcl.teamMessages")}
                emptyLabel={t("rcl.noTeamMembers")}
              />
            )}
          </div>
        )}
      </div>

      {/* Complete with photo dialog */}
      <Dialog open={!!showPhotoDialog} onOpenChange={() => setShowPhotoDialog(null)}>
        <DialogContent data-testid="dialog-complete-task">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />{t("rcl.dialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{showPhotoDialog?.description}</p>
            <div className="space-y-2">
              <Label>{t("rcl.addPhoto")}</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload-photo">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  {uploading ? t("rcl.uploading") : t("rcl.choosePhoto")}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                {photoUrl && <span className="text-xs text-emerald-600">✓ {t("rcl.photoSelected")}</span>}
              </div>
              {photoUrl && (
                <img src={photoUrl} alt="Seçilmiş şəkil" className="h-40 w-full object-cover rounded-lg border" />
              )}
              {!photoUrl && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("rcl.orEnterUrl")}</Label>
                  <Input placeholder="https://..." value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} data-testid="input-photo-url" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhotoDialog(null)}>{t("rcl.cancel")}</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => showPhotoDialog && updateTask.mutate({ id: showPhotoDialog.id, data: { status: "done", photoUrl: photoUrl || null } })}
              disabled={updateTask.isPending}
              data-testid="button-confirm-complete"
            >
              {updateTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
              {t("rcl.confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

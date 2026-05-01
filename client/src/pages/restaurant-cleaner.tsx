import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Sparkles, CheckSquare, Clock, MapPin, Camera, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.url || "");
      } else {
        const reader = new FileReader();
        reader.onload = ev => setPhotoUrl(ev.target?.result as string || "");
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = ev => setPhotoUrl(ev.target?.result as string || "");
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  const pending = tasks.filter(t => t.status !== "done");
  const done = tasks.filter(t => t.status === "done");

  return (
    <>
      <Helmet><title>{t("rcl.pageTitle")} | O.S.S</title></Helmet>
      <div className="space-y-5" data-testid="cleaner-dashboard">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("rcl.pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{user?.fullName} — {t("rcl.subtitle")}</p>
          </div>
          <div className="ml-auto">
            {pending.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 animate-pulse">
                {t("rcl.pendingBadge", { count: pending.length })}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{tasks.filter(t=>t.status==="pending").length}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("rcl.statPending")}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{tasks.filter(t=>t.status==="in_progress").length}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("rcl.statInProgress")}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{done.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("rcl.statDone")}</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="tasks" data-testid="tab-cleaner-tasks">
              <Sparkles className="h-4 w-4 mr-1" />
              {t("rcl.tabTasks")}
              {pending.length > 0 && <Badge variant="destructive" className="ml-1.5 text-xs">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages" data-testid="tab-cleaner-messages">
              <MessageSquare className="h-4 w-4 mr-1" />
              {t("rcl.tabMessages")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            {/* Active Tasks */}
            <div>
              <h2 className="font-semibold mb-3">{t("rcl.activeTasks")}</h2>
              {isLoading ? (
                <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
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
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
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

            {/* Completed Tasks */}
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
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <StaffDmChat
              peerRoles={["restaurant_manager", "admin", "owner_admin", "property_manager", "waiter", "kitchen_staff", "restaurant_cashier"]}
              panelLabel={t("rcl.teamMessages")}
              emptyLabel={t("rcl.noTeamMembers")}
            />
          </TabsContent>
        </Tabs>
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

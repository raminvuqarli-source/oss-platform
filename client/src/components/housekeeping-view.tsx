import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Brush, CheckCheck, Ban, Loader2, UserCheck } from "lucide-react";
import type { HousekeepingTask, User } from "@shared/schema";

interface RoomUnit {
  id: string;
  unitNumber: string;
  status: string;
}

const HK_STATUS_COLORS: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  assigned:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  inspection:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  completed:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled:   "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const HK_PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  normal: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  high:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const nextStatus: Record<string, string> = {
  pending:     "assigned",
  assigned:    "in_progress",
  in_progress: "completed",
  inspection:  "completed",
};

export function HousekeepingView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [unitId, setUnitId] = useState("");
  const [taskType, setTaskType] = useState("cleaning");
  const [cleaningType, setCleaningType] = useState("checkout_cleaning");
  const [priority, setPriority] = useState("normal");
  const [assignedTo, setAssignedTo] = useState("unassigned");
  const [notes, setNotes] = useState("");

  const { data: tasks, isLoading: tasksLoading } = useQuery<HousekeepingTask[]>({
    queryKey: ["/api/housekeeping/tasks"],
    refetchInterval: 20000,
  });

  const { data: units } = useQuery<RoomUnit[]>({
    queryKey: ["/api/units/status"],
  });

  const { data: staffList } = useQuery<User[]>({
    queryKey: ["/api/users/staff"],
  });

  const cleaners = staffList?.filter((s) => s.role === "staff") || [];

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await apiRequest("POST", "/api/housekeeping/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housekeeping/tasks"] });
      toast({ title: t("housekeeping.taskCreated", "Task created") });
      setOpen(false);
      setUnitId("");
      setAssignedTo("unassigned");
      setNotes("");
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/housekeeping/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housekeeping/tasks"] });
      toast({ title: t("housekeeping.taskUpdated", "Task updated") });
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!unitId) {
      toast({ title: t("housekeeping.selectRoom", "Please select a room"), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      unitId,
      taskType,
      cleaningType: taskType === "cleaning" ? cleaningType : undefined,
      priority,
      assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
      notes: notes || undefined,
    });
  };

  const filtered = (tasks || []).filter((task) => filterStatus === "all" || task.status === filterStatus);

  return (
    <div className="space-y-4" data-testid="housekeeping-view">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">{t("nav.housekeeping", "Housekeeping")}</h2>
          <Badge variant="secondary" data-testid="hk-task-count">{filtered.length}</Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-sm" data-testid="hk-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all", "All")}</SelectItem>
              <SelectItem value="pending">{t("housekeeping.status.pending", "Pending")}</SelectItem>
              <SelectItem value="assigned">{t("housekeeping.status.assigned", "Assigned")}</SelectItem>
              <SelectItem value="in_progress">{t("housekeeping.status.in_progress", "In Progress")}</SelectItem>
              <SelectItem value="inspection">{t("housekeeping.status.inspection", "Inspection")}</SelectItem>
              <SelectItem value="completed">{t("housekeeping.status.completed", "Completed")}</SelectItem>
              <SelectItem value="cancelled">{t("housekeeping.status.cancelled", "Cancelled")}</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="hk-new-task-btn">
                <Plus className="h-4 w-4 mr-1" />
                {t("housekeeping.newTask", "New Task")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("housekeeping.createTask", "Create Cleaning Task")}</DialogTitle>
                <DialogDescription>{t("housekeeping.createTaskDesc", "Assign a housekeeping task to a cleaner.")}</DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("housekeeping.room", "Room")}</Label>
                  <Select value={unitId} onValueChange={setUnitId}>
                    <SelectTrigger data-testid="hk-select-room">
                      <SelectValue placeholder={t("housekeeping.selectRoom", "Select room")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(units || []).map((u) => (
                        <SelectItem key={u.id} value={u.id} data-testid={`hk-room-option-${u.id}`}>
                          {t("common.room", "Room")} {u.unitNumber} — {u.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("housekeeping.taskType", "Task Type")}</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger data-testid="hk-select-task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">{t("housekeeping.taskTypes.cleaning", "Cleaning")}</SelectItem>
                      <SelectItem value="inspection">{t("housekeeping.taskTypes.inspection", "Inspection")}</SelectItem>
                      <SelectItem value="maintenance">{t("housekeeping.taskTypes.maintenance", "Maintenance")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {taskType === "cleaning" && (
                  <div className="space-y-1.5">
                    <Label>{t("housekeeping.cleaningType", "Cleaning Type")}</Label>
                    <Select value={cleaningType} onValueChange={setCleaningType}>
                      <SelectTrigger data-testid="hk-select-cleaning-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkout_cleaning">{t("housekeeping.cleaningTypes.checkout", "Checkout Cleaning")}</SelectItem>
                        <SelectItem value="stayover_cleaning">{t("housekeeping.cleaningTypes.stayover", "Stayover Cleaning")}</SelectItem>
                        <SelectItem value="deep_cleaning">{t("housekeeping.cleaningTypes.deep", "Deep Cleaning")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>{t("housekeeping.priority", "Priority")}</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger data-testid="hk-select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("housekeeping.priorities.low", "Low")}</SelectItem>
                      <SelectItem value="normal">{t("housekeeping.priorities.normal", "Normal")}</SelectItem>
                      <SelectItem value="high">{t("housekeeping.priorities.high", "High")}</SelectItem>
                      <SelectItem value="urgent">{t("housekeeping.priorities.urgent", "Urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("housekeeping.assignTo", "Assign to Cleaner")}</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger data-testid="hk-select-assignee">
                      <SelectValue placeholder={t("housekeeping.unassigned", "Unassigned")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("housekeeping.unassigned", "Unassigned")}</SelectItem>
                      {cleaners.map((c) => (
                        <SelectItem key={c.id} value={c.id} data-testid={`hk-cleaner-option-${c.id}`}>
                          {c.fullName || c.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("housekeeping.notes", "Notes (optional)")}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("housekeeping.notesPlaceholder", "Any special instructions...")}
                    data-testid="hk-notes-input"
                    rows={2}
                  />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} data-testid="hk-cancel-btn">
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="hk-create-btn">
                  {createMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    : <Plus className="h-4 w-4 mr-1" />}
                  {t("housekeeping.create", "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {tasksLoading ? (
        <div className="space-y-3" data-testid="hk-loading">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card data-testid="hk-empty">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
            <Brush className="h-8 w-8 opacity-40" />
            <p>{t("housekeeping.noTasks", "No housekeeping tasks found")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const assignedStaff = cleaners.find((c) => c.id === task.assignedTo);
            const next = nextStatus[task.status];
            return (
              <Card key={task.id} data-testid={`hk-task-${task.id}`} className="overflow-visible">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" data-testid={`hk-room-${task.id}`}>
                          {t("common.room", "Room")} {task.roomNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${HK_STATUS_COLORS[task.status] || ""}`}
                          data-testid={`hk-status-${task.id}`}
                        >
                          {t(`housekeeping.status.${task.status}`, task.status)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${HK_PRIORITY_COLORS[task.priority || "normal"] || ""}`}
                          data-testid={`hk-priority-${task.id}`}
                        >
                          {t(`housekeeping.priorities.${task.priority}`, task.priority || "normal")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(`housekeeping.taskTypes.${task.taskType}`, task.taskType)}
                        {task.cleaningType && ` — ${t(`housekeeping.cleaningTypes.${task.cleaningType.replace("_cleaning", "")}`, task.cleaningType)}`}
                      </p>
                      {assignedStaff ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`hk-assigned-${task.id}`}>
                          <UserCheck className="h-3 w-3" />
                          {assignedStaff.fullName || assignedStaff.username}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">{t("housekeeping.unassigned", "Unassigned")}</p>
                      )}
                      {task.notes && <p className="text-xs text-muted-foreground">{task.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {next && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: task.id, status: next })}
                          disabled={updateMutation.isPending}
                          data-testid={`hk-advance-${task.id}`}
                        >
                          {next === "completed"
                            ? <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            : <Loader2 className="h-3.5 w-3.5 mr-1" />}
                          {t(`housekeeping.status.${next}`, next)}
                        </Button>
                      )}
                      {task.status !== "cancelled" && task.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateMutation.mutate({ id: task.id, status: "cancelled" })}
                          disabled={updateMutation.isPending}
                          data-testid={`hk-cancel-task-${task.id}`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

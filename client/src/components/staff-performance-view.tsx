import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Star,
  AlertTriangle,
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StaffPerformanceData {
  staffId: string;
  fullName: string;
  role: string;
  email: string | null;
  score: {
    totalScore: number;
    messageResponseScore: number;
    taskCompletionScore: number;
    serviceQualityScore: number;
    activityScore: number;
    manualAdjustment: number;
    period: string;
  } | null;
  feedbackCount: number;
  starCount: number;
  warningCount: number;
}

interface BroadcastMessage {
  id: string;
  messageText: string;
  createdAt: string;
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
}

function getStatusLabel(score: number, t: (key: string, fallback: string) => string) {
  if (score >= 85) return { label: t("staffPerformance.excellent", "Excellent"), color: "text-orange-500", bgClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" };
  if (score >= 70) return { label: t("staffPerformance.good", "Good"), color: "text-green-500", bgClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
  if (score >= 50) return { label: t("staffPerformance.needsImprovement", "Needs Improvement"), color: "text-yellow-500", bgClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" };
  return { label: t("staffPerformance.lowPerformance", "Low Performance"), color: "text-red-500", bgClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
}

function getStatusIcon(score: number) {
  if (score >= 85) return <TrendingUp className="h-4 w-4 text-orange-500" />;
  if (score >= 70) return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (score >= 50) return <Clock className="h-4 w-4 text-yellow-500" />;
  return <AlertTriangle className="h-4 w-4 text-red-500" />;
}

export function StaffPerformanceView() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [broadcastText, setBroadcastText] = useState("");
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; staffId: string; staffName: string; type: "star" | "warning" }>({
    open: false, staffId: "", staffName: "", type: "star"
  });
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackHistoryDialog, setFeedbackHistoryDialog] = useState<{ open: boolean; staffId: string; staffName: string }>({
    open: false, staffId: "", staffName: ""
  });

  const { data: performanceData, isLoading: perfLoading } = useQuery<StaffPerformanceData[]>({
    queryKey: ["/api/staff-performance/hotel"],
  });

  const { data: broadcastMessages, isLoading: msgLoading } = useQuery<BroadcastMessage[]>({
    queryKey: ["/api/staff-messages/hotel"],
  });

  const { data: feedbackHistory } = useQuery<any[]>({
    queryKey: ["/api/staff-feedback/history", feedbackHistoryDialog.staffId],
    enabled: feedbackHistoryDialog.open && !!feedbackHistoryDialog.staffId,
  });

  const broadcastMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", "/api/staff-messages/broadcast", { messageText });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: t("staffPerformance.messageSent", "Message Sent"), description: t("staffPerformance.messageSentTo", "Sent to {{count}} staff members", { count: data.recipientCount }) });
      setBroadcastText("");
      queryClient.invalidateQueries({ queryKey: ["/api/staff-messages/hotel"] });
    },
    onError: () => {
      toast({ title: t("common.error", "Error"), description: t("staffPerformance.sendFailed", "Failed to send message"), variant: "destructive" });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: { staffId: string; type: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/staff-feedback", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("staffPerformance.feedbackSent", "Feedback Sent") });
      setFeedbackDialog({ open: false, staffId: "", staffName: "", type: "star" });
      setFeedbackReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/staff-performance/hotel"] });
    },
    onError: () => {
      toast({ title: t("common.error", "Error"), description: t("staffPerformance.feedbackFailed", "Failed to send feedback"), variant: "destructive" });
    },
  });

  const exportCsv = () => {
    if (!performanceData) return;
    const headers = ["Name", "Role", "Score", "Status", "Stars", "Warnings", "Message Response", "Task Completion", "Service Quality", "Activity"];
    const rows = performanceData.map(s => {
      const score = s.score?.totalScore ?? 0;
      const status = getStatusLabel(score, t);
      return [
        s.fullName,
        s.role,
        Math.round(score),
        status.label,
        s.starCount,
        s.warningCount,
        Math.round(s.score?.messageResponseScore ?? 0),
        Math.round(s.score?.taskCompletionScore ?? 0),
        Math.round(s.score?.serviceQualityScore ?? 0),
        Math.round(s.score?.activityScore ?? 0),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedStaff = performanceData
    ? [...performanceData].sort((a, b) => (b.score?.totalScore ?? 0) - (a.score?.totalScore ?? 0))
    : [];

  const avgScore = sortedStaff.length > 0
    ? sortedStaff.reduce((sum, s) => sum + (s.score?.totalScore ?? 0), 0) / sortedStaff.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" data-testid="text-total-staff-label">{t("staffPerformance.totalStaff", "Total Staff")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-staff-count">{sortedStaff.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("staffPerformance.avgScore", "Avg Score")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-score">{Math.round(avgScore)}/100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("staffPerformance.excellentCount", "Excellent")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-excellent-count">
              {sortedStaff.filter(s => (s.score?.totalScore ?? 0) >= 85).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("staffPerformance.needsAttention", "Needs Attention")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-needs-attention-count">
              {sortedStaff.filter(s => (s.score?.totalScore ?? 0) < 70).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("staffPerformance.broadcastMessage", "Broadcast Message to All Staff")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={t("staffPerformance.typeMessage", "Type your message to all staff...")}
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            className="min-h-[80px]"
            data-testid="input-broadcast-message"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {t("staffPerformance.willSendTo", "Will send to {{count}} staff members", { count: sortedStaff.length })}
            </p>
            <Button
              onClick={() => broadcastMutation.mutate(broadcastText)}
              disabled={!broadcastText.trim() || broadcastMutation.isPending}
              data-testid="button-send-broadcast"
            >
              <Send className="h-4 w-4" />
              {broadcastMutation.isPending
                ? t("common.sending", "Sending...")
                : t("staffPerformance.sendToAll", "Send to All")}
            </Button>
          </div>

          {broadcastMessages && broadcastMessages.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{t("staffPerformance.sentMessages", "Sent Messages")}</h4>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {broadcastMessages.slice(0, 10).map((msg) => (
                    <div key={msg.id} className="flex items-start justify-between gap-3 p-3 rounded-md border" data-testid={`broadcast-msg-${msg.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{msg.messageText}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary">
                          <Eye className="h-3 w-3 mr-1" />
                          {msg.readCount}/{msg.totalRecipients}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("staffPerformance.title", "Staff Performance")}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!performanceData?.length} data-testid="button-export-csv">
            <Download className="h-4 w-4" />
            {t("staffPerformance.exportCsv", "Export CSV")}
          </Button>
        </CardHeader>
        <CardContent>
          {perfLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : sortedStaff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("staffPerformance.noStaff", "No staff members found")}</p>
          ) : (
            <div className="space-y-3">
              {sortedStaff.map((staff) => {
                const totalScore = staff.score?.totalScore ?? 0;
                const status = getStatusLabel(totalScore, t);
                return (
                  <div key={staff.staffId} className="flex items-center gap-4 p-4 rounded-md border" data-testid={`staff-card-${staff.staffId}`}>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{staff.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate" data-testid={`text-staff-name-${staff.staffId}`}>{staff.fullName}</span>
                        <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                        <Badge className={`text-xs ${status.bgClass} no-default-hover-elevate no-default-active-elevate`}>
                          {getStatusIcon(totalScore)}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" data-testid={`text-score-${staff.staffId}`}>{Math.round(totalScore)}</span>
                        <Progress value={totalScore} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                      {staff.score && (
                        <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                          <span>{t("staffPerformance.msgResponse", "Msg Response")}: {Math.round(staff.score.messageResponseScore)}%</span>
                          <span>{t("staffPerformance.taskCompletion", "Tasks")}: {Math.round(staff.score.taskCompletionScore)}%</span>
                          <span>{t("staffPerformance.serviceQuality", "Service")}: {Math.round(staff.score.serviceQualityScore)}%</span>
                          <span>{t("staffPerformance.activity", "Activity")}: {Math.round(staff.score.activityScore)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFeedbackDialog({ open: true, staffId: staff.staffId, staffName: staff.fullName, type: "star" })}
                        title={t("staffPerformance.giveStar", "Give Star")}
                        data-testid={`button-star-${staff.staffId}`}
                      >
                        <Star className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFeedbackDialog({ open: true, staffId: staff.staffId, staffName: staff.fullName, type: "warning" })}
                        title={t("staffPerformance.giveWarning", "Give Warning")}
                        data-testid={`button-warning-${staff.staffId}`}
                      >
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFeedbackHistoryDialog({ open: true, staffId: staff.staffId, staffName: staff.fullName })}
                        title={t("staffPerformance.viewHistory", "View History")}
                        data-testid={`button-history-${staff.staffId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={feedbackDialog.open} onOpenChange={(open) => {
        if (!open) {
          setFeedbackDialog({ open: false, staffId: "", staffName: "", type: "star" });
          setFeedbackReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedbackDialog.type === "star" ? (
                <><Star className="h-5 w-5 text-yellow-500" /> {t("staffPerformance.giveStar", "Give Star")}</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-red-500" /> {t("staffPerformance.giveWarning", "Give Warning")}</>
              )}
            </DialogTitle>
            <DialogDescription>
              {feedbackDialog.type === "star"
                ? t("staffPerformance.starDesc", "Give a star to {{name}} for good performance (+5 points)", { name: feedbackDialog.staffName })
                : t("staffPerformance.warningDesc", "Give a warning to {{name}} for issues (-7 points)", { name: feedbackDialog.staffName })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("staffPerformance.reasonPlaceholder", "Reason (optional)")}
            value={feedbackReason}
            onChange={(e) => setFeedbackReason(e.target.value)}
            data-testid="input-feedback-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialog({ open: false, staffId: "", staffName: "", type: "star" })}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant={feedbackDialog.type === "star" ? "default" : "destructive"}
              onClick={() => feedbackMutation.mutate({
                staffId: feedbackDialog.staffId,
                type: feedbackDialog.type,
                reason: feedbackReason,
              })}
              disabled={feedbackMutation.isPending}
              data-testid="button-submit-feedback"
            >
              {feedbackMutation.isPending ? t("common.sending", "Sending...") : t("common.confirm", "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackHistoryDialog.open} onOpenChange={(open) => {
        if (!open) setFeedbackHistoryDialog({ open: false, staffId: "", staffName: "" });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("staffPerformance.feedbackHistory", "Feedback History")} - {feedbackHistoryDialog.staffName}</DialogTitle>
            <DialogDescription>{t("staffPerformance.feedbackHistoryDesc", "All feedback given to this staff member")}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {feedbackHistory && feedbackHistory.length > 0 ? (
              <div className="space-y-2">
                {feedbackHistory.map((fb: any) => (
                  <div key={fb.id} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`feedback-item-${fb.id}`}>
                    {fb.type === "star" ? (
                      <Star className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {fb.type === "star" ? t("staffPerformance.star", "Star") : t("staffPerformance.warning", "Warning")}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {fb.scoreImpact > 0 ? `+${fb.scoreImpact}` : fb.scoreImpact}
                        </Badge>
                      </div>
                      {fb.reason && <p className="text-sm text-muted-foreground mt-1">{fb.reason}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(fb.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t("staffPerformance.noFeedback", "No feedback history")}</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  Activity,
  Mail,
  MailOpen,
} from "lucide-react";

function getStatusLabel(score: number, t: (key: string, fallback: string) => string) {
  if (score >= 85) return { label: t("staffPerformance.excellent", "Excellent"), bgClass: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" };
  if (score >= 70) return { label: t("staffPerformance.good", "Good"), bgClass: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" };
  if (score >= 50) return { label: t("staffPerformance.needsImprovement", "Needs Improvement"), bgClass: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" };
  return { label: t("staffPerformance.lowPerformance", "Low Performance"), bgClass: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" };
}

function getStatusIcon(score: number) {
  if (score >= 85) return <TrendingUp className="h-5 w-5 text-orange-500" />;
  if (score >= 70) return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (score >= 50) return <Clock className="h-5 w-5 text-yellow-500" />;
  return <AlertTriangle className="h-5 w-5 text-red-500" />;
}

export function StaffMyPerformance() {
  const { t } = useTranslation();

  const { data: myScore, isLoading: scoreLoading } = useQuery<{
    currentScore: {
      totalScore: number;
      messageResponseScore: number;
      taskCompletionScore: number;
      serviceQualityScore: number;
      activityScore: number;
      manualAdjustment: number;
      period: string;
    } | null;
    history: Array<{ totalScore: number; period: string }>;
    feedbacks: Array<{ type: string; reason: string | null; scoreImpact: number; createdAt: string }>;
  }>({
    queryKey: ["/api/staff-performance/my-score"],
  });

  const { data: inbox, isLoading: inboxLoading } = useQuery<Array<{
    id: string;
    messageText: string;
    createdAt: string;
    isRead: boolean;
    readAt: string | null;
  }>>({
    queryKey: ["/api/staff-messages/inbox"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("POST", `/api/staff-messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-messages/inbox"] });
    },
  });

  const totalScore = myScore?.currentScore?.totalScore ?? 0;
  const status = getStatusLabel(totalScore, t);
  const unreadCount = inbox?.filter(m => !m.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("staffPerformance.myRating", "My Rating")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scoreLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : myScore?.currentScore ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getStatusIcon(totalScore)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl font-bold" data-testid="text-my-score">{Math.round(totalScore)}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                    <Badge className={`${status.bgClass} no-default-hover-elevate no-default-active-elevate`}>{status.label}</Badge>
                  </div>
                  <Progress value={totalScore} className="h-3" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">{t("staffPerformance.msgResponse", "Msg Response")}</p>
                  <p className="text-lg font-bold" data-testid="text-msg-response">{Math.round(myScore.currentScore.messageResponseScore)}%</p>
                </div>
                <div className="text-center p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">{t("staffPerformance.taskCompletion", "Tasks")}</p>
                  <p className="text-lg font-bold" data-testid="text-task-completion">{Math.round(myScore.currentScore.taskCompletionScore)}%</p>
                </div>
                <div className="text-center p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">{t("staffPerformance.serviceQuality", "Service")}</p>
                  <p className="text-lg font-bold" data-testid="text-service-quality">{Math.round(myScore.currentScore.serviceQualityScore)}%</p>
                </div>
                <div className="text-center p-3 rounded-md border">
                  <p className="text-xs text-muted-foreground">{t("staffPerformance.activity", "Activity")}</p>
                  <p className="text-lg font-bold" data-testid="text-activity">{Math.round(myScore.currentScore.activityScore)}%</p>
                </div>
              </div>

              {myScore.feedbacks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t("staffPerformance.feedbackHistory", "Feedback History")}</h4>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-2">
                      {myScore.feedbacks.map((fb, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-md border" data-testid={`my-feedback-${i}`}>
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
                            <p className="text-xs text-muted-foreground mt-1">{new Date(fb.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t("staffPerformance.myRatingDesc", "Your current performance score")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {t("staffPerformance.inbox", "Inbox")}
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inboxLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !inbox || inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("staffPerformance.noMessages", "No messages yet")}</p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {inbox.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 p-3 rounded-md border ${!msg.isRead ? "bg-muted/50" : ""}`}
                    data-testid={`inbox-msg-${msg.id}`}
                  >
                    {msg.isRead ? (
                      <MailOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <Mail className="h-4 w-4 text-primary shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!msg.isRead ? "font-medium" : ""}`}>{msg.messageText}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                    {!msg.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(msg.id)}
                        disabled={markReadMutation.isPending}
                        data-testid={`button-mark-read-${msg.id}`}
                      >
                        {t("staffPerformance.markRead", "Mark as Read")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

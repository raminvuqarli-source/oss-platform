import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OssAdminStats, RoomPrepAnalyticsData } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogBody } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showErrorToast } from "@/lib/error-handler";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/stat-card";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Users,
  TrendingUp,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Eye,
  Send,
  MessageSquare,
  RefreshCw,
  Loader2,
  LogOut,
  BarChart3,
  Globe,
  CheckCircle,
  XCircle,
  UserPlus,
  PartyPopper,
  DollarSign,
  CreditCard,
  Banknote,
  ClipboardCheck,
  Trash2,
  Pencil,
  Plus,
  Snowflake,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { QuoteRequest, QuoteNote, User, QuoteRequestStatus, Contract, BoardReport } from "@shared/schema";
import type { PlatformStats, CustomerSummary, CustomerDetail, SubscriptionRow } from "@/types/dashboard";

const STATUS_OPTIONS: { value: QuoteRequestStatus; labelKey: string; color: string }[] = [
  { value: "NEW", labelKey: "ossAdmin.status.new", color: "bg-blue-600" },
  { value: "CONTACTED", labelKey: "ossAdmin.status.contacted", color: "bg-yellow-500" },
  { value: "DEMO_SCHEDULED", labelKey: "ossAdmin.status.demoScheduled", color: "bg-purple-500" },
  { value: "NEGOTIATION", labelKey: "ossAdmin.status.negotiation", color: "bg-orange-500" },
  { value: "CLOSED_WON", labelKey: "ossAdmin.status.closedWon", color: "bg-green-600" },
  { value: "CLOSED_LOST", labelKey: "ossAdmin.status.closedLost", color: "bg-red-500" },
];

export default function OssAdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<OssAdminStats>({
    queryKey: ["/api/oss-admin/stats"],
  });

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery<QuoteRequest[]>({
    queryKey: ["/api/quote-requests"],
  });

  const { data: notes, refetch: refetchNotes } = useQuery<QuoteNote[]>({
    queryKey: ["/api/quote-requests", selectedRequest?.id, "notes"],
    enabled: !!selectedRequest?.id,
  });

  const { data: ossUsers } = useQuery<User[]>({
    queryKey: ["/api/oss-admin/users"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: QuoteRequestStatus; assignedToUserId?: string }) => {
      const response = await apiRequest("PATCH", `/api/quote-requests/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/stats"] });
      toast({ title: t("common.success"), description: t("ossAdmin.quoteUpdated", "Quote request updated") });
    },
    onError: (error) => showErrorToast(toast, error),
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ id, noteText }: { id: string; noteText: string }) => {
      const response = await apiRequest("POST", `/api/quote-requests/${id}/notes`, { noteText });
      return response.json();
    },
    onSuccess: () => {
      refetchNotes();
      setNoteText("");
      toast({ title: t("common.success"), description: t("ossAdmin.noteAdded", "Note added") });
    },
    onError: (error) => showErrorToast(toast, error),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchRequests()]);
    setIsRefreshing(false);
  };

  const handleViewDetails = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleStatusChange = (newStatus: QuoteRequestStatus) => {
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, status: newStatus });
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }
  };

  const handleAssign = (userId: string) => {
    if (selectedRequest) {
      updateMutation.mutate({ id: selectedRequest.id, assignedToUserId: userId || undefined });
      setSelectedRequest({ ...selectedRequest, assignedToUserId: userId || null });
    }
  };

  const handleAddNote = () => {
    if (selectedRequest && noteText.trim()) {
      addNoteMutation.mutate({ id: selectedRequest.id, noteText: noteText.trim() });
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    if (!option) return <Badge variant="outline">{status}</Badge>;
    return <Badge className={option.color}>{t(option.labelKey)}</Badge>;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return t("quote.na");
    return new Date(date).toLocaleString();
  };

  const filteredRequests = requests?.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        r.hotelName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.phone.includes(query) ||
        r.contactName.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const getAssignedUserName = (userId: string | null) => {
    if (!userId) return t("ossAdmin.unassigned", "Unassigned");
    const assignedUser = ossUsers?.find(u => u.id === userId);
    return assignedUser?.fullName || t("ossAdmin.unknown", "Unknown");
  };

  if (user?.role !== "oss_super_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">{t("common.accessDenied", "Access Denied")}</h2>
            <p className="text-muted-foreground">{t("ossAdmin.noAccess", "You do not have permission to access this panel.")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OSS</span>
            </div>
            <span className="font-semibold">{t("ossAdmin.title", "O.S.S Super Admin")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} data-testid="button-refresh">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              {t("common.signOut")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-dashboard">
              <BarChart3 className="h-4 w-4" />
              {t("ossAdmin.dashboard", "Dashboard")}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2" data-testid="tab-quotes">
              <FileText className="h-4 w-4" />
              {t("ossAdmin.quotes", "Quote Requests")}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              {t("ossAdmin.users", "Team Users")}
            </TabsTrigger>
            <TabsTrigger value="room-prep" className="gap-2" data-testid="tab-room-prep-analytics">
              <PartyPopper className="h-4 w-4" />
              {t('roomPrep.analytics', 'Preparation Analytics')}
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2" data-testid="tab-customers">
              <Building2 className="h-4 w-4" />
              {t("ossAdmin.customers", "Customers")}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2" data-testid="tab-subscriptions">
              <CreditCard className="h-4 w-4" />
              {t("ossAdmin.subscriptions", "Subscriptions")}
            </TabsTrigger>
            <TabsTrigger value="founder" className="gap-2" data-testid="tab-founder">
              <Banknote className="h-4 w-4" />
              {t("ossAdmin.founder", "Founder Panel")}
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2" data-testid="tab-board">
              <ClipboardCheck className="h-4 w-4" />
              {t("ossAdmin.board", "Board Panel")}
            </TabsTrigger>
            <TabsTrigger value="marketing" className="gap-2" data-testid="tab-marketing">
              <TrendingUp className="h-4 w-4" />
              {t("ossAdmin.marketing", "Marketing")}
            </TabsTrigger>
            <TabsTrigger value="billing-reports" className="gap-2" data-testid="tab-billing-reports">
              <CreditCard className="h-4 w-4" />
              {t("ossAdmin.billingReports", "Billing Reports")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <PlatformStatsSection />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title={t("ossAdmin.totalRequests", "Total Requests")}
                value={stats?.total || 0}
                icon={FileText}
              />
              <StatCard
                title={t("ossAdmin.newLast7Days", "New (7 Days)")}
                value={stats?.newLast7Days || 0}
                icon={TrendingUp}
              />
              <StatCard
                title={t("ossAdmin.closedWon", "Closed Won")}
                value={stats?.byStatus?.CLOSED_WON || 0}
                icon={CheckCircle}
              />
              <StatCard
                title={t("ossAdmin.inNegotiation", "In Negotiation")}
                value={stats?.byStatus?.NEGOTIATION || 0}
                icon={MessageSquare}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("ossAdmin.byStatus", "By Status")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map(opt => (
                        <div key={opt.value} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <span className="flex items-center gap-2">
                            <Badge className={opt.color}>{t(opt.labelKey)}</Badge>
                          </span>
                          <span className="font-semibold">{stats?.byStatus?.[opt.value] || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("ossAdmin.byCountry", "By Country")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {Object.entries(stats?.byCountry || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([country, count]) => (
                          <div key={country} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <span className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {country}
                            </span>
                            <span className="font-semibold">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quotes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div>
                    <CardTitle>{t("ossAdmin.allQuotes", "All Quote Requests")}</CardTitle>
                    <CardDescription>{t("ossAdmin.manageQuotes", "Manage and track quote requests")}</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t("common.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64"
                      data-testid="input-search"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                        <SelectValue placeholder={t("common.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {requestsLoading ? (
                    <div className="p-4 space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t("ossAdmin.noQuotes", "No quote requests found")}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 hover-elevate cursor-pointer"
                          onClick={() => handleViewDetails(request)}
                          data-testid={`quote-row-${request.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{request.hotelName}</span>
                                {getStatusBadge(request.status)}
                                {request.assignedToUserId && (
                                  <Badge variant="outline">{getAssignedUserName(request.assignedToUserId)}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {request.contactName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {request.city}, {request.country}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {request.totalRooms || "?"} {t("quote.rooms")}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {request.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {request.phone}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(request.createdAt)}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" data-testid={`button-view-${request.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <OssUsersPanel />
          </TabsContent>

          <TabsContent value="room-prep" className="space-y-4">
            <OssRoomPrepAnalytics />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <OssCustomersPanel />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <OssSubscriptionsPanel />
          </TabsContent>

          <TabsContent value="founder" className="space-y-4">
            <FounderPanel />
          </TabsContent>

          <TabsContent value="board" className="space-y-4">
            <BoardPanel />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-4">
            <OssMarketingPanel />
          </TabsContent>

          <TabsContent value="billing-reports" className="space-y-4">
            <OssBillingReportsPanel />
          </TabsContent>

        </Tabs>
      </main>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedRequest?.hotelName}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.city}, {selectedRequest?.country}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <DialogBody>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Label>{t("common.status")}:</Label>
                    <Select value={selectedRequest.status} onValueChange={(v) => handleStatusChange(v as QuoteRequestStatus)}>
                      <SelectTrigger className="w-40" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>{t("ossAdmin.assignedTo", "Assigned To")}:</Label>
                    <Select value={selectedRequest.assignedToUserId || "__unassigned__"} onValueChange={(v) => handleAssign(v === "__unassigned__" ? "" : v)}>
                      <SelectTrigger className="w-40" data-testid="select-assign">
                        <SelectValue placeholder={t("ossAdmin.unassigned", "Unassigned")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">{t("ossAdmin.unassigned", "Unassigned")}</SelectItem>
                        {ossUsers?.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("quote.contactInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.contactName")}</span>
                        <span className="font-medium">{selectedRequest.contactName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("auth.email")}</span>
                        <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">{selectedRequest.email}</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("dashboard.reception.phone")}</span>
                        <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">{selectedRequest.phone}</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.preferredContactMethod")}</span>
                        <span>{selectedRequest.preferredContactMethod || t("quote.na")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.preferredContactHours")}</span>
                        <span>{selectedRequest.preferredContactHours || t("quote.na")}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("quote.hotelInfo")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.totalRooms")}</span>
                        <span className="font-medium">{selectedRequest.totalRooms || t("quote.na")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.expectedSmartRooms")}</span>
                        <span className="font-medium">{selectedRequest.expectedSmartRooms || t("quote.na")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.source")}</span>
                        <span>{selectedRequest.sourcePage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.language")}</span>
                        <span>{selectedRequest.language?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("quote.submitted")}</span>
                        <span>{formatDate(selectedRequest.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedRequest.interestedFeatures && selectedRequest.interestedFeatures.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("quote.interestedFeatures")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.interestedFeatures.map((f) => (
                          <Badge key={f} variant="outline">{t(`quote.feature.${f}`, f)}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedRequest.message && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("quote.message")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm whitespace-pre-wrap">{selectedRequest.message}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("ossAdmin.notes", "Activity Notes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder={t("ossAdmin.addNotePlaceholder", "Add a note...")}
                        className="min-h-[60px]"
                        data-testid="textarea-note"
                      />
                      <Button
                        size="icon"
                        onClick={handleAddNote}
                        disabled={addNoteMutation.isPending || !noteText.trim()}
                        data-testid="button-add-note"
                      >
                        {addNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {notes?.map((note) => (
                          <div key={note.id} className="p-2 rounded-md bg-muted text-sm">
                            <p>{note.noteText}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(note.createdAt)}</p>
                          </div>
                        ))}
                        {(!notes || notes.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">{t("ossAdmin.noNotes", "No notes yet")}</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </DialogBody>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OssUsersPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", fullName: "", email: "" });
  const [editCodeUserId, setEditCodeUserId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/oss-admin/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/oss-admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/users"] });
      setCreateOpen(false);
      setFormData({ username: "", password: "", fullName: "", email: "" });
      toast({ title: t("common.success"), description: t("ossAdmin.userCreated", "User created successfully") });
    },
    onError: (error) => showErrorToast(toast, error),
  });

  const setReferralCodeMutation = useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      const response = await apiRequest("PATCH", `/api/oss-admin/users/${userId}/referral-code`, { referralCode: code });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/users"] });
      setEditCodeUserId(null);
      setCodeInput("");
      toast({ title: t("common.success"), description: t("ossAdmin.referralCodeSet", "Referral code updated") });
    },
    onError: (error) => showErrorToast(toast, error),
  });

  const handleCreate = () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      toast({ title: t("common.error"), description: t("ossAdmin.fillRequired", "Please fill all required fields"), variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSetCode = (userId: string) => {
    if (!codeInput.trim()) return;
    setReferralCodeMutation.mutate({ userId, code: codeInput.trim().toUpperCase() });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("ossAdmin.teamUsers", "OSS Team Users")}</CardTitle>
            <CardDescription>{t("ossAdmin.manageTeam", "Manage super admin team members and their referral codes")}</CardDescription>
          </div>
          <Button onClick={() => setCreateOpen(true)} data-testid="button-create-user">
            <UserPlus className="h-4 w-4 mr-2" />
            {t("ossAdmin.addUser", "Add User")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : users && users.length > 0 ? (
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="py-3 space-y-2" data-testid={`user-row-${user.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.username}{user.email ? ` • ${user.email}` : ""}</p>
                  </div>
                  <Badge variant="secondary">{t("ossAdmin.roleLabel", "OSS Admin")}</Badge>
                </div>
                {/* Referral code row */}
                {editCodeUserId === user.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 text-xs uppercase font-mono w-40"
                      placeholder="e.g. RENATA"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      maxLength={20}
                      data-testid={`input-referral-code-${user.id}`}
                    />
                    <Button size="sm" className="h-8 text-xs" onClick={() => handleSetCode(user.id)} disabled={setReferralCodeMutation.isPending} data-testid={`button-save-code-${user.id}`}>
                      {setReferralCodeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.save")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditCodeUserId(null); setCodeInput(""); }}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {(user as any).referralCode ? (
                      <Badge variant="outline" className="font-mono text-xs gap-1">
                        🔗 {(user as any).referralCode}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">{t("ossAdmin.noReferralCode", "No referral code")}</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                      onClick={() => { setEditCodeUserId(user.id); setCodeInput((user as any).referralCode || ""); }}
                      data-testid={`button-edit-code-${user.id}`}
                    >
                      ✏️ {(user as any).referralCode ? t("ossAdmin.editCode", "Edit") : t("ossAdmin.setCode", "Set code")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("ossAdmin.noUsers", "No team users found")}</p>
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ossAdmin.createUser", "Create Team User")}</DialogTitle>
            <DialogDescription>{t("ossAdmin.createUserDesc", "Add a new OSS super admin user")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <Label>{t("auth.fullName")} *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  data-testid="input-fullname"
                />
              </div>
              <div>
                <Label>{t("auth.username")} *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label>{t("auth.email")}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label>{t("auth.password")} *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="input-password"
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function OssRoomPrepAnalytics() {
  const { t } = useTranslation();

  const { data: analytics, isLoading } = useQuery<RoomPrepAnalyticsData>({
    queryKey: ["/api/room-prep-orders/analytics"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <PartyPopper className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">{t('common.noData', 'No data available')}</p>
        </CardContent>
      </Card>
    );
  }

  const occasionEntries = Object.entries(analytics.byOccasion).sort((a, b) => (b[1] as number) - (a[1] as number));
  const addOnEntries = Object.entries(analytics.byAddOn).sort((a, b) => (b[1] as number) - (a[1] as number));
  const statusEntries = Object.entries(analytics.byStatus);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('roomPrep.totalOrders')}
          value={analytics.totalOrders.toString()}
          icon={PartyPopper}
        />
        <StatCard
          title={t('roomPrep.completedOrders')}
          value={analytics.completedOrders.toString()}
          icon={CheckCircle}
        />
        <StatCard
          title={t('roomPrep.totalRevenue')}
          value={`$${(analytics.totalRevenue / 100).toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('roomPrep.popularOccasions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {occasionEntries.length > 0 ? (
              <div className="space-y-3">
                {occasionEntries.map(([occasion, count]) => {
                  const maxCount = occasionEntries[0][1] as number;
                  return (
                    <div key={occasion} data-testid={`occasion-stat-${occasion}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm">{t(`roomPrep.occasion.${occasion}`, occasion)}</span>
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-md"
                          style={{ width: `${((count as number) / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('roomPrep.popularAddOns')}</CardTitle>
          </CardHeader>
          <CardContent>
            {addOnEntries.length > 0 ? (
              <div className="space-y-3">
                {addOnEntries.map(([addon, count]) => {
                  const maxCount = addOnEntries[0][1] as number;
                  return (
                    <div key={addon} data-testid={`addon-stat-${addon}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm">{t(`roomPrep.addon.${addon}`, addon)}</span>
                        <span className="text-sm font-medium">{count as number}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-md"
                          style={{ width: `${((count as number) / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {statusEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('common.status', 'Status')} {t('roomPrep.analytics', 'Overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center gap-2" data-testid={`status-stat-${status}`}>
                  <Badge variant="outline" className="text-xs">
                    {t(`roomPrep.status.${status}`, status)}
                  </Badge>
                  <span className="text-sm font-medium">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PlatformStatsSection() {
  const { t } = useTranslation();

  const { data: platformStats, isLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/oss-admin/platform-stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!platformStats) return null;

  const PLAN_COLORS: Record<string, string> = {
    basic: "bg-secondary text-secondary-foreground",
    pro: "bg-blue-600 text-white",
    apartment_lite: "bg-green-600 text-white",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t("ossAdmin.totalCustomers", "Total Customers")}
          value={platformStats.totalOwners}
          icon={Building2}
          data-testid="stat-total-customers"
        />
        <StatCard
          title={t("ossAdmin.totalProperties", "Total Properties")}
          value={platformStats.totalProperties}
          icon={Building2}
          data-testid="stat-total-properties"
        />
        <StatCard
          title={t("ossAdmin.totalRooms", "Total Rooms")}
          value={platformStats.totalRooms}
          icon={Building2}
          data-testid="stat-total-rooms"
        />
        <StatCard
          title={t("ossAdmin.totalStaff", "Total Staff")}
          value={platformStats.totalStaff}
          icon={Users}
          data-testid="stat-total-staff"
        />
        <StatCard
          title={t("ossAdmin.activeSubscriptions", "Active Subscriptions")}
          value={platformStats.activeSubscriptions}
          icon={CreditCard}
          data-testid="stat-active-subscriptions"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("ossAdmin.subscriptionBreakdown", "Subscription Plan Breakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(platformStats.subscriptionsByPlan).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2" data-testid={`plan-breakdown-${plan}`}>
                <Badge className={PLAN_COLORS[plan] || "bg-secondary text-secondary-foreground"}>
                  {plan.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-sm font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OssCustomersPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "freeze" | "delete" | "activate"; ownerId: string; companyName: string } | null>(null);

  const { data: customers, isLoading } = useQuery<CustomerSummary[]>({
    queryKey: ["/api/oss-admin/customers"],
  });

  const { data: customerDetail, isLoading: detailLoading } = useQuery<CustomerDetail>({
    queryKey: ["/api/oss-admin/customers", selectedOwnerId],
    enabled: !!selectedOwnerId,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ ownerId, status }: { ownerId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/oss-admin/customers/${ownerId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/customers"] });
      const actionLabel = confirmAction?.type === "freeze" ? t("ossAdmin.customerFrozen", "Customer frozen") : t("ossAdmin.customerActivated", "Customer activated");
      toast({ title: actionLabel });
      setConfirmAction(null);
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      const res = await apiRequest("DELETE", `/api/oss-admin/customers/${ownerId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/customers"] });
      toast({ title: t("ossAdmin.customerDeleted", "Customer permanently deleted") });
      setConfirmAction(null);
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const PLAN_COLORS: Record<string, string> = {
    basic: "bg-secondary text-secondary-foreground",
    pro: "bg-blue-600 text-white",
    apartment_lite: "bg-green-600 text-white",
  };

  const STATUS_BADGE: Record<string, { className: string; label: string }> = {
    active: { className: "bg-green-600 text-white", label: t("ossAdmin.active", "Active") },
    suspended: { className: "bg-yellow-600 text-white", label: t("ossAdmin.frozen", "Frozen") },
    deleted: { className: "bg-red-600 text-white", label: t("ossAdmin.deleted", "Deleted") },
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const handleViewCustomer = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    setDetailOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "delete") {
      deleteMutation.mutate(confirmAction.ownerId);
    } else {
      const statusMap = { freeze: "suspended", activate: "active" } as const;
      statusMutation.mutate({ ownerId: confirmAction.ownerId, status: statusMap[confirmAction.type] });
    }
  };

  const filteredCustomers = customers?.filter((c) => {
    if (planFilter !== "all" && c.plan !== planFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <CardTitle>{t("ossAdmin.allCustomers", "All Customers")}</CardTitle>
            <CardDescription>{t("ossAdmin.manageCustomers", "View and manage platform customers")}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
              data-testid="input-customer-search"
            />
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-customer-plan-filter">
                <SelectValue placeholder={t("ossAdmin.plan", "Plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="apartment_lite">Apartment Lite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("ossAdmin.noCustomers", "No customers found")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.ownerId}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => handleViewCustomer(customer.ownerId)}
                  data-testid={`customer-row-${customer.ownerId}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{customer.companyName}</span>
                        <Badge className={PLAN_COLORS[customer.plan] || "bg-secondary text-secondary-foreground"}>
                          {customer.plan?.replace("_", " ").toUpperCase() || "N/A"}
                        </Badge>
                        <Badge className={STATUS_BADGE[customer.status]?.className || STATUS_BADGE.active.className}>
                          {STATUS_BADGE[customer.status]?.label || STATUS_BADGE.active.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {customer.propertyCount} {t("ossAdmin.properties", "properties")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {customer.totalRooms} {t("ossAdmin.rooms", "rooms")}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("ossAdmin.joined", "Joined")}: {formatDate(customer.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {customer.status === "active" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: "freeze", ownerId: customer.ownerId, companyName: customer.companyName }); }} data-testid={`button-freeze-${customer.ownerId}`}>
                            <Snowflake className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: "delete", ownerId: customer.ownerId, companyName: customer.companyName }); }} data-testid={`button-delete-customer-${customer.ownerId}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(customer.status === "suspended" || customer.status === "deleted") && (
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: "activate", ownerId: customer.ownerId, companyName: customer.companyName }); }} data-testid={`button-activate-${customer.ownerId}`}>
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer.ownerId); }} data-testid={`button-view-customer-${customer.ownerId}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {confirmAction?.type === "freeze"
                ? t("ossAdmin.confirmFreeze", "Freeze Customer")
                : confirmAction?.type === "delete"
                ? t("ossAdmin.confirmDelete", "Delete Customer")
                : t("ossAdmin.confirmActivate", "Activate Customer")}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "freeze"
                ? t("ossAdmin.confirmFreezeDesc", "Are you sure you want to freeze this customer? They will not be able to login and all their properties will become inactive.")
                : confirmAction?.type === "delete"
                ? t("ossAdmin.confirmDeleteDesc", "Are you sure you want to permanently delete this customer? All their data, properties, bookings, and users will be removed. This action cannot be undone.")
                : t("ossAdmin.confirmActivateDesc", "Are you sure you want to reactivate this customer? They will be able to login again and their properties will become active.")}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-md bg-muted">
            <p className="font-medium">{confirmAction?.companyName}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)} data-testid="button-cancel-action">
              {t("common.cancel")}
            </Button>
            <Button
              variant={confirmAction?.type === "activate" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={statusMutation.isPending || deleteMutation.isPending}
              data-testid="button-confirm-action"
            >
              {(statusMutation.isPending || deleteMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {confirmAction?.type === "freeze"
                ? t("ossAdmin.yesFreeze", "Yes, Freeze")
                : confirmAction?.type === "delete"
                ? t("ossAdmin.yesDelete", "Yes, Delete")
                : t("ossAdmin.yesActivate", "Yes, Activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t("ossAdmin.customerDetails", "Customer Details")}
            </DialogTitle>
          </DialogHeader>

          <DialogBody>
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : customerDetail ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">{t("ossAdmin.ownerInfo", "Owner Info")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("auth.fullName")}</span>
                      <span className="font-medium">{customerDetail.user.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("auth.email")}</span>
                      <span>{customerDetail.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("auth.username")}</span>
                      <span>{customerDetail.user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ossAdmin.staffCount", "Staff Count")}</span>
                      <span className="font-medium">{customerDetail.staffCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("ossAdmin.joined", "Joined")}</span>
                      <span>{customerDetail.user.createdAt ? new Date(customerDetail.user.createdAt).toLocaleDateString() : "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral Info Card */}
                {customerDetail.owner?.referralSource && (
                  <Card className="border-purple-500/30 bg-purple-500/5" data-testid="referral-info-card">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span>📣</span>
                        {t("ossAdmin.referralInfo", "Referral Info")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("hotel.referralSource", "How did they hear about us?")}</span>
                        <Badge variant="secondary" className="capitalize">
                          {customerDetail.owner.referralSource.replace("_", " ")}
                        </Badge>
                      </div>
                      {customerDetail.owner.referralSource === "staff_referral" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("ossAdmin.referralStaff", "Referred by staff")}</span>
                          <span className="font-medium">
                            {customerDetail.referralStaffName || customerDetail.owner.referralStaffId || "-"}
                          </span>
                        </div>
                      )}
                      {customerDetail.owner.referralNotes && (
                        <div className="pt-1 border-t">
                          <p className="text-muted-foreground mb-1">{t("ossAdmin.referralNotes", "Notes")}</p>
                          <p className="text-xs bg-muted rounded p-2">{customerDetail.owner.referralNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {customerDetail.properties.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("ossAdmin.properties", "Properties")} ({customerDetail.properties.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2">
                          {customerDetail.properties.map((prop) => (
                            <div key={prop.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50" data-testid={`property-row-${prop.id}`}>
                              <div>
                                <span className="font-medium text-sm">{prop.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{prop.city}, {prop.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                                <span className="text-xs text-muted-foreground">{prop.totalUnits} {t("ossAdmin.units", "units")}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {customerDetail.subscription && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("ossAdmin.subscription", "Subscription")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("ossAdmin.plan", "Plan")}</span>
                        <Badge className={PLAN_COLORS[customerDetail.subscription.planType] || "bg-secondary text-secondary-foreground"}>
                          {customerDetail.subscription.planType?.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("common.status")}</span>
                        {customerDetail.subscription.isActive ? (
                          <Badge className="bg-green-600 text-white">{t("ossAdmin.active", "Active")}</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white">{t("ossAdmin.inactive", "Inactive")}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {customerDetail.recentActivity && customerDetail.recentActivity.length > 0 && (
                  <Card>
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">{t("ossAdmin.recentActivity", "Recent Activity")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <ScrollArea className="h-[120px]">
                        <div className="space-y-2">
                          {customerDetail.recentActivity.map((activity: any, index: number) => (
                            <div key={index} className="p-2 rounded-md bg-muted/50 text-sm">
                              <p>{activity.description || activity.type}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("ossAdmin.noCustomerData", "No customer data available")}</p>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)} data-testid="button-close-customer-detail">
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function OssSubscriptionsPanel() {
  const { t } = useTranslation();
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: subscriptions, isLoading } = useQuery<SubscriptionRow[]>({
    queryKey: ["/api/oss-admin/subscriptions"],
  });

  const PLAN_COLORS: Record<string, string> = {
    basic: "bg-secondary text-secondary-foreground",
    pro: "bg-blue-600 text-white",
    apartment_lite: "bg-green-600 text-white",
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const filteredSubscriptions = subscriptions?.filter((s) => {
    if (planFilter !== "all" && s.planType !== planFilter) return false;
    if (statusFilter === "active" && !s.isActive) return false;
    if (statusFilter === "inactive" && s.isActive) return false;
    return true;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <CardTitle>{t("ossAdmin.allSubscriptions", "All Subscriptions")}</CardTitle>
            <CardDescription>{t("ossAdmin.manageSubscriptions", "View subscription details")}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-subscription-plan-filter">
                <SelectValue placeholder={t("ossAdmin.plan", "Plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="apartment_lite">Apartment Lite</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40" data-testid="select-subscription-status-filter">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="active">{t("ossAdmin.active", "Active")}</SelectItem>
                <SelectItem value="inactive">{t("ossAdmin.inactive", "Inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("ossAdmin.noSubscriptions", "No subscriptions found")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSubscriptions.map((sub) => (
                <div
                  key={sub.subscriptionId}
                  className="p-4"
                  data-testid={`subscription-row-${sub.subscriptionId}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{sub.companyName}</span>
                        <Badge className={PLAN_COLORS[sub.planType] || "bg-secondary text-secondary-foreground"}>
                          {sub.planType?.replace("_", " ").toUpperCase() || "N/A"}
                        </Badge>
                        {sub.isActive ? (
                          <Badge className="bg-green-600 text-white">{t("ossAdmin.active", "Active")}</Badge>
                        ) : (
                          <Badge className="bg-red-600 text-white">{t("ossAdmin.inactive", "Inactive")}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {sub.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {t("ossAdmin.created", "Created")}: {formatDate(sub.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface ContractSummary {
  totalContracts: number;
  totalGross: number;
  totalTax: number;
  totalStateFee: number;
  totalPartnerCommission: number;
  totalNet: number;
  byRegion: Record<string, { gross: number; tax: number; stateFee: number; partnerCommission: number; net: number; count: number }>;
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  signed: "bg-blue-600 text-white",
  active: "bg-green-600 text-white",
  completed: "bg-purple-600 text-white",
  cancelled: "bg-red-600 text-white",
};

function FounderPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    region: "",
    country: "",
    clientName: "",
    contractValue: 0,
    currency: "AZN",
    partnerCompany: "",
    partnerCommissionPercent: 20,
    taxPercent: 18,
    stateFeePercent: 10,
    status: "draft",
    notes: "",
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<ContractSummary>({
    queryKey: ["/api/oss-admin/contracts/summary"],
  });

  const { data: allContracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/oss-admin/contracts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/oss-admin/contracts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/contracts/summary"] });
      toast({ title: t("ossAdmin.contracts.created", "Contract created") });
      setAddOpen(false);
      setFormData({ region: "", country: "", clientName: "", contractValue: 0, currency: "AZN", partnerCompany: "", partnerCommissionPercent: 20, taxPercent: 18, stateFeePercent: 10, status: "draft", notes: "" });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/oss-admin/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/contracts/summary"] });
      toast({ title: t("ossAdmin.contracts.deleted", "Contract deleted") });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const fmt = (val: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            {t("ossAdmin.founderPanel.title", "Financial Overview")}
          </CardTitle>
          <CardDescription>{t("ossAdmin.founderPanel.subtitle", "Net revenue after all deductions")}</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard title={t("ossAdmin.founderPanel.activeContracts", "Active Contracts")} value={summary.totalContracts} icon={FileText} />
              <StatCard title={t("ossAdmin.founderPanel.totalGross", "Gross Revenue")} value={fmt(summary.totalGross)} icon={DollarSign} />
              <StatCard title={t("ossAdmin.founderPanel.totalTax", "Tax (18%)")} value={fmt(summary.totalTax)} icon={TrendingUp} />
              <StatCard title={t("ossAdmin.founderPanel.totalStateFee", "State Fees (10%)")} value={fmt(summary.totalStateFee)} icon={Building2} />
              <StatCard title={t("ossAdmin.founderPanel.totalPartner", "Partner Commission (20%)")} value={fmt(summary.totalPartnerCommission)} icon={Users} />
              <StatCard title={t("ossAdmin.founderPanel.totalNet", "Net Revenue")} value={fmt(summary.totalNet)} icon={Banknote} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {summary && Object.keys(summary.byRegion).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("ossAdmin.founderPanel.byRegion", "Revenue by Region")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary.byRegion).map(([region, data]) => (
                <Card key={region}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <MapPin className="h-4 w-4" />
                      {region}
                      <Badge data-testid={`badge-region-count-${region}`}>{data.count}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("ossAdmin.contracts.gross", "Gross")}:</span><span>{fmt(data.gross)}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("ossAdmin.contracts.tax", "Tax")}:</span><span>-{fmt(data.tax)}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("ossAdmin.contracts.fee", "Fee")}:</span><span>-{fmt(data.stateFee)}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("ossAdmin.contracts.commission", "Commission")}:</span><span>-{fmt(data.partnerCommission)}</span></div>
                    <div className="flex justify-between gap-2 font-medium border-t pt-1"><span>{t("ossAdmin.contracts.net", "Net")}:</span><span>{fmt(data.net)}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("ossAdmin.contracts.title", "Contracts")}
            </CardTitle>
          </div>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-contract">
            <Plus className="h-4 w-4 mr-1" />
            {t("ossAdmin.contracts.add", "Add Contract")}
          </Button>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !allContracts?.length ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-contracts">{t("ossAdmin.contracts.noContracts", "No contracts found")}</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {allContracts.map((c) => {
                  const gross = c.contractValue;
                  const tax = gross * (c.taxPercent / 100);
                  const fee = gross * (c.stateFeePercent / 100);
                  const comm = c.partnerCompany ? gross * (c.partnerCommissionPercent / 100) : 0;
                  const net = gross - tax - fee - comm;
                  return (
                    <div key={c.id} className="flex items-start justify-between gap-4 p-3 border rounded-md" data-testid={`contract-row-${c.id}`}>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{c.clientName}</span>
                          <Badge className={CONTRACT_STATUS_COLORS[c.status] || ""}>{t(`ossAdmin.contracts.${c.status}`, c.status)}</Badge>
                          <Badge variant="outline">{c.currency} {fmt(gross)}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.region} / {c.country}</span>
                          {c.partnerCompany && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.partnerCompany}</span>}
                          <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{t("ossAdmin.contracts.net", "Net")}: {fmt(net)}</span>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(c.id)} data-testid={`button-delete-contract-${c.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("ossAdmin.contracts.add", "Add Contract")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("ossAdmin.contracts.region", "Region")}</Label>
                <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} data-testid="input-contract-region" />
              </div>
              <div>
                <Label>{t("ossAdmin.contracts.country", "Country")}</Label>
                <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} data-testid="input-contract-country" />
              </div>
            </div>
            <div>
              <Label>{t("ossAdmin.contracts.clientName", "Client Name")}</Label>
              <Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} data-testid="input-contract-client" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("ossAdmin.contracts.value", "Contract Value")}</Label>
                <Input type="number" value={formData.contractValue} onChange={(e) => setFormData({ ...formData, contractValue: Number(e.target.value) })} data-testid="input-contract-value" />
              </div>
              <div>
                <Label>{t("ossAdmin.contracts.currency", "Currency")}</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger data-testid="select-contract-currency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AZN">AZN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("ossAdmin.contracts.partner", "Partner Company")}</Label>
              <Input value={formData.partnerCompany} onChange={(e) => setFormData({ ...formData, partnerCompany: e.target.value })} data-testid="input-contract-partner" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("ossAdmin.contracts.taxPercent", "Tax %")}</Label>
                <Input type="number" value={formData.taxPercent} onChange={(e) => setFormData({ ...formData, taxPercent: Number(e.target.value) })} data-testid="input-contract-tax" />
              </div>
              <div>
                <Label>{t("ossAdmin.contracts.feePercent", "State Fee %")}</Label>
                <Input type="number" value={formData.stateFeePercent} onChange={(e) => setFormData({ ...formData, stateFeePercent: Number(e.target.value) })} data-testid="input-contract-fee" />
              </div>
              <div>
                <Label>{t("ossAdmin.contracts.partnerPercent", "Partner %")}</Label>
                <Input type="number" value={formData.partnerCommissionPercent} onChange={(e) => setFormData({ ...formData, partnerCommissionPercent: Number(e.target.value) })} data-testid="input-contract-partner-percent" />
              </div>
            </div>
            <div>
              <Label>{t("ossAdmin.contracts.status", "Status")}</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-contract-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("ossAdmin.contracts.draft", "Draft")}</SelectItem>
                  <SelectItem value="signed">{t("ossAdmin.contracts.signed", "Signed")}</SelectItem>
                  <SelectItem value="active">{t("ossAdmin.contracts.active", "Active")}</SelectItem>
                  <SelectItem value="completed">{t("ossAdmin.contracts.completed", "Completed")}</SelectItem>
                  <SelectItem value="cancelled">{t("ossAdmin.contracts.cancelled", "Cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("ossAdmin.contracts.notes", "Notes")}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} data-testid="input-contract-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.clientName || !formData.region || !formData.country} data-testid="button-submit-contract">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BoardPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    reporterName: "",
    region: "",
    title: "",
    content: "",
    contractIds: [] as string[],
    periodStart: "",
    periodEnd: "",
  });

  const { data: reports, isLoading } = useQuery<BoardReport[]>({
    queryKey: ["/api/oss-admin/board-reports"],
  });

  const { data: allContracts } = useQuery<Contract[]>({
    queryKey: ["/api/oss-admin/contracts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.periodStart) payload.periodStart = new Date(data.periodStart).toISOString();
      else delete payload.periodStart;
      if (data.periodEnd) payload.periodEnd = new Date(data.periodEnd).toISOString();
      else delete payload.periodEnd;
      if (!data.contractIds.length) delete payload.contractIds;
      const res = await apiRequest("POST", "/api/oss-admin/board-reports", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/board-reports"] });
      toast({ title: t("ossAdmin.boardPanel.created", "Report created") });
      setAddOpen(false);
      setFormData({ reporterName: "", region: "", title: "", content: "", contractIds: [], periodStart: "", periodEnd: "" });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/oss-admin/board-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/board-reports"] });
      toast({ title: t("ossAdmin.boardPanel.deleted", "Report deleted") });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {t("ossAdmin.boardPanel.title", "Board Reports")}
            </CardTitle>
            <CardDescription>{t("ossAdmin.boardPanel.subtitle", "Regional sales and operations reports")}</CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-report">
            <Plus className="h-4 w-4 mr-1" />
            {t("ossAdmin.boardPanel.addReport", "Add Report")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !reports?.length ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-reports">{t("ossAdmin.boardPanel.noReports", "No board reports yet")}</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {reports.map((r) => (
                  <Card key={r.id} data-testid={`report-row-${r.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            {r.title}
                            <Badge variant="outline">{r.region}</Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-3 flex-wrap mt-1">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.reporterName}</span>
                            {r.periodStart && r.periodEnd && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(r.periodStart)} - {formatDate(r.periodEnd)}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-report-${r.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                      {r.contractIds && r.contractIds.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">{t("ossAdmin.boardPanel.linkedContracts", "Linked Contracts")}:</span>
                          {r.contractIds.map((cId) => {
                            const contract = allContracts?.find((c) => c.id === cId);
                            return <Badge key={cId} variant="outline" className="text-xs">{contract?.clientName || cId}</Badge>;
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("ossAdmin.boardPanel.addReport", "Add Report")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("ossAdmin.boardPanel.reporter", "Reporter Name")}</Label>
                <Input value={formData.reporterName} onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })} data-testid="input-report-reporter" />
              </div>
              <div>
                <Label>{t("ossAdmin.boardPanel.region", "Region")}</Label>
                <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} data-testid="input-report-region" />
              </div>
            </div>
            <div>
              <Label>{t("ossAdmin.boardPanel.reportTitle", "Report Title")}</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} data-testid="input-report-title" />
            </div>
            <div>
              <Label>{t("ossAdmin.boardPanel.content", "Report Content")}</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} data-testid="input-report-content" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("ossAdmin.boardPanel.periodStart", "Period Start")}</Label>
                <Input type="date" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} data-testid="input-report-period-start" />
              </div>
              <div>
                <Label>{t("ossAdmin.boardPanel.periodEnd", "Period End")}</Label>
                <Input type="date" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} data-testid="input-report-period-end" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.reporterName || !formData.region || !formData.title || !formData.content} data-testid="button-submit-report">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Marketing Panel ──────────────────────────────────────────────────────────
interface MarketingUser {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  referralCode: string | null;
  referredCount: number;
}

function OssMarketingPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editCodeId, setEditCodeId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [form, setForm] = useState({ username: "", password: "", fullName: "", email: "", referralCode: "" });

  const { data: marketingUsers, isLoading } = useQuery<MarketingUser[]>({
    queryKey: ["/api/oss-admin/marketing-users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/oss-admin/marketing-users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/marketing-users"] });
      setCreateOpen(false);
      setForm({ username: "", password: "", fullName: "", email: "", referralCode: "" });
      toast({ title: t("common.success"), description: t("ossAdmin.marketing.userCreated", "Marketing staff created") });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const setCodeMutation = useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      const res = await apiRequest("PATCH", `/api/oss-admin/marketing-users/${userId}/referral-code`, { referralCode: code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/marketing-users"] });
      setEditCodeId(null);
      setCodeInput("");
      toast({ title: t("common.success"), description: t("ossAdmin.referralCodeSet", "Referral code updated") });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t("ossAdmin.marketing.title", "Marketing Staff")}</CardTitle>
              <CardDescription>{t("ossAdmin.marketing.desc", "Create marketing accounts and assign referral codes. Staff log in at /marketing to see their referred hotels.")}</CardDescription>
            </div>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-create-marketing-user">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("ossAdmin.marketing.addStaff", "Add Staff")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : marketingUsers && marketingUsers.length > 0 ? (
            <div className="divide-y">
              {marketingUsers.map((u) => (
                <div key={u.id} className="py-3 space-y-2" data-testid={`marketing-user-row-${u.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.fullName}</p>
                      <p className="text-sm text-muted-foreground">{u.username}{u.email ? ` • ${u.email}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {u.referredCount} {t("ossAdmin.marketing.hotels", "hotel(s)")}
                    </Badge>
                  </div>
                  {editCodeId === u.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8 text-xs uppercase font-mono w-44"
                        placeholder={t("ossAdmin.marketing.codePlaceholder", "e.g. RENA")}
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        maxLength={20}
                        data-testid={`input-marketing-code-${u.id}`}
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={() => setCodeMutation.mutate({ userId: u.id, code: codeInput })} disabled={setCodeMutation.isPending} data-testid={`button-save-marketing-code-${u.id}`}>
                        {setCodeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : t("common.save")}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setEditCodeId(null); setCodeInput(""); }}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {u.referralCode ? (
                        <Badge className="font-mono text-xs bg-primary/10 text-primary border border-primary/20">{u.referralCode}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">{t("ossAdmin.noReferralCode", "No referral code")}</span>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setEditCodeId(u.id); setCodeInput(u.referralCode || ""); }} data-testid={`button-edit-marketing-code-${u.id}`}>
                        ✏️ {u.referralCode ? t("ossAdmin.editCode", "Edit") : t("ossAdmin.setCode", "Set code")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t("ossAdmin.marketing.noStaff", "No marketing staff yet")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ossAdmin.marketing.createTitle", "Create Marketing Staff")}</DialogTitle>
            <DialogDescription>{t("ossAdmin.marketing.createDesc", "Create a login for a marketing team member. They will see only their referred hotels.")}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              <div>
                <Label>{t("auth.fullName")} *</Label>
                <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} data-testid="input-marketing-fullname" />
              </div>
              <div>
                <Label>{t("auth.username")} *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} data-testid="input-marketing-username" />
              </div>
              <div>
                <Label>{t("auth.email")}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-marketing-email" />
              </div>
              <div>
                <Label>{t("auth.password")} *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="input-marketing-password" />
              </div>
              <div>
                <Label>{t("ossAdmin.marketing.referralCode", "Referral Code")} <span className="text-muted-foreground text-xs">({t("common.optional", "optional")})</span></Label>
                <Input
                  className="uppercase font-mono"
                  placeholder="e.g. RENA"
                  value={form.referralCode}
                  onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                  maxLength={20}
                  data-testid="input-marketing-referral-code"
                />
                <p className="text-xs text-muted-foreground mt-1">{t("ossAdmin.marketing.codeHint", "You can also set this later")}</p>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.username || !form.password || !form.fullName} data-testid="button-confirm-create-marketing">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== OSS BILLING REPORTS PANEL =====================
function OssBillingReportsPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState<"overview" | "channex" | "whatsapp">("overview");
  const [creditHotelId, setCreditHotelId] = useState<string | null>(null);
  const [creditMessages, setCreditMessages] = useState<number>(500);
  const [creditNote, setCreditNote] = useState<string>("");

  const { data: revData, isLoading: revLoading } = useQuery<{
    channexMonthlyRevenue: number; channexHotelCount: number;
    whatsappTotalRevenue: number; whatsappActiveHotels: number;
    totalMonthlyRevenue: number; allTimeAddonRevenue: number;
    recentRevenue30d: number; totalHotels: number; activeHotels: number;
  }>({ queryKey: ["/api/oss-admin/reports/revenue"] });

  const { data: channexData, isLoading: channexLoading } = useQuery<{
    hotels: { hotelId: string; hotelName: string; city: string; country: string; roomCount: number; monthlyFeeUsd: number; channexPropertyUuid: string }[];
    totalMonthlyRevenue: number;
  }>({ queryKey: ["/api/oss-admin/reports/channex"] });

  const { data: whatsappData, isLoading: waLoading } = useQuery<{
    hotels: { hotelId: string; hotelName: string; city: string; isWhatsappEnabled: boolean; currentBalance: number; totalMessagesPurchased: number; totalMessagesUsed: number; totalSpentUsd: number; purchaseCount: number }[];
    totalRevenue: number;
  }>({ queryKey: ["/api/oss-admin/reports/whatsapp"] });

  const creditMutation = useMutation({
    mutationFn: async ({ hotelId, messages, note }: { hotelId: string; messages: number; note: string }) => {
      const res = await apiRequest("POST", `/api/oss-admin/hotels/${hotelId}/whatsapp-credit`, { messages, note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/reports/whatsapp"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oss-admin/reports/revenue"] });
      toast({ title: t("billing.admin.creditSuccess", "Credit Added"), description: t("billing.admin.creditSuccessDesc", "WhatsApp balance updated successfully.") });
      setCreditHotelId(null); setCreditMessages(500); setCreditNote("");
    },
    onError: () => { toast({ title: t("common.error", "Error"), variant: "destructive" }); },
  });

  const fmtUsd = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="space-y-6" data-testid="billing-reports-panel">
      <div className="flex gap-2 flex-wrap">
        {(["overview", "channex", "whatsapp"] as const).map((tab) => (
          <Button key={tab} size="sm" variant={activeReport === tab ? "default" : "outline"} onClick={() => setActiveReport(tab)} data-testid={`button-report-${tab}`}>
            {tab === "overview" && <DollarSign className="h-3.5 w-3.5 mr-1.5" />}
            {tab === "channex" && <Globe className="h-3.5 w-3.5 mr-1.5" />}
            {tab === "whatsapp" && <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
            {t(`billing.report.${tab}`, tab === "overview" ? "Revenue Overview" : tab === "channex" ? "Channex Report" : "WhatsApp Report")}
          </Button>
        ))}
      </div>

      {activeReport === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {revLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-28" />) : (<>
              <Card data-testid="stat-channex-monthly"><CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("billing.report.channexMonthly", "Channex Monthly")}</p>
                <p className="text-2xl font-bold mt-1">{fmtUsd(revData?.channexMonthlyRevenue ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{revData?.channexHotelCount ?? 0} {t("billing.report.hotels", "hotels")}</p>
              </CardContent></Card>
              <Card data-testid="stat-whatsapp-total"><CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("billing.report.waAllTime", "WhatsApp All-Time")}</p>
                <p className="text-2xl font-bold mt-1">{fmtUsd(revData?.allTimeAddonRevenue ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{revData?.whatsappActiveHotels ?? 0} {t("billing.report.active", "active")}</p>
              </CardContent></Card>
              <Card data-testid="stat-recent-30d"><CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("billing.report.last30d", "Last 30 Days")}</p>
                <p className="text-2xl font-bold mt-1">{fmtUsd(revData?.recentRevenue30d ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("billing.report.addonSales", "Add-on sales")}</p>
              </CardContent></Card>
              <Card data-testid="stat-total-hotels"><CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{t("billing.report.totalHotels", "Total Hotels")}</p>
                <p className="text-2xl font-bold mt-1">{revData?.totalHotels ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{revData?.activeHotels ?? 0} {t("billing.report.withAddons", "with add-ons")}</p>
              </CardContent></Card>
            </>)}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("billing.report.revenueSummary", "Revenue Summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-orange-500" /><span className="text-sm font-medium">{t("billing.channex.title", "Channel Manager")}</span></div>
                <span className="font-bold text-green-600">{fmtUsd(revData?.channexMonthlyRevenue ?? 0)}/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-green-500" /><span className="text-sm font-medium">{t("billing.wa.title", "WhatsApp")}</span></div>
                <span className="font-bold text-green-600">{fmtUsd(revData?.allTimeAddonRevenue ?? 0)} {t("billing.report.allTime", "all-time")}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /><span className="text-sm font-bold">{t("billing.report.totalMonthly", "Total Monthly Revenue")}</span></div>
                <span className="font-bold text-primary text-lg">{fmtUsd((revData?.channexMonthlyRevenue ?? 0) + (revData?.recentRevenue30d ?? 0))}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeReport === "channex" && (
        <Card data-testid="channex-report-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-orange-500" />{t("billing.report.channexTitle", "Channel Manager Report")}</CardTitle>
            <CardDescription>{t("billing.report.channexDesc", "Hotels with active Channex integration and their monthly fees")}</CardDescription>
          </CardHeader>
          <CardContent>
            {channexLoading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            : !channexData?.hotels.length ? <p className="text-center text-muted-foreground py-8">{t("billing.report.noChannex", "No hotels with Channex enabled yet")}</p>
            : (<>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{channexData.hotels.length} {t("billing.report.hotels", "hotels")}</p>
                <Badge variant="secondary" data-testid="badge-channex-total">{t("billing.report.totalMonthly", "Total")} {fmtUsd(channexData.totalMonthlyRevenue)}/mo</Badge>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("billing.report.hotel", "Hotel")}</TableHead>
                  <TableHead>{t("billing.report.location", "Location")}</TableHead>
                  <TableHead className="text-right">{t("billing.report.rooms", "Rooms")}</TableHead>
                  <TableHead className="text-right">{t("billing.report.monthlyFee", "Monthly Fee")}</TableHead>
                  <TableHead>{t("billing.report.channexUuid", "Channex UUID")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {channexData.hotels.map((h) => (
                    <TableRow key={h.hotelId} data-testid={`channex-row-${h.hotelId}`}>
                      <TableCell className="font-medium">{h.hotelName}</TableCell>
                      <TableCell className="text-muted-foreground">{[h.city, h.country].filter(Boolean).join(", ")}</TableCell>
                      <TableCell className="text-right">{h.roomCount}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{fmtUsd(h.monthlyFeeUsd)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{h.channexPropertyUuid || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>)}
          </CardContent>
        </Card>
      )}

      {activeReport === "whatsapp" && (
        <Card data-testid="whatsapp-report-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-green-500" />{t("billing.report.whatsappTitle", "WhatsApp Report")}</CardTitle>
            <CardDescription>{t("billing.report.whatsappDesc", "Hotels with WhatsApp packages — balance, usage, and revenue")}</CardDescription>
          </CardHeader>
          <CardContent>
            {waLoading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            : !whatsappData?.hotels.length ? <p className="text-center text-muted-foreground py-8">{t("billing.report.noWhatsapp", "No WhatsApp packages purchased yet")}</p>
            : (<>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{whatsappData.hotels.length} {t("billing.report.hotels", "hotels")}</p>
                <Badge variant="secondary" data-testid="badge-wa-total">{t("billing.report.totalRevenue", "Total")} {fmtUsd(whatsappData.totalRevenue)}</Badge>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("billing.report.hotel", "Hotel")}</TableHead>
                  <TableHead>{t("billing.report.status", "Status")}</TableHead>
                  <TableHead className="text-right">{t("billing.wa.remainingMessages", "Balance")}</TableHead>
                  <TableHead className="text-right">{t("billing.report.used", "Used")}</TableHead>
                  <TableHead className="text-right">{t("billing.report.totalSpent", "Spent")}</TableHead>
                  <TableHead className="text-right">{t("billing.admin.credit", "Credit")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {whatsappData.hotels.map((h) => (
                    <TableRow key={h.hotelId} data-testid={`wa-row-${h.hotelId}`}>
                      <TableCell className="font-medium">{h.hotelName}</TableCell>
                      <TableCell><Badge variant={h.isWhatsappEnabled ? "default" : "secondary"}>{h.isWhatsappEnabled ? t("billing.active", "Active") : t("billing.inactive", "Inactive")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold">{h.currentBalance}</span>
                          <Progress value={Math.min(100, (h.currentBalance / Math.max(1, h.totalMessagesPurchased)) * 100)} className="h-1 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{h.totalMessagesUsed}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{fmtUsd(h.totalSpentUsd)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setCreditHotelId(h.hotelId)} data-testid={`button-credit-${h.hotelId}`}>
                          + {t("billing.admin.credit", "Credit")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>)}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!creditHotelId} onOpenChange={(o) => !o && setCreditHotelId(null)}>
        <DialogContent data-testid="dialog-whatsapp-credit">
          <DialogHeader>
            <DialogTitle>{t("billing.admin.creditTitle", "Add WhatsApp Credit")}</DialogTitle>
            <DialogDescription>{t("billing.admin.creditDesc", "Manually add WhatsApp message balance to this hotel")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>{t("billing.admin.messagesCount", "Messages to Add")}</Label>
              <Input type="number" min={1} value={creditMessages} onChange={(e) => setCreditMessages(parseInt(e.target.value) || 0)} data-testid="input-credit-messages" />
            </div>
            <div className="space-y-1">
              <Label>{t("billing.admin.creditNoteLabel", "Note (optional)")}</Label>
              <Textarea value={creditNote} onChange={(e) => setCreditNote(e.target.value)} placeholder={t("billing.admin.creditNotePlaceholder", "Reason for credit...")} data-testid="input-credit-note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditHotelId(null)}>{t("common.cancel")}</Button>
            <Button disabled={creditMutation.isPending || creditMessages <= 0} onClick={() => creditHotelId && creditMutation.mutate({ hotelId: creditHotelId, messages: creditMessages, note: creditNote })} data-testid="button-confirm-credit">
              {creditMutation.isPending ? t("common.loading", "Saving...") : t("billing.admin.addCredit", "Add Credit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

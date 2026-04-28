import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Mail,
  Shield,
  MessageSquare,
  Plus,
  Send,
  RefreshCw,
  UserPlus,
  Loader2,
  Activity,
} from "lucide-react";
import type { User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "admin" || role === "property_manager") return "default";
  if (role === "reception") return "secondary";
  return "outline";
};

const roleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: "Admin",
    property_manager: "Property Manager",
    reception: "Reception",
    staff: "Staff",
    cleaner: "Cleaner",
    restaurant_manager: "Restaurant Manager",
    waiter: "Waiter",
    kitchen_staff: "Kitchen Staff",
  };
  return labels[role] || role;
};

type StaffUser = Omit<User, "password">;

function InlineStaffChat({ staffId, staffName }: { staffId: string; staffName: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/staff-dm", staffId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/staff-dm/${staffId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chat/staff-dm/${staffId}`, { message: message.trim() });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", staffId] });
    },
    onError: () => {
      toast({ title: t("errors.somethingWentWrong", "Something went wrong"), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-muted/30">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{staffName}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.senderId === staffId ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.senderId === staffId ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t("owner.staffMessage.noMessages", "No messages yet. Start the conversation!")}
          </div>
        )}
      </div>
      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder={t("owner.staffMessage.placeholder", "Type a message...")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          data-testid="input-inline-staff-message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (message.trim()) sendMutation.mutate();
            }
          }}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => sendMutation.mutate()}
          disabled={!message.trim() || sendMutation.isPending}
          data-testid="button-send-inline-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AddStaffModal({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    email: "",
    role: "reception" as string,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/create-staff", form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("staff.created", "Staff member created successfully") });
      setOpen(false);
      setForm({ fullName: "", username: "", password: "", email: "", role: "reception" });
      onSuccess();
    },
    onError: (err: any) => {
      toast({ title: err?.message || t("errors.somethingWentWrong", "Something went wrong"), variant: "destructive" });
    },
  });

  const canSubmit = form.fullName.trim() && form.username.trim() && form.password.trim() && form.role;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-staff">
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t("owner.addStaff", "Add Staff")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("owner.addStaff", "Add Staff Member")}
          </DialogTitle>
          <DialogDescription>
            {t("staff.createNewAccount", "Create a new staff account for your property.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="staff-fullname">{t("auth.fullName", "Full Name")} *</Label>
            <Input
              id="staff-fullname"
              placeholder={t("placeholders.fullName", "Jane Smith")}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              data-testid="input-staff-fullname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-username">{t("auth.username", "Username")} *</Label>
            <Input
              id="staff-username"
              placeholder="jane.smith"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              data-testid="input-staff-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">{t("auth.password", "Password")} *</Label>
            <Input
              id="staff-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              data-testid="input-staff-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">{t("common.email", "Email")}</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="jane@hotel.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              data-testid="input-staff-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">{t("common.role", "Role")} *</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger data-testid="select-staff-role">
                <SelectValue placeholder={t("staff.selectRole", "Select role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("staff.adminRole", "Admin (Full Access)")}</SelectItem>
                <SelectItem value="reception">{t("staff.receptionRole", "Reception")}</SelectItem>
                <SelectItem value="cleaner">{t("staff.cleanerRole", "Cleaner")}</SelectItem>
                <SelectItem value="restaurant_manager">Restaurant Manager</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="kitchen_staff">Kitchen Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit || createMutation.isPending}
            data-testid="button-submit-add-staff"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("owner.createAccount", "Create Account")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffList() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatStaffId, setActiveChatStaffId] = useState<string | null>(null);
  const [activeChatStaffName, setActiveChatStaffName] = useState("");

  const { data: staffUsers, isLoading, refetch } = useQuery<StaffUser[]>({
    queryKey: ["/api/users/staff"],
  });

  const staff = staffUsers || [];

  const filteredStaff = staff.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const canAddStaff = currentUser?.role === "admin" ||
    currentUser?.role === "property_manager" ||
    currentUser?.role === "owner_admin" ||
    currentUser?.role === "oss_super_admin";

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-staff-title">
            {t("staffList.title", "Staff")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {staff.length} {t("owner.staffManagement.teamMemberCount", "team members")}
          </p>
        </div>
        {canAddStaff && (
          <AddStaffModal onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] })} />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("nav.staff", "Total"), value: staff.length, color: "bg-primary/10 text-primary" },
          { label: t("roles.admin", "Admins"), value: staff.filter(s => s.role === "admin" || s.role === "property_manager").length, color: "bg-blue-500/10 text-blue-500" },
          { label: t("roles.reception", "Reception"), value: staff.filter(s => s.role === "reception").length, color: "bg-green-500/10 text-green-500" },
          { label: "Restaurant", value: staff.filter(s => ["restaurant_manager", "waiter", "kitchen_staff"].includes(s.role)).length, color: "bg-orange-500/10 text-orange-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder={t("common.search", "Search staff") + "..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
        data-testid="input-search-staff"
      />

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
            <div>
              <p className="font-semibold text-lg">{t("staffList.noStaffMembers", "No staff members")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("staffList.staffWillAppear", "Staff accounts will appear here once created")}
              </p>
            </div>
            {canAddStaff && (
              <div className="flex justify-center">
                <AddStaffModal onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/users/staff"] })} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredStaff.map((member) => (
            <Card key={member.id} data-testid={`card-staff-${member.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {member.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-staff-name-${member.id}`}>
                      {member.fullName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      {member.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {member.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={roleBadgeVariant(member.role)} data-testid={`badge-staff-role-${member.id}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {roleLabel(member.role)}
                  </Badge>
                  {currentUser && currentUser.id !== member.id && (
                    <Button
                      size="sm"
                      variant={activeChatStaffId === member.id ? "default" : "outline"}
                      onClick={() => {
                        if (activeChatStaffId === member.id) {
                          setActiveChatStaffId(null);
                          setActiveChatStaffName("");
                        } else {
                          setActiveChatStaffId(member.id);
                          setActiveChatStaffName(member.fullName || member.username || "Staff");
                        }
                      }}
                      data-testid={`button-chat-staff-${member.id}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      {activeChatStaffId === member.id ? "Chat Open" : t("owner.staffMessage.button", "Message")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Messaging Panel */}
      <Card data-testid="card-staff-messaging">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {t("owner.staffMessaging.title", "Staff Messaging")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {staff.filter(s => currentUser && s.id !== currentUser.id).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t("owner.staffMessaging.noStaff", "Add staff members to start messaging")}</p>
            </div>
          ) : (
            <div className="flex border-t" style={{ height: "420px" }}>
              {/* Left: staff list */}
              <div className="w-56 border-r flex-shrink-0 overflow-y-auto">
                {staff
                  .filter(s => currentUser && s.id !== currentUser.id)
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setActiveChatStaffId(member.id);
                        setActiveChatStaffName(member.fullName || member.username || "Staff");
                      }}
                      data-testid={`button-chat-select-staff-${member.id}`}
                      className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 border-b last:border-b-0 ${
                        activeChatStaffId === member.id
                          ? "bg-primary/10 border-l-2 border-l-primary"
                          : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {member.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{member.fullName || member.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{roleLabel(member.role)}</p>
                      </div>
                    </button>
                  ))}
              </div>
              {/* Right: chat */}
              <div className="flex-1 min-w-0">
                {activeChatStaffId ? (
                  <InlineStaffChat staffId={activeChatStaffId} staffName={activeChatStaffName} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-6">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">
                      {t("owner.staffMessaging.selectStaff", "Select a staff member to start a conversation")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

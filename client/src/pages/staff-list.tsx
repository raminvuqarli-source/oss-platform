import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Mail, Shield, MessageSquare } from "lucide-react";
import type { User } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";

const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "admin" || role === "property_manager") return "default";
  if (role === "reception") return "secondary";
  return "outline";
};

type StaffUser = Omit<User, "password">;

export default function StaffList() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  const { data: staffUsers, isLoading } = useQuery<StaffUser[]>({
    queryKey: ["/api/users/staff"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const staff = staffUsers || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-staff-title">{t('staffList.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {staff.length !== 1
            ? t('staffList.teamMembersPlural', { count: staff.length })
            : t('staffList.teamMembers', { count: staff.length })}
        </p>
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="font-medium">{t('staffList.noStaffMembers')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('staffList.staffWillAppear')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => (
            <Card key={member.id} data-testid={`card-staff-${member.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar>
                    <AvatarFallback>
                      {member.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate" data-testid={`text-staff-name-${member.id}`}>{member.fullName}</p>
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
                <div className="flex items-center gap-2">
                  {currentUser && currentUser.id !== member.id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => navigate(`/dashboard?view=staff-chat&staffId=${member.id}`)}
                      data-testid={`button-chat-staff-${member.id}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant={roleBadgeVariant(member.role)} data-testid={`badge-staff-role-${member.id}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {t(`staffList.roles.${member.role}`, { defaultValue: member.role })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Loader2 } from "lucide-react";

export default function DemoLogin() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(search);
    const role = params.get("role");

    if (!role) {
      setLocation("/");
      return;
    }

    apiRequest("POST", "/api/auth/demo-login", { role })
      .then((res) => res.json())
      .then((data) => {
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "/api/auth/me" });
        queryClient.setQueryData(["/api/auth/me"], data);
        setLocation("/dashboard");
      })
      .catch(() => {
        setLocation("/?demo_error=1");
      });
  }, [search, setLocation, queryClient]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="flex aspect-square size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
        <Building2 className="size-7" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading demo…</span>
      </div>
    </div>
  );
}

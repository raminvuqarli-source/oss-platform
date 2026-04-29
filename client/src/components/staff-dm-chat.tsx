import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User, ChatMessage } from "@shared/schema";

interface StaffDmConversation {
  peerId: string;
  peerName?: string;
  peerRole?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface StaffDmChatProps {
  peerRoles?: string[];
  emptyLabel?: string;
  panelLabel?: string;
}

export function StaffDmChat({
  peerRoles = ["admin", "property_manager", "owner_admin", "reception", "restaurant_manager"],
  emptyLabel = "Müdir tapılmadı",
  panelLabel = "Əkip Mesajları",
}: StaffDmChatProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: staffUsers = [] } = useQuery<Array<Omit<User, "password">>>({
    queryKey: ["/api/users/staff"],
  });

  const { data: conversations = [] } = useQuery<StaffDmConversation[]>({
    queryKey: ["/api/chat/staff-dm/conversations"],
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/staff-dm", selectedId],
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      const vp = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (vp) vp.scrollTop = vp.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async ({ peerId, msg }: { peerId: string; msg: string }) => {
      const res = await apiRequest("POST", `/api/chat/staff-dm/${peerId}`, { message: msg });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm/conversations"] });
      setMessage("");
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    onError: () => toast({ title: "Mesaj göndərilmədi", variant: "destructive" }),
  });

  const peers = (staffUsers || []).filter(s =>
    s.id !== currentUser?.id && peerRoles.includes(s.role ?? "")
  );

  const selectedPeer = staffUsers?.find(s => s.id === selectedId);

  const initials = (name?: string | null) =>
    name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleSend = () => {
    if (!selectedId || !message.trim()) return;
    sendMutation.mutate({ peerId: selectedId, msg: message.trim() });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-260px)] min-h-[400px]" data-testid="staff-dm-chat">
      {/* Peers list */}
      <Card className="md:col-span-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {panelLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {peers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{emptyLabel}</div>
            ) : (
              <div className="divide-y">
                {peers.map(peer => {
                  const conv = conversations.find(c => c.peerId === peer.id);
                  const isSelected = selectedId === peer.id;
                  return (
                    <div
                      key={peer.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
                      onClick={() => {
                        setSelectedId(peer.id);
                        queryClient.invalidateQueries({ queryKey: ["/api/chat/staff-dm", peer.id] });
                      }}
                      data-testid={`dm-peer-${peer.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials(peer.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-sm truncate">{peer.fullName}</span>
                            {conv?.lastMessageAt && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{peer.role?.replace(/_/g, " ")}</p>
                          {conv?.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                          )}
                          {(conv?.unreadCount ?? 0) > 0 && (
                            <Badge className="mt-1 text-xs" variant="destructive">{conv!.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {!selectedId ? (
          <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Söhbət başlatmaq üçün birini seçin</p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-3 flex-shrink-0 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials(selectedPeer?.fullName)}
                  </AvatarFallback>
                </Avatar>
                {selectedPeer?.fullName}
                <span className="text-xs font-normal text-muted-foreground capitalize">
                  — {selectedPeer?.role?.replace(/_/g, " ")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-3/4" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">Hələ mesaj yoxdur</div>
                ) : (
                  <div className="space-y-3" ref={scrollRef}>
                    {messages.map(msg => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`} data-testid={`dm-msg-${msg.id}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                            <p>{msg.message}</p>
                            <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.createdAt?.toString() ?? ""), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Mesaj yazın..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1"
                  data-testid="dm-input-message"
                />
                <Button onClick={handleSend} disabled={sendMutation.isPending || !message.trim()} size="icon" data-testid="dm-btn-send">
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Mic, MicOff, Radio, Users, X, Volume2 } from "lucide-react";

interface RadioUser {
  userId: string;
  name: string;
  role: string;
}

interface PTTState {
  speakerId: string | null;
  speakerName: string | null;
  speakerRole: string | null;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const ROLE_LABELS: Record<string, string> = {
  owner_admin: "Sahibkar",
  reception: "Resepsiya",
  waiter: "Qarson",
  kitchen_staff: "Aşpaz",
  restaurant_manager: "Rest. Müdiri",
  restaurant_cleaner: "Təmizlikçi",
  restaurant_cashier: "Kassir",
  housekeeping: "Xidmətçi",
  property_manager: "Mülk Müdiri",
  maintenance: "Texniki",
  admin: "Admin",
  marketing_staff: "Marketinq",
};

export function RadioWidget() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState<RadioUser[]>([]);
  const [pttState, setPttState] = useState<PTTState>({ speakerId: null, speakerName: null, speakerRole: null });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChannelBusy, setIsChannelBusy] = useState(false);
  const [micError, setMicError] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const audiosRef = useRef(new Map<string, HTMLAudioElement>());
  const speakingRef = useRef(false);
  const usersRef = useRef<RadioUser[]>([]);
  const myUserIdRef = useRef<string>("");

  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => {
    if (user) myUserIdRef.current = String(user.id);
  }, [user]);

  function getOrCreateAudio(userId: string) {
    if (!audiosRef.current.has(userId)) {
      const audio = new Audio();
      audio.autoplay = true;
      audiosRef.current.set(userId, audio);
    }
    return audiosRef.current.get(userId)!;
  }

  function createPeer(userId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "RADIO_ICE",
          targetUserId: userId,
          candidate: e.candidate,
        }));
      }
    };

    pc.ontrack = (e) => {
      const audio = getOrCreateAudio(userId);
      audio.srcObject = e.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        peersRef.current.delete(userId);
      }
    };

    peersRef.current.set(userId, pc);
    return pc;
  }

  async function handleOffer(fromUserId: string, sdp: RTCSessionDescriptionInit) {
    const pc = createPeer(fromUserId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    wsRef.current?.send(JSON.stringify({ type: "RADIO_ANSWER", targetUserId: fromUserId, sdp: answer }));
  }

  async function handleAnswer(fromUserId: string, sdp: RTCSessionDescriptionInit) {
    const pc = peersRef.current.get(fromUserId);
    if (pc && pc.signalingState !== "stable") {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
  }

  async function handleIce(fromUserId: string, candidate: RTCIceCandidateInit) {
    const pc = peersRef.current.get(fromUserId);
    if (pc) {
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    }
  }

  function buildWsHandler() {
    return async (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data as string);
        switch (msg.type) {
          case "RADIO_USER_LIST":
            setUsers((msg.users as RadioUser[]).filter(u => u.userId !== myUserIdRef.current));
            break;
          case "RADIO_PTT":
            setPttState({ speakerId: msg.speakerId, speakerName: msg.speakerName, speakerRole: msg.speakerRole });
            break;
          case "RADIO_CHANNEL_BUSY":
            setIsChannelBusy(true);
            setTimeout(() => setIsChannelBusy(false), 2500);
            break;
          case "RADIO_OFFER":
            await handleOffer(msg.fromUserId, msg.sdp);
            break;
          case "RADIO_ANSWER":
            await handleAnswer(msg.fromUserId, msg.sdp);
            break;
          case "RADIO_ICE":
            await handleIce(msg.fromUserId, msg.candidate);
            break;
        }
      } catch {}
    };
  }

  async function connectRadio() {
    if (isConnecting || isJoined) return;
    setIsConnecting(true);
    setMicError("");
    try {
      const tokenRes = await fetch("/api/ws-token");
      const { token } = await tokenRes.json();
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/devices?type=dashboard&wsToken=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "RADIO_JOIN" }));
        setIsJoined(true);
        setIsConnecting(false);
      };

      ws.onmessage = buildWsHandler();

      ws.onclose = () => {
        setIsJoined(false);
        setUsers([]);
        setPttState({ speakerId: null, speakerName: null, speakerRole: null });
        setIsSpeaking(false);
        setIsConnecting(false);
        speakingRef.current = false;
      };

      ws.onerror = () => {
        setMicError("Bağlantı xətası");
        setIsConnecting(false);
      };
    } catch {
      setMicError("Bağlantı uğursuz oldu");
      setIsConnecting(false);
    }
  }

  function disconnectRadio() {
    stopSpeaking();
    wsRef.current?.send(JSON.stringify({ type: "RADIO_LEAVE" }));
    wsRef.current?.close();
    wsRef.current = null;
    setIsJoined(false);
    setUsers([]);
    setPttState({ speakerId: null, speakerName: null, speakerRole: null });
  }

  async function startSpeaking() {
    if (speakingRef.current || !isJoined) return;
    if (pttState.speakerId && pttState.speakerId !== myUserIdRef.current) {
      setIsChannelBusy(true);
      setTimeout(() => setIsChannelBusy(false), 2000);
      return;
    }
    try {
      setMicError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      speakingRef.current = true;
      setIsSpeaking(true);

      wsRef.current?.send(JSON.stringify({ type: "RADIO_PTT_START" }));

      for (const remoteUser of usersRef.current) {
        const pc = createPeer(remoteUser.userId);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsRef.current?.send(JSON.stringify({ type: "RADIO_OFFER", targetUserId: remoteUser.userId, sdp: offer }));
      }
    } catch (e: any) {
      const msg = e?.name === "NotAllowedError" ? "Mikrofon icazəsi verilmədi" : "Mikrofon açıla bilmədi";
      setMicError(msg);
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }

  function stopSpeaking() {
    if (!speakingRef.current) return;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    wsRef.current?.send(JSON.stringify({ type: "RADIO_PTT_STOP" }));
    speakingRef.current = false;
    setIsSpeaking(false);
  }

  useEffect(() => {
    return () => {
      stopSpeaking();
      wsRef.current?.close();
      audiosRef.current.forEach(a => { a.srcObject = null; });
    };
  }, []);

  if (!user || user.role === "guest" || user.role === "oss_super_admin") return null;

  const myUserId = String(user.id);
  const iSpeaking = pttState.speakerId === myUserId;
  const someoneElseSpeaking = !!pttState.speakerId && pttState.speakerId !== myUserId;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2" data-testid="radio-widget">
      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-background border rounded-2xl shadow-2xl p-4 w-64 mb-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-sm">Ratsiya</span>
              {isJoined && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground" data-testid="button-radio-close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Speaking indicator */}
          {pttState.speakerId && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 text-xs font-medium ${
              iSpeaking
                ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                : "bg-green-500/15 text-green-700 dark:text-green-400"
            }`} data-testid="radio-speaking-indicator">
              <Volume2 className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span>{iSpeaking ? "Siz danışırsınız..." : `${pttState.speakerName} danışır...`}</span>
            </div>
          )}

          {/* Channel busy */}
          {isChannelBusy && !pttState.speakerId && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3 bg-destructive/10 text-destructive text-xs" data-testid="radio-channel-busy">
              <Radio className="h-3.5 w-3.5 shrink-0" />
              <span>Kanal məşğuldur</span>
            </div>
          )}

          {/* Connect button */}
          <button
            onClick={isJoined ? disconnectRadio : connectRadio}
            disabled={isConnecting}
            className={`w-full text-xs py-2 px-3 rounded-xl mb-3 font-medium transition-colors ${
              isJoined
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            data-testid="button-radio-connect"
          >
            {isConnecting ? "Qoşulur..." : isJoined ? "Kanaldan çıx" : "Kanala qoşul"}
          </button>

          {/* PTT button in panel */}
          {isJoined && (
            <button
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 select-none transition-all ${
                iSpeaking
                  ? "bg-orange-500 text-white ring-2 ring-orange-300"
                  : someoneElseSpeaking
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground active:scale-95"
              }`}
              onMouseDown={startSpeaking}
              onMouseUp={stopSpeaking}
              onMouseLeave={stopSpeaking}
              onTouchStart={(e) => { e.preventDefault(); startSpeaking(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopSpeaking(); }}
              data-testid="button-ptt"
            >
              {iSpeaking
                ? <><Mic className="h-4 w-4 animate-pulse" /> Danışırsınız...</>
                : <><MicOff className="h-4 w-4" /> Basılı tutun — Danış</>
              }
            </button>
          )}

          {/* User list */}
          {isJoined && (
            <div className="mt-3">
              <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {users.length > 0 ? `${users.length} nəfər kanalda` : "Kanalda başqa istifadəçi yoxdur"}
              </p>
              {users.map(u => (
                <div key={u.userId} className="flex items-center gap-2 py-1 text-xs" data-testid={`radio-user-${u.userId}`}>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    pttState.speakerId === u.userId ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
                  }`} />
                  <span className="font-medium truncate">{u.name}</span>
                  <span className="text-muted-foreground shrink-0">{ROLE_LABELS[u.role] ?? u.role}</span>
                </div>
              ))}
            </div>
          )}

          {micError && (
            <p className="text-xs text-destructive mt-2 text-center" data-testid="radio-mic-error">{micError}</p>
          )}
        </div>
      )}

      {/* Floating toggle button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(o => !o)}
          className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            isJoined
              ? iSpeaking
                ? "bg-orange-500 text-white ring-2 ring-orange-300 scale-110"
                : someoneElseSpeaking
                ? "bg-green-500 text-white"
                : "bg-orange-500 text-white"
              : "bg-background border-2 text-muted-foreground hover:text-foreground hover:border-primary"
          }`}
          data-testid="button-radio-toggle"
          title="Ratsiya"
        >
          <Radio className="h-5 w-5" />
        </button>
        {isJoined && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" data-testid="radio-online-dot" />
        )}
        {someoneElseSpeaking && (
          <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        )}
      </div>
    </div>
  );
}

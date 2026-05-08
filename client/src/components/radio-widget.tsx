import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "react-i18next";
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

// Keeps the browser audio session alive so the OS does not suspend JS when
// the screen locks. Strategy: route a near-silent oscillator through an
// AudioContext → MediaStreamDestination → real HTMLAudioElement.
// Real <audio> playback prevents iOS/Android from throttling the tab.
function createSilentAudioLoop(): { start: () => void; stop: () => void; resume: () => void } {
  let ctx: AudioContext | null = null;
  let audioEl: HTMLAudioElement | null = null;

  function start() {
    try {
      ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // inaudible but non-zero keeps session alive
      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      audioEl = new Audio();
      audioEl.srcObject = dest.stream;
      audioEl.loop = true;
      (audioEl as any).playsinline = true; // iOS: don't fullscreen
      audioEl.play().catch(() => {});
    } catch {}
  }

  // Call after the page returns to foreground to unfreeze a suspended context
  function resume() {
    try { ctx?.resume(); } catch {}
    try { audioEl?.play().catch(() => {}); } catch {}
  }

  function stop() {
    try { audioEl?.pause(); } catch {}
    audioEl = null;
    try { ctx?.close(); } catch {}
    ctx = null;
  }

  return { start, stop, resume };
}

export function RadioWidget() {
  const { user } = useAuth();
  const { t } = useTranslation();

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
  // wantJoinedRef = user INTENT (true after "Join" click, false after "Disconnect" click).
  // Never driven by connection state — this is what guards auto-reconnect.
  const wantJoinedRef = useRef(false);
  // isConnectingRef mirrors isConnecting state so callbacks always see fresh value.
  const isConnectingRef = useRef(false);
  const silentLoopRef = useRef(createSilentAudioLoop());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => {
    if (user) myUserIdRef.current = String(user.id);
  }, [user]);

  // Request WakeLock to keep screen on while radio is active
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch {}
  }

  function releaseWakeLock() {
    try { wakeLockRef.current?.release(); } catch {}
    wakeLockRef.current = null;
  }

  // Register MediaSession so OS treats app as active media (prevents suspension)
  function registerMediaSession() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "O.S.S Ratsiya",
        artist: "O.S.S Komandası",
      });
      navigator.mediaSession.playbackState = "playing";
    } catch {}
  }

  function clearMediaSession() {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    } catch {}
  }

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

  // connectRadio uses only refs (no state deps) so the function reference is
  // stable and callbacks always call the latest version without stale closure.
  const connectRadio = useCallback(async () => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) return;
    // Mark intent BEFORE any async work so ws.onclose always sees it correctly
    wantJoinedRef.current = true;
    isConnectingRef.current = true;
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
        isConnectingRef.current = false;
        setIsConnecting(false);
        silentLoopRef.current.start();
        registerMediaSession();
        requestWakeLock();
      };

      ws.onmessage = buildWsHandler();

      ws.onclose = () => {
        setIsJoined(false);
        setUsers([]);
        setPttState({ speakerId: null, speakerName: null, speakerRole: null });
        setIsSpeaking(false);
        isConnectingRef.current = false;
        setIsConnecting(false);
        speakingRef.current = false;

        // Auto-reconnect only if the user INTENDED to stay connected.
        // wantJoinedRef is only set false by explicit disconnectRadio() call —
        // it is never touched by connection-state changes, so it stays true
        // while the app is minimised / screen is locked.
        if (wantJoinedRef.current) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            if (wantJoinedRef.current) connectRadio();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setMicError(t("radio.connectionError"));
        isConnectingRef.current = false;
        setIsConnecting(false);
      };
    } catch {
      setMicError(t("radio.connectionFailed"));
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, [t]); // no isConnecting dep — guarded by isConnectingRef instead

  function disconnectRadio() {
    // Mark intent first so ws.onclose doesn't schedule a reconnect
    wantJoinedRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    stopSpeaking();
    wsRef.current?.send(JSON.stringify({ type: "RADIO_LEAVE" }));
    wsRef.current?.close();
    wsRef.current = null;
    isConnectingRef.current = false;
    setIsJoined(false);
    setIsConnecting(false);
    setUsers([]);
    setPttState({ speakerId: null, speakerName: null, speakerRole: null });
    silentLoopRef.current.stop();
    clearMediaSession();
    releaseWakeLock();
  }

  async function startSpeaking() {
    if (speakingRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
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
      const msg = e?.name === "NotAllowedError"
        ? t("radio.micPermissionDenied")
        : t("radio.micError");
      setMicError(msg);
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }

  function stopSpeaking() {
    if (!speakingRef.current) return;
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    wsRef.current?.send(JSON.stringify({ type: "RADIO_PTT_STOP" }));
    speakingRef.current = false;
    setIsSpeaking(false);
  }

  // When page comes back to foreground (screen unlocked / tab re-focused):
  // 1. Resume the silent audio loop (OS may have suspended AudioContext)
  // 2. Re-request WakeLock (it is automatically released on screen lock)
  // 3. Reconnect WebSocket if it dropped while screen was off
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && wantJoinedRef.current) {
        silentLoopRef.current.resume();
        requestWakeLock();
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectRadio();
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // pageshow fires on iOS when returning from background / bfcache
    window.addEventListener("pageshow", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
    };
  }, [connectRadio]);

  useEffect(() => {
    return () => {
      wantJoinedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopSpeaking();
      wsRef.current?.close();
      audiosRef.current.forEach(a => { a.srcObject = null; });
      silentLoopRef.current.stop();
      clearMediaSession();
      releaseWakeLock();
    };
  }, []);

  if (!user || user.role === "guest" || user.role === "oss_super_admin") return null;

  const myUserId = String(user.id);
  const iSpeaking = pttState.speakerId === myUserId;
  const someoneElseSpeaking = !!pttState.speakerId && pttState.speakerId !== myUserId;

  function roleLabel(role: string) {
    const key = `radio.roles.${role}`;
    const translated = t(key);
    return translated === key ? role : translated;
  }

  return (
    <div className="fixed bottom-36 sm:bottom-24 right-4 z-40 flex flex-col items-end gap-2" data-testid="radio-widget">
      {/* Expanded panel */}
      {isOpen && (
        <div className="bg-background border rounded-2xl shadow-2xl p-4 w-64 mb-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-sm">{t("radio.title")}</span>
              {isJoined && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-radio-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Background mode notice */}
          {isJoined && (
            <div className="text-[10px] text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 mb-3 text-center">
              {t("radio.backgroundActive", "Fon rejimi aktiv — minimizə etdikdə işləyir")}
            </div>
          )}

          {/* Speaking indicator */}
          {pttState.speakerId && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 text-xs font-medium ${
                iSpeaking
                  ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                  : "bg-green-500/15 text-green-700 dark:text-green-400"
              }`}
              data-testid="radio-speaking-indicator"
            >
              <Volume2 className="h-3.5 w-3.5 animate-pulse shrink-0" />
              <span>
                {iSpeaking
                  ? t("radio.youAreSpeaking")
                  : t("radio.isSpeaking", { name: pttState.speakerName })}
              </span>
            </div>
          )}

          {/* Channel busy */}
          {isChannelBusy && !pttState.speakerId && (
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl mb-3 bg-destructive/10 text-destructive text-xs"
              data-testid="radio-channel-busy"
            >
              <Radio className="h-3.5 w-3.5 shrink-0" />
              <span>{t("radio.channelBusy")}</span>
            </div>
          )}

          {/* Connect / Disconnect button */}
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
            {isConnecting
              ? t("radio.connecting")
              : isJoined
              ? t("radio.leaveChannel")
              : t("radio.joinChannel")}
          </button>

          {/* PTT button */}
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
                ? <><Mic className="h-4 w-4 animate-pulse" />{t("radio.youAreSpeaking")}</>
                : <><MicOff className="h-4 w-4" />{t("radio.holdToSpeak")}</>
              }
            </button>
          )}

          {/* User list */}
          {isJoined && (
            <div className="mt-3">
              <p className="text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" />
                {users.length > 0
                  ? t("radio.usersInChannel", { count: users.length })
                  : t("radio.noOtherUsers")}
              </p>
              {users.map(u => (
                <div
                  key={u.userId}
                  className="flex items-center gap-2 py-1 text-xs"
                  data-testid={`radio-user-${u.userId}`}
                >
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    pttState.speakerId === u.userId
                      ? "bg-green-500 animate-pulse"
                      : "bg-muted-foreground/40"
                  }`} />
                  <span className="font-medium truncate">{u.name}</span>
                  <span className="text-muted-foreground shrink-0">{roleLabel(u.role)}</span>
                </div>
              ))}
            </div>
          )}

          {micError && (
            <p className="text-xs text-destructive mt-2 text-center" data-testid="radio-mic-error">
              {micError}
            </p>
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
          title={t("radio.title")}
        >
          <Radio className="h-5 w-5" />
        </button>

        {isJoined && (
          <span
            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background"
            data-testid="radio-online-dot"
          />
        )}
        {someoneElseSpeaking && (
          <span className="absolute -bottom-1 -left-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        )}
      </div>
    </div>
  );
}

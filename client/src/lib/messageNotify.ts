const LS_SEEN = "pc_center_seen_messages_v2";

export type SeenMap = Record<string, string>; // conversationId -> lastMessageId

export function loadSeenMap(): SeenMap {
  try {
    const raw = localStorage.getItem(LS_SEEN);
    if (!raw) return {};
    return JSON.parse(raw) as SeenMap;
  } catch {
    return {};
  }
}

export function saveSeenMap(map: SeenMap) {
  localStorage.setItem(LS_SEEN, JSON.stringify(map));
}

export function markSeen(conversationId: string, messageId: string) {
  const map = loadSeenMap();
  if (!messageId) return;
  if (map[conversationId] === messageId) return;
  map[conversationId] = messageId;
  saveSeenMap(map);
}

let audioUnlocked = false;
export function unlockNotificationAudio() {
  audioUnlocked = true;
}

export async function playNotificationBeep() {
  try {
    if (!audioUnlocked) return;
    const AudioCtx = (window.AudioContext ?? (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.value = 880;

    g.gain.value = 0.001;
    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    o.start(now);
    o.stop(now + 0.24);

    window.setTimeout(() => ctx.close().catch(() => {}), 400);
  } catch {
    // ignore (autoplay policies, etc.)
  }
}


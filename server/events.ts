export type Event =
  | { type: 'USER_CONNECTED'; userId: string; name: string }
  | { type: 'USER_DISCONNECTED'; userId: string }
  | { type: 'LEASE_RENEWED'; userId: string }
  | { type: 'LEASE_EXPIRED'; userId: string }
  | { type: 'JOIN_QUEUE'; userId: string; name: string }
  | { type: 'LEAVE_QUEUE'; userId: string }
  | { type: 'DONE_TUNING'; userId: string }
  | { type: 'AUDIO_DATA'; userId: string; buffer: Buffer }

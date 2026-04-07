export type FriendStatus = "pending_sent" | "pending_received" | "accepted";

export interface Friend {
  uid: string;
  status: FriendStatus;
  displayName: string;
  username: string;
  level: number;
  player_class: string;
  created_at: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  username: string;
  level: number;
  player_class: string;
  created_at: Date;
}

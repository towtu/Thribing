export interface PlayerStats {
  hp: number;
  max_hp: number;
  xp: number;
  xp_to_next_level: number;
  level: number;
  gold: number;
}

export interface XpGain {
  amount: number;
  source: string;
}

export interface DamageEvent {
  amount: number;
  reason: string;
}

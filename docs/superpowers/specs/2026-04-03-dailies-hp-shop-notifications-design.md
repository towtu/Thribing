# Dailies HP Damage, Shop & Notifications — Design Spec
**Date:** 2026-04-03

## Overview
Three interconnected features: (1) HP damage at each daily's scheduled time with locking, (2) a gold-based Shop with heal potions, (3) local push notifications before scheduled dailies. All logic runs on-device (offline-first), syncing to Firebase when online.

## Data Model Changes

### Task (daily)
- `locked: boolean` — true when scheduled_time passed and daily was not completed
- `damage_dealt: boolean` — prevents double HP damage on repeated app opens
- `notification_ids: string[]` — IDs of the 3 scheduled local notifications (T-30, T-15, T-5)

### PlayerStats
- `gold_earned_today: number` — gold earned today (cap: 50), resets at midnight
- `gold_reset_date: string` — ISO date string to detect day change on app open
- `hp_max: number` — maximum HP ceiling for potion heals

### Potions
Hardcoded constants (not stored in Firestore):
| Potion | HP Restored | Gold Cost |
|---|---|---|
| Small | +20 HP | 10 gold |
| Medium | +50 HP | 25 gold |
| Large | +100 HP | 50 gold |

## Feature 1: HP Damage & Locking

**Trigger:** On app open and app foreground (AppState listener).

**Logic:** For each daily where `scheduled_time` has passed today AND `completed = false` AND `damage_dealt = false`:
1. Apply HP damage (Easy=2, Medium=5, Hard=10)
2. Set `locked = true`, `damage_dealt = true`
3. Write to Firestore (queued offline if no connection)
4. If HP reaches 0, trigger death mechanic

**Locked daily UI:**
- TaskCard shows padlock icon, greyed checkbox
- Gold unlock button: Easy=5g, Medium=10g, Hard=20g
- Tapping deducts gold and sets `locked = false` (then user can check normally)
- "Not enough gold" message if insufficient funds

**Midnight reset:** `resetDailyCounts` also resets `locked = false` and `damage_dealt = false`.

## Feature 2: HP Death Mechanic

When HP reaches 0:
1. Subtract 5 levels (minimum level 1), XP resets to 0
2. Lose 50% of current gold (rounded down)
3. HP set to 20 (prevent infinite death loop)
4. Show death modal displaying levels lost and gold lost

## Feature 3: Shop & Potions

**New Shop tab** in bottom navigation.

**Shop screen:**
- Header showing current gold balance (live)
- 3 potion cards (Small / Medium / Large)
- Buy button greyed out if unaffordable
- Instant purchase (no confirmation modal) — HP capped at `hp_max`

## Feature 4: Daily Gold Cap (50/day)

- On app open: if `gold_reset_date` ≠ today, reset `gold_earned_today = 0` and update `gold_reset_date`
- On task completion: give min(reward.gold, 50 - gold_earned_today) gold; always give full XP
- Gold spent (shop, unlock) does NOT count toward cap
- Dashboard shows `X / 50 gold today` indicator

## Feature 5: Notifications

**Package:** `expo-notifications` (local, offline-capable).

**Schedule:** On daily create/edit with scheduled_time → 3 notifications per day:
- T-30: "Brush teeth in 30 minutes — don't lose HP!"
- T-15: "15 minutes left for Brush teeth!"
- T-5: "⚠️ Brush teeth in 5 minutes or take damage!"

**Cancel:** On daily delete, completion before time, or day change.

**On app open:** Reschedule all active dailies' notifications (handles reinstalls).

**Edge cases:**
- If all 3 times already past → skip all
- If some past → only schedule future ones
- Notifications repeat daily matching `scheduled_days`

## Files Changed / Created

**New:**
- `features/notifications/service.ts` — schedule/cancel notifications
- `features/shop/types.ts` — potion constants
- `app/(app)/(tabs)/shop.tsx` — Shop screen
- `features/gamification/components/DeathModal.tsx` — death screen

**Modified:**
- `features/gamification/engine.ts` — add processHpDeath, applyGoldCap
- `features/gamification/services.ts` — add applyDamageAndLock, buyPotion
- `features/tasks/services.ts` — add lockDaily, resetDailyLocks
- `features/tasks/types.ts` — add locked, damage_dealt, notification_ids
- `features/gamification/types.ts` — add gold_earned_today, gold_reset_date, hp_max
- `features/tasks/components/TaskCard.tsx` — locked state UI
- `app/(app)/(tabs)/_layout.tsx` — add Shop tab
- `app/(app)/_layout.tsx` — add AppState damage check hook
- `app/(app)/(tabs)/index.tsx` — gold cap indicator

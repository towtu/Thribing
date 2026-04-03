import * as Notifications from "expo-notifications";
import type { Task } from "@/features/tasks/types";

// Show alerts when notifications arrive while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Parse "HH:MM" into { hour, minute } */
function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h, minute: m };
}

/** Subtract `mins` minutes from a time; returns new { hour, minute } */
function subtractMinutes(
  hour: number,
  minute: number,
  mins: number
): { hour: number; minute: number } {
  const total = hour * 60 + minute - mins;
  const h = Math.floor(((total / 60) % 24 + 24) % 24);
  const m = ((total % 60) + 60) % 60;
  return { hour: h, minute: m };
}

/** scheduled_days: 0=Sun…6=Sat → expo weekday: 1=Sun…7=Sat */
function toExpoWeekday(day: number): number {
  return day + 1;
}

const REMINDERS = [
  { mins: 30, template: (title: string) => `${title} in 30 minutes — don't lose HP!` },
  { mins: 15, template: (title: string) => `15 minutes left for ${title}!` },
  { mins: 5,  template: (title: string) => `⚠️ ${title} in 5 minutes or take damage!` },
];

/**
 * Schedule up to 3 notifications per scheduled_day for a daily.
 * Skips times already past today.
 * Returns all scheduled notification IDs.
 */
export async function scheduleNotificationsForDaily(
  title: string,
  scheduledTime: string,
  scheduledDays: number[]
): Promise<string[]> {
  const granted = await requestNotificationPermissions();
  if (!granted) return [];

  const { hour, minute } = parseTime(scheduledTime);
  const ids: string[] = [];

  for (const day of scheduledDays) {
    for (const reminder of REMINDERS) {
      const { hour: rh, minute: rm } = subtractMinutes(hour, minute, reminder.mins);

      // Skip if this reminder time is already past today
      const now = new Date();
      if (now.getDay() === day) {
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (rh * 60 + rm <= nowMins) continue;
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "🗡️ ThriBing",
            body: reminder.template(title),
          },
          trigger: {
            weekday: toExpoWeekday(day),
            hour: rh,
            minute: rm,
            repeats: true,
          } as any,
        });
        ids.push(id);
      } catch (e) {
        console.warn("Failed to schedule notification:", e);
      }
    }
  }

  return ids;
}

/** Cancel a list of notification IDs. */
export async function cancelNotifications(ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn("Failed to cancel notification:", e);
    }
  }
}

/**
 * On app open: cancel all old notification IDs stored on dailies,
 * then reschedule from scratch. Handles reinstalls/permission changes.
 * Returns map of taskId → new notification_ids.
 */
export async function rescheduleAllDailies(
  dailies: Task[]
): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};

  for (const daily of dailies) {
    if (!daily.scheduled_time) continue;

    if (daily.notification_ids?.length) {
      await cancelNotifications(daily.notification_ids);
    }

    const ids = await scheduleNotificationsForDaily(
      daily.title,
      daily.scheduled_time,
      daily.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6]
    );

    result[daily.id] = ids;
  }

  return result;
}

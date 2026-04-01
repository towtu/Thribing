export interface TaskReminder {
  task_id: string;
  title: string;
  scheduled_time: Date;
  notification_id?: string;
}

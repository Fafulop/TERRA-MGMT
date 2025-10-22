import pool from '../config/database';
import { format, isAfter, isBefore, addDays, startOfDay, endOfDay } from 'date-fns';

interface NotificationData {
  user_id: number;
  task_id: number;
  type: 'deadline_approaching' | 'deadline_today' | 'overdue' | 'new_task' | 'status_change';
  title: string;
  message: string;
}

// Check if notification already exists to avoid duplicates
async function notificationExists(userId: number, taskId: number, type: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM notifications
     WHERE user_id = $1 AND task_id = $2 AND type = $3 AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId, taskId, type]
  );
  return result.rows.length > 0;
}

// Create notification in database
async function createNotification(data: NotificationData): Promise<void> {
  try {
    // Check if notification already exists
    const exists = await notificationExists(data.user_id, data.task_id, data.type);
    if (exists) {
      console.log(`Notification already exists for user ${data.user_id}, task ${data.task_id}, type ${data.type}`);
      return;
    }

    await pool.query(
      `INSERT INTO notifications (user_id, task_id, type, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [data.user_id, data.task_id, data.type, data.title, data.message]
    );
    console.log(`Created notification: ${data.type} for user ${data.user_id}, task ${data.task_id}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Get user preferences
async function getUserPreferences(userId: number) {
  const result = await pool.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );

  // Return default preferences if none exist
  if (result.rows.length === 0) {
    return {
      deadline_approaching: true,
      deadline_today: true,
      overdue: true,
      new_task: true,
      status_change: true,
      days_before_deadline: 3
    };
  }

  return result.rows[0];
}

// Check for approaching deadlines
export async function checkDeadlineNotifications(): Promise<void> {
  try {
    console.log('Running deadline notification check...');

    // Get all tasks with due dates that are not completed
    const tasksResult = await pool.query(
      `SELECT
        t.id,
        t.title,
        t.due_date,
        t.status,
        t.user_id,
        u.username
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.due_date IS NOT NULL
       AND t.status != 'completed'
       ORDER BY t.due_date ASC`
    );

    const tasks = tasksResult.rows;
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    console.log(`Found ${tasks.length} tasks with due dates (not completed)`);

    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const preferences = await getUserPreferences(task.user_id);

      // Check if task is overdue
      if (isBefore(dueDate, today) && preferences.overdue) {
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        await createNotification({
          user_id: task.user_id,
          task_id: task.id,
          type: 'overdue',
          title: 'Task Overdue',
          message: `Task "${task.title}" is ${daysOverdue} day(s) overdue. Due date was ${format(dueDate, 'MMM dd, yyyy')}.`
        });
      }
      // Check if task is due today
      else if (dueDate >= today && dueDate <= todayEnd && preferences.deadline_today) {
        await createNotification({
          user_id: task.user_id,
          task_id: task.id,
          type: 'deadline_today',
          title: 'Task Due Today',
          message: `Task "${task.title}" is due today at ${format(dueDate, 'h:mm a')}.`
        });
      }
      // Check if task is approaching deadline
      else if (preferences.deadline_approaching) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysBeforeDeadline = preferences.days_before_deadline || 3;

        if (daysUntilDue > 0 && daysUntilDue <= daysBeforeDeadline) {
          await createNotification({
            user_id: task.user_id,
            task_id: task.id,
            type: 'deadline_approaching',
            title: 'Deadline Approaching',
            message: `Task "${task.title}" is due in ${daysUntilDue} day(s) on ${format(dueDate, 'MMM dd, yyyy')}.`
          });
        }
      }
    }

    // Also check personal tasks
    const personalTasksResult = await pool.query(
      `SELECT
        pt.id,
        pt.title,
        pt.due_date,
        pt.status,
        pt.user_id,
        u.username
       FROM personal_tasks pt
       JOIN users u ON pt.user_id = u.id
       WHERE pt.due_date IS NOT NULL
       AND pt.status != 'completed'
       ORDER BY pt.due_date ASC`
    );

    const personalTasks = personalTasksResult.rows;
    console.log(`Found ${personalTasks.length} personal tasks with due dates (not completed)`);

    for (const task of personalTasks) {
      const dueDate = new Date(task.due_date);
      const preferences = await getUserPreferences(task.user_id);

      // Check if task is overdue
      if (isBefore(dueDate, today) && preferences.overdue) {
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        await createNotification({
          user_id: task.user_id,
          task_id: task.id,
          type: 'overdue',
          title: 'Personal Task Overdue',
          message: `Personal task "${task.title}" is ${daysOverdue} day(s) overdue. Due date was ${format(dueDate, 'MMM dd, yyyy')}.`
        });
      }
      // Check if task is due today
      else if (dueDate >= today && dueDate <= todayEnd && preferences.deadline_today) {
        await createNotification({
          user_id: task.user_id,
          task_id: task.id,
          type: 'deadline_today',
          title: 'Personal Task Due Today',
          message: `Personal task "${task.title}" is due today at ${format(dueDate, 'h:mm a')}.`
        });
      }
      // Check if task is approaching deadline
      else if (preferences.deadline_approaching) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const daysBeforeDeadline = preferences.days_before_deadline || 3;

        if (daysUntilDue > 0 && daysUntilDue <= daysBeforeDeadline) {
          await createNotification({
            user_id: task.user_id,
            task_id: task.id,
            type: 'deadline_approaching',
            title: 'Personal Task Deadline Approaching',
            message: `Personal task "${task.title}" is due in ${daysUntilDue} day(s) on ${format(dueDate, 'MMM dd, yyyy')}.`
          });
        }
      }
    }

    console.log('Deadline notification check completed');
  } catch (error) {
    console.error('Error checking deadline notifications:', error);
  }
}

// Notify all users about a new shared task
export async function notifyNewTask(taskId: number, creatorId: number): Promise<void> {
  try {
    // Get task details
    const taskResult = await pool.query(
      'SELECT id, title, due_date FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return;
    }

    const task = taskResult.rows[0];

    // Get all users except the creator who have new_task notifications enabled
    const usersResult = await pool.query(
      `SELECT DISTINCT u.id, u.username
       FROM users u
       LEFT JOIN notification_preferences np ON u.id = np.user_id
       WHERE u.id != $1
       AND (np.new_task IS NULL OR np.new_task = true)`,
      [creatorId]
    );

    const users = usersResult.rows;

    for (const user of users) {
      const dueInfo = task.due_date
        ? ` (Due: ${format(new Date(task.due_date), 'MMM dd, yyyy')})`
        : '';

      await createNotification({
        user_id: user.id,
        task_id: task.id,
        type: 'new_task',
        title: 'New Task Created',
        message: `A new task "${task.title}" has been created${dueInfo}.`
      });
    }

    console.log(`Notified ${users.length} users about new task: ${task.title}`);
  } catch (error) {
    console.error('Error notifying about new task:', error);
  }
}

// Notify about task status change
export async function notifyTaskStatusChange(
  taskId: number,
  oldStatus: string,
  newStatus: string,
  updatedBy: number
): Promise<void> {
  try {
    // Get task details
    const taskResult = await pool.query(
      'SELECT id, title, user_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return;
    }

    const task = taskResult.rows[0];

    // Notify task owner if they didn't make the change
    if (task.user_id !== updatedBy) {
      const preferences = await getUserPreferences(task.user_id);

      if (preferences.status_change) {
        await createNotification({
          user_id: task.user_id,
          task_id: task.id,
          type: 'status_change',
          title: 'Task Status Changed',
          message: `Status of task "${task.title}" changed from "${oldStatus}" to "${newStatus}".`
        });
      }
    }

    console.log(`Notified about status change for task: ${task.title}`);
  } catch (error) {
    console.error('Error notifying about status change:', error);
  }
}

// Clean up old read notifications (older than 30 days)
export async function cleanupOldNotifications(): Promise<void> {
  try {
    console.log('Cleaning up old notifications...');

    const result = await pool.query(
      `DELETE FROM notifications
       WHERE is_read = true
       AND created_at < NOW() - INTERVAL '30 days'`
    );

    console.log(`Deleted ${result.rowCount} old read notifications`);
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
  }
}

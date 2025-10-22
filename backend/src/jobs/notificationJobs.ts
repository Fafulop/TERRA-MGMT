import cron from 'node-cron';
import { checkDeadlineNotifications, cleanupOldNotifications } from '../services/notificationService';

// Schedule deadline notification check - runs daily at 6:00 AM
export const scheduleDeadlineCheck = () => {
  // Cron format: minute hour day month weekday
  // 0 6 * * * = At 6:00 AM every day
  const job = cron.schedule('0 6 * * *', async () => {
    console.log('[Cron] Running deadline notification check at', new Date().toISOString());
    try {
      await checkDeadlineNotifications();
      console.log('[Cron] Deadline notification check completed');
    } catch (error) {
      console.error('[Cron] Error in deadline notification check:', error);
    }
  }, {
    timezone: 'America/New_York' // Adjust to your timezone
  });

  console.log('[Cron] Deadline notification check scheduled for 6:00 AM daily');
  return job;
};

// Schedule cleanup of old notifications - runs daily at 2:00 AM
export const scheduleNotificationCleanup = () => {
  // 0 2 * * * = At 2:00 AM every day
  const job = cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Running notification cleanup at', new Date().toISOString());
    try {
      await cleanupOldNotifications();
      console.log('[Cron] Notification cleanup completed');
    } catch (error) {
      console.error('[Cron] Error in notification cleanup:', error);
    }
  }, {
    timezone: 'America/New_York' // Adjust to your timezone
  });

  console.log('[Cron] Notification cleanup scheduled for 2:00 AM daily');
  return job;
};

// For development: run notification check every 5 minutes
export const scheduleFrequentDeadlineCheck = () => {
  // */5 * * * * = Every 5 minutes
  const job = cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Running frequent deadline check at', new Date().toISOString());
    try {
      await checkDeadlineNotifications();
      console.log('[Cron] Frequent deadline check completed');
    } catch (error) {
      console.error('[Cron] Error in frequent deadline check:', error);
    }
  }, {
    timezone: 'America/New_York' // Adjust to your timezone
  });

  console.log('[Cron] Frequent deadline notification check scheduled for every 5 minutes (DEV MODE)');
  return job;
};

// Initialize all cron jobs
export const initializeNotificationJobs = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, run checks more frequently for testing
    console.log('[Cron] Initializing notification jobs in DEVELOPMENT mode');
    scheduleFrequentDeadlineCheck();
  } else {
    // In production, run checks once daily
    console.log('[Cron] Initializing notification jobs in PRODUCTION mode');
    scheduleDeadlineCheck();
  }

  // Always schedule cleanup (runs at night regardless of environment)
  scheduleNotificationCleanup();

  console.log('[Cron] All notification jobs initialized successfully');
};

import cron from 'node-cron';
import logger from '../utils/logger.js';

export const startScheduledJobs = () => {
  logger.info('Starting scheduled jobs...');

  // Risk recalculation job - runs daily at 2 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('Running risk recalculation job...');
    // TODO: Implement risk recalculation logic
  });

  // Report generation job - runs weekly on Monday at 8 AM
  cron.schedule('0 8 * * 1', () => {
    logger.info('Running weekly report generation job...');
    // TODO: Implement report generation logic
  });

  logger.info('Scheduled jobs initialized successfully');
};

export default { startScheduledJobs };
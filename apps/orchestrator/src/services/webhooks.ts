import axios from 'axios';
import { logger } from '../lib/logger';

export async function emitWebhook(
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (!webhookUrl) {
    logger.debug({ event, data }, 'No webhook URL configured, skipping webhook');
    return;
  }
  
  try {
    await axios.post(webhookUrl, {
      event,
      data,
      timestamp: new Date().toISOString(),
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'media-analyzer-orchestrator/1.0.0',
      },
    });
    
    logger.info({ event, webhookUrl }, 'Webhook sent successfully');
    
  } catch (error) {
    logger.error({
      event,
      webhookUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Failed to send webhook');
  }
}

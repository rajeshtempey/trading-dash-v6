// server/alerts/alert-manager.ts
// 100% FREE Alert & Notification System
// Browser notifications + Telegram bot integration

export type AlertType = 'PRICE_CROSS' | 'INDICATOR_CROSS' | 'PATTERN_DETECTED' | 
                        'SUPPORT_RESISTANCE' | 'VOLUME_SPIKE' | 'TREND_CHANGE';

export type AlertChannel = 'BROWSER' | 'TELEGRAM';

export type ComparisonOperator = '>' | '<' | '==' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';

export interface AlertCondition {
  indicator?: string;           // e.g., 'RSI', 'MACD', 'ADX'
  comparison: ComparisonOperator;
  value: number;
  timeframe: string;            // e.g., '5m', '1h'
  lookback?: number;            // candles to check
}

export interface PriceAlert {
  id: string;
  asset: string;
  type: AlertType;
  name: string;                 // User-friendly name
  condition: AlertCondition;
  message: string;              // Message template
  channels: AlertChannel[];     // Where to send notification
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number;
  triggerCount: number;         // How many times triggered
  soundEnabled: boolean;
  repeatInterval?: number;      // Minutes between repeats (0 = once)
}

export interface AlertHistory {
  alertId: string;
  timestamp: number;
  price: number;
  message: string;
}

export class FreeAlertManager {
  private alerts: Map<string, PriceAlert> = new Map();
  private history: AlertHistory[] = [];
  private maxHistory: number = 1000;
  private lastTriggered: Map<string, number> = new Map();

  /**
   * Create a new price alert
   */
  createAlert(
    asset: string,
    type: AlertType,
    condition: AlertCondition,
    channels: AlertChannel[] = ['BROWSER']
  ): PriceAlert {
    const id = this.generateId();
    const alert: PriceAlert = {
      id,
      asset,
      type,
      name: `${asset} ${type}`,
      condition,
      message: `Alert: ${asset} ${condition.comparison} ${condition.value}`,
      channels,
      enabled: true,
      createdAt: Date.now(),
      triggerCount: 0,
      soundEnabled: true
    };

    this.alerts.set(id, alert);
    return alert;
  }

  /**
   * Enable/disable an alert
   */
  toggleAlert(alertId: string, enabled: boolean): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.enabled = enabled;
    return true;
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Check if any alerts should trigger
   */
  async checkAlerts(
    asset: string,
    currentPrice: number,
    indicators: Record<string, number>,
    patternDetected?: string
  ): Promise<PriceAlert[]> {
    const triggeredAlerts: PriceAlert[] = [];

    this.alerts.forEach((alert) => {
      if (!alert.enabled || alert.asset !== asset) return;

      // Check repeat interval
      const lastTrigger = this.lastTriggered.get(alert.id) || 0;
      const repeatInterval = (alert.repeatInterval || 0) * 60 * 1000;
      
      if (Date.now() - lastTrigger < repeatInterval && alert.triggerCount > 0) {
        return;  // Still in repeat cooldown
      }

      let triggered = false;

      if (alert.type === 'PRICE_CROSS') {
        triggered = this.checkPriceCross(currentPrice, alert.condition);
      } else if (alert.type === 'INDICATOR_CROSS') {
        triggered = this.checkIndicatorCross(indicators, alert.condition);
      } else if (alert.type === 'PATTERN_DETECTED') {
        triggered = !!patternDetected;
      }

      if (triggered) {
        alert.triggerCount++;
        alert.triggeredAt = Date.now();
        this.lastTriggered.set(alert.id, Date.now());
        triggeredAlerts.push(alert);

        // Add to history
        this.addToHistory(alert, currentPrice);
      }
    });

    return triggeredAlerts;
  }

  /**
   * Process triggered alerts (send notifications)
   */
  async processTriggers(alerts: PriceAlert[]): Promise<void> {
    for (const alert of alerts) {
      for (const channel of alert.channels) {
        try {
          if (channel === 'BROWSER') {
            this.sendBrowserNotification(alert);
          } else if (channel === 'TELEGRAM') {
            await this.sendTelegramNotification(alert);
          }
        } catch (error) {
          console.error(`Failed to send ${channel} notification:`, error);
        }
      }
    }
  }

  /**
   * Browser notification (FREE - uses Notification API)
   */
  private sendBrowserNotification(alert: PriceAlert): void {
    const notification = {
      type: 'PRICE_ALERT',
      id: alert.id,
      title: `🚨 ${alert.asset} Alert`,
      message: alert.message,
      timestamp: Date.now(),
      asset: alert.asset
    };

    // Emit through socket.io to client
    console.log('Browser notification:', notification);
  }

  /**
   * Telegram notification (FREE - Telegram Bot API)
   */
  private async sendTelegramNotification(alert: PriceAlert): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('Telegram credentials not configured');
      return;
    }

    const message = `
🚨 *${alert.asset} ALERT*
📊 Type: ${alert.type}
💬 ${alert.message}
⏰ ${new Date().toLocaleTimeString()}
    `.trim();

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Telegram notification failed:', error);
      throw error;
    }
  }

  /**
   * Check price condition
   */
  private checkPriceCross(currentPrice: number, condition: AlertCondition): boolean {
    switch (condition.comparison) {
      case '>':
        return currentPrice > condition.value;
      case '<':
        return currentPrice < condition.value;
      case '==':
        return Math.abs(currentPrice - condition.value) < 0.01;
      default:
        return false;
    }
  }

  /**
   * Check indicator condition
   */
  private checkIndicatorCross(
    indicators: Record<string, number>,
    condition: AlertCondition
  ): boolean {
    if (!condition.indicator || !indicators[condition.indicator]) {
      return false;
    }

    const value = indicators[condition.indicator];

    switch (condition.comparison) {
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '==':
        return Math.abs(value - condition.value) < 0.1;
      case 'CROSSES_ABOVE':
        // Would need previous value for this
        return value > condition.value;
      case 'CROSSES_BELOW':
        return value < condition.value;
      default:
        return false;
    }
  }

  /**
   * Get all alerts for an asset
   */
  getAlerts(asset?: string): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(a =>
      !asset || a.asset === asset
    );
  }

  /**
   * Get alert history
   */
  getHistory(limit: number = 100): AlertHistory[] {
    return this.history.slice(-limit);
  }

  /**
   * Clear old history
   */
  private addToHistory(alert: PriceAlert, price: number): void {
    this.history.push({
      alertId: alert.id,
      timestamp: Date.now(),
      price,
      message: alert.message
    });

    // Keep max size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Create pre-configured alerts
   */
  createStandardAlerts(asset: string): PriceAlert[] {
    const alerts: PriceAlert[] = [];

    // RSI Overbought/Oversold
    alerts.push(this.createAlert(
      asset,
      'INDICATOR_CROSS',
      { indicator: 'RSI', comparison: '>', value: 70, timeframe: '1h' },
      ['BROWSER']
    ));

    // ADX Trend Start
    alerts.push(this.createAlert(
      asset,
      'INDICATOR_CROSS',
      { indicator: 'ADX', comparison: '>', value: 25, timeframe: '1h' },
      ['BROWSER', 'TELEGRAM']
    ));

    // Price Support/Resistance (example)
    // These would be customized per asset

    return alerts;
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const alertManager = new FreeAlertManager();

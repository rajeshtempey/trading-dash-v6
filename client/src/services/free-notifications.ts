// client/src/services/free-notifications.ts
// 100% FREE Browser Notification Service
// Uses Notification API + Socket.io + Audio

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  sound?: string;
}

export interface AlertNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
  timestamp: number;
  alertId?: string;
  asset?: string;
  priority: 'low' | 'medium' | 'high';
}

export class FreeNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission;
  private soundQueue: HTMLAudioElement[] = [];
  private notificationQueue: AlertNotification[] = [];

  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  /**
   * Request permission for notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(options: AlertNotification): Promise<void> {
    if (!this.isEnabled()) {
      console.warn('Notifications not enabled');
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      badge: options.badge || '/badge.png',
      tag: options.tag || 'price-alert',
      requireInteraction: options.priority === 'high',
      data: {
        ...options.data,
        timestamp: options.timestamp,
        priority: options.priority
      }
    } as any);

    // Play sound
    this.playNotificationSound(options.priority);

    // Add interaction handlers
    notification.onclick = () => {
      window.focus();
      this.handleNotificationClick(options);
      notification.close();
    };

    notification.onclose = () => {
      this.removeFromQueue(options);
    };

    // Auto-close after 8 seconds (unless high priority)
    if (options.priority !== 'high') {
      setTimeout(() => notification.close(), 8000);
    }

    // Add to queue
    this.notificationQueue.push(options);
  }

  /**
   * Send trade signal notification
   */
  async sendTradeSignal(
    asset: string,
    signal: 'BUY' | 'SELL' | 'CLOSE',
    price: number,
    confidence: number
  ): Promise<void> {
    const emoji = signal === 'BUY' ? '📈' : signal === 'SELL' ? '📉' : '🔚';
    const color = signal === 'BUY' ? 'GREEN' : signal === 'SELL' ? 'RED' : 'GRAY';

    await this.sendPriceAlert({
      title: `${emoji} ${signal} Signal - ${asset}`,
      body: `Price: $${price.toFixed(2)}\nConfidence: ${(confidence * 100).toFixed(0)}%`,
      priority: confidence > 0.8 ? 'high' : 'medium',
      icon: `/signals/${signal.toLowerCase()}.png`,
      timestamp: Date.now(),
      asset,
      data: {
        type: 'TRADE_SIGNAL',
        signal,
        asset,
        price,
        confidence
      }
    });
  }

  /**
   * Send pattern detection notification
   */
  async sendPatternAlert(
    asset: string,
    pattern: string,
    confidence: number,
    direction: 'BULLISH' | 'BEARISH'
  ): Promise<void> {
    const directionEmoji = direction === 'BULLISH' ? '📈' : '📉';

    await this.sendPriceAlert({
      title: `🎯 ${pattern} Detected`,
      body: `${asset} - ${direction}\nConfidence: ${(confidence * 100).toFixed(0)}%`,
      priority: confidence > 0.75 ? 'high' : 'medium',
      timestamp: Date.now(),
      asset,
      data: {
        type: 'PATTERN_DETECTED',
        pattern,
        asset,
        direction,
        confidence
      }
    });
  }

  /**
   * Send indicator alert
   */
  async sendIndicatorAlert(
    asset: string,
    indicator: string,
    value: number,
    threshold: number,
    type: 'OVERBOUGHT' | 'OVERSOLD' | 'CROSSOVER'
  ): Promise<void> {
    const emoji = type === 'OVERBOUGHT' ? '⚡' : type === 'OVERSOLD' ? '❄️' : '🔄';

    await this.sendPriceAlert({
      title: `${emoji} ${indicator} ${type}`,
      body: `${asset}\nValue: ${value.toFixed(2)} (Threshold: ${threshold.toFixed(2)})`,
      priority: 'high',
      timestamp: Date.now(),
      asset,
      data: {
        type: 'INDICATOR_ALERT',
        indicator,
        value,
        threshold
      }
    });
  }

  /**
   * Send error/warning notification
   */
  async sendWarning(title: string, message: string): Promise<void> {
    await this.sendPriceAlert({
      title: `⚠️ ${title}`,
      body: message,
      priority: 'high',
      timestamp: Date.now(),
      data: { type: 'WARNING' }
    });
  }

  /**
   * Play notification sound (FREE - no external API needed)
   */
  private playNotificationSound(priority: 'low' | 'medium' | 'high'): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create simple beep using oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies based on priority
      if (priority === 'high') {
        // Double beep for high priority
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);

        // Second beep
        const osc2 = audioContext.createOscillator();
        osc2.connect(gainNode);
        osc2.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
        osc2.start(audioContext.currentTime + 0.2);
        osc2.stop(audioContext.currentTime + 0.35);
      } else if (priority === 'medium') {
        // Single beep for medium
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else {
        // Soft ping for low
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(notification: AlertNotification): void {
    // Can be overridden to navigate to asset or trade
    const event = new CustomEvent('notificationClicked', { detail: notification });
    window.dispatchEvent(event);
  }

  /**
   * Get notification queue
   */
  getQueue(): AlertNotification[] {
    return [...this.notificationQueue];
  }

  /**
   * Remove from queue
   */
  private removeFromQueue(notification: AlertNotification): void {
    const index = this.notificationQueue.findIndex(
      n => n.timestamp === notification.timestamp
    );
    if (index > -1) {
      this.notificationQueue.splice(index, 1);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    // Close all active notifications
    const notifications = await (navigator as any).serviceWorkerContainer?.controller
      ?.postMessage({ type: 'CLOSE_ALL_NOTIFICATIONS' });
    
    this.notificationQueue = [];
  }

  /**
   * Get notification stats
   */
  getStats(): Record<string, any> {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isEnabled: this.isEnabled(),
      queueSize: this.notificationQueue.length,
      totalSent: this.notificationQueue.length  // Simplified
    };
  }
}

// Export singleton
export const notificationService = new FreeNotificationService();

// Setup socket.io listener for server-sent alerts
export function setupNotificationListeners(socket: any): void {
  socket.on('alert_triggered', async (alert: any) => {
    await notificationService.sendPriceAlert({
      title: alert.title || '🚨 Alert',
      body: alert.message,
      priority: alert.priority || 'high',
      timestamp: Date.now(),
      asset: alert.asset,
      data: alert
    });
  });

  socket.on('signal_generated', async (signal: any) => {
    await notificationService.sendTradeSignal(
      signal.asset,
      signal.direction as 'BUY' | 'SELL' | 'CLOSE',
      signal.price,
      signal.confidence
    );
  });

  socket.on('pattern_detected', async (pattern: any) => {
    await notificationService.sendPatternAlert(
      pattern.asset,
      pattern.pattern,
      pattern.confidence,
      pattern.direction
    );
  });
}

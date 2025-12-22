// client/src/tools/fibonacci.ts
// 100% FREE Fibonacci Trading Tools
// Golden Ratio: 0.618, 0.382, 0.236, etc.

export interface FibLevel {
  level: number;           // 0-2.618
  price: number;           // Actual price level
  percentage: number;      // Displayed as %
  label: string;           // e.g. "61.8%"
  color: string;           // Level-specific color
}

export interface FibonacciDrawing {
  id: string;
  type: 'RETRACEMENT' | 'EXTENSION' | 'EXPANSION';
  highPrice: number;
  lowPrice: number;
  levels: FibLevel[];
  created: number;
}

export class FibonacciRetracementTool {
  readonly levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
  readonly colors: Record<number, string> = {
    0: '#787B86',      // Gray
    0.236: '#1f77d2',  // Blue
    0.382: '#2962FF',  // Indigo
    0.5: '#F23645',    // Red (50% = psychological level)
    0.618: '#089981',  // Green (Golden Ratio)
    0.786: '#FF9800',  // Orange
    1.0: '#787B86'     // Gray
  };

  /**
   * Draw Fibonacci Retracement levels
   * Used to find support/resistance in uptrends and downtrends
   */
  draw(highPrice: number, lowPrice: number): FibLevel[] {
    const levels: FibLevel[] = [];
    const priceRange = highPrice - lowPrice;
    const isUptrend = highPrice > lowPrice;

    this.levels.forEach(level => {
      let price: number;

      if (isUptrend) {
        // In uptrend: retrace from top
        price = highPrice - (priceRange * level);
      } else {
        // In downtrend: retrace from bottom
        price = lowPrice + (priceRange * level);
      }

      levels.push({
        level,
        price,
        percentage: level * 100,
        label: level === 0 ? 'Top' : level === 1.0 ? 'Bottom' : `${(level * 100).toFixed(1)}%`,
        color: this.colors[level as keyof typeof this.colors] || '#2962FF'
      });
    });

    return levels;
  }

  /**
   * Detect if price bounced off a Fibonacci level
   */
  detectBounce(currentPrice: number, fibLevel: FibLevel, tolerance: number = 0.002): boolean {
    const touchedLevel = Math.abs(currentPrice - fibLevel.price) / fibLevel.price < tolerance;
    return touchedLevel;
  }

  /**
   * Get nearest Fibonacci level to current price
   */
  getNearestLevel(currentPrice: number, levels: FibLevel[]): FibLevel | null {
    if (levels.length === 0) return null;

    return levels.reduce((nearest, current) => {
      const currentDistance = Math.abs(current.price - currentPrice);
      const nearestDistance = Math.abs(nearest.price - currentPrice);
      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  /**
   * Calculate probability of reaching next level
   */
  calculateTargetProbability(currentPrice: number, levels: FibLevel[], direction: 'UP' | 'DOWN'): number {
    const nextLevel = this.getNextLevel(currentPrice, levels, direction);
    if (!nextLevel) return 0;

    const distance = Math.abs(nextLevel.price - currentPrice);
    const totalRange = Math.abs(levels[levels.length - 1].price - levels[0].price);

    // Fibonacci levels become more significant at major ratios
    const significanceBonus = [0.618, 0.5, 0.382].includes(nextLevel.level) ? 1.15 : 1.0;
    
    return Math.min(100, (distance / totalRange) * 100 * significanceBonus);
  }

  private getNextLevel(currentPrice: number, levels: FibLevel[], direction: 'UP' | 'DOWN'): FibLevel | null {
    if (direction === 'UP') {
      return levels.find(l => l.price > currentPrice) || null;
    } else {
      const reversed = [...levels].reverse();
      return reversed.find(l => l.price < currentPrice) || null;
    }
  }
}

export class FibonacciExtensionTool {
  readonly extensionLevels = [1.272, 1.414, 1.618, 2.0, 2.618, 4.236];
  readonly colors: Record<number, string> = {
    1.272: '#4ECDC4',
    1.414: '#44AF69',
    1.618: '#089981',  // Golden Ratio (most important)
    2.0: '#FF6B6B',
    2.618: '#FFB000',
    4.236: '#FF3D00'
  };

  /**
   * Draw Fibonacci Extension levels
   * Used to find profit targets after breakout
   * swing1 = start of move, swing2 = end of pullback, swing3 = current position
   */
  draw(swing1Price: number, swing2Price: number, swing3Price: number): FibLevel[] {
    const levels: FibLevel[] = [];
    const priceRange = swing2Price - swing1Price;

    this.extensionLevels.forEach(level => {
      const targetPrice = swing3Price + (priceRange * (level - 1));

      levels.push({
        level,
        price: targetPrice,
        percentage: level * 100,
        label: `${(level * 100).toFixed(1)}%`,
        color: this.colors[level as keyof typeof this.colors] || '#2962FF'
      });
    });

    return levels;
  }

  /**
   * Identify optimal entry points using extensions
   */
  findEntrySignals(currentPrice: number, levels: FibLevel[]): FibLevel[] {
    const significantLevels = [1.618, 2.0, 2.618];
    return levels.filter(l => significantLevels.includes(l.level));
  }

  /**
   * Calculate risk/reward ratio for target
   */
  calculateRiskReward(entryPrice: number, stopLoss: number, targetLevel: FibLevel): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(targetLevel.price - entryPrice);
    return risk === 0 ? 0 : reward / risk;
  }
}

export class FibonacciExpansionTool {
  /**
   * Fibonacci Expansion - projects continuation of a move
   * Used when trend continues beyond previous highs/lows
   */
  draw(point1Price: number, point2Price: number, point3Price: number): FibLevel[] {
    const levels: FibLevel[] = [];
    const swing1 = point2Price - point1Price;
    const swing2 = point3Price - point2Price;

    // Calculate expansion levels
    const expansionLevels = [1.618, 2.618, 4.236, 6.854];

    expansionLevels.forEach(level => {
      const projectedPrice = point3Price + (swing2 * level);

      levels.push({
        level,
        price: projectedPrice,
        percentage: level * 100,
        label: `${(level * 100).toFixed(1)}%`,
        color: this.getExpansionColor(level)
      });
    });

    return levels;
  }

  private getExpansionColor(level: number): string {
    if (level === 1.618) return '#089981';  // Most important
    if (level === 2.618) return '#FF6B6B';
    if (level === 4.236) return '#FF9800';
    return '#2962FF';
  }
}

/**
 * Advanced Fibonacci Strategy Helper
 */
export class FibonacciStrategyHelper {
  /**
   * Multi-level confirmation - signal stronger when multiple levels align
   */
  checkMultipleLevelConfirmation(
    price: number,
    retracementLevels: FibLevel[],
    extensionLevels: FibLevel[],
    tolerance: number = 0.01
  ): number {
    let confirmations = 0;

    // Check retracement levels
    for (const level of retracementLevels) {
      if (Math.abs(price - level.price) / price < tolerance) {
        confirmations += level.level === 0.618 ? 2 : 1;  // Golden ratio = double weight
      }
    }

    // Check extension levels
    for (const level of extensionLevels) {
      if (Math.abs(price - level.price) / price < tolerance) {
        confirmations += level.level === 1.618 ? 2 : 1;  // Golden ratio = double weight
      }
    }

    return Math.min(10, confirmations);  // 0-10 score
  }

  /**
   * Identify trading zones based on Fibonacci clusters
   */
  identifyTradingZones(
    retracementLevels: FibLevel[],
    extensionLevels: FibLevel[],
    clusterTolerance: number = 10
  ): Array<{ zone: string; priceRange: [number, number]; strength: number }> {
    const allLevels = [...retracementLevels, ...extensionLevels]
      .sort((a, b) => a.price - b.price);

    const zones: Array<{ zone: string; priceRange: [number, number]; strength: number }> = [];
    let current = 0;

    while (current < allLevels.length) {
      const cluster = [allLevels[current]];
      let strength = 1;

      // Find nearby levels (within tolerance)
      for (let i = current + 1; i < allLevels.length; i++) {
        if (Math.abs(allLevels[i].price - allLevels[current].price) < clusterTolerance) {
          cluster.push(allLevels[i]);
          strength++;
        } else {
          break;
        }
      }

      if (cluster.length > 0) {
        const avgPrice = cluster.reduce((sum, l) => sum + l.price, 0) / cluster.length;
        zones.push({
          zone: `Zone ${zones.length + 1}`,
          priceRange: [avgPrice - clusterTolerance / 2, avgPrice + clusterTolerance / 2],
          strength
        });
      }

      current += cluster.length;
    }

    return zones;
  }
}

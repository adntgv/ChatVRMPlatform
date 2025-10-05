/**
 * Rate Limiting for Demo and Trial Users
 * Prevents abuse while allowing no-friction demos
 */

const DEMO_STORAGE_KEY = 'chatvrm_demo_usage';
const TRIAL_STORAGE_KEY = 'chatvrm_trial_usage';

export interface UsageLimit {
  count: number;
  resetAt: number;
  firstUse: number;
}

export interface RateLimitConfig {
  maxCount: number;
  windowMs: number; // Time window in milliseconds
}

// Default configurations
export const DEMO_LIMITS: RateLimitConfig = {
  maxCount: 10, // 10 messages per demo session
  windowMs: 60 * 60 * 1000 // 1 hour
};

export const TRIAL_LIMITS: RateLimitConfig = {
  maxCount: 50, // 50 messages per trial user
  windowMs: 7 * 24 * 60 * 60 * 1000 // 7 days
};

class RateLimiter {
  private getUsage(storageKey: string): UsageLimit | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const usage: UsageLimit = JSON.parse(stored);

      // Check if usage window has expired
      if (Date.now() > usage.resetAt) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return usage;
    } catch {
      return null;
    }
  }

  private setUsage(storageKey: string, usage: UsageLimit): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(usage));
    } catch (error) {
      console.error('Failed to save usage data:', error);
    }
  }

  /**
   * Check if action is allowed under rate limit
   */
  isAllowed(type: 'demo' | 'trial'): boolean {
    const config = type === 'demo' ? DEMO_LIMITS : TRIAL_LIMITS;
    const storageKey = type === 'demo' ? DEMO_STORAGE_KEY : TRIAL_STORAGE_KEY;

    const usage = this.getUsage(storageKey);

    if (!usage) {
      // First use - create new usage record
      return true;
    }

    return usage.count < config.maxCount;
  }

  /**
   * Record usage of demo or trial
   */
  recordUsage(type: 'demo' | 'trial'): void {
    const config = type === 'demo' ? DEMO_LIMITS : TRIAL_LIMITS;
    const storageKey = type === 'demo' ? DEMO_STORAGE_KEY : TRIAL_STORAGE_KEY;

    let usage = this.getUsage(storageKey);

    if (!usage) {
      // Create new usage record
      const now = Date.now();
      usage = {
        count: 1,
        resetAt: now + config.windowMs,
        firstUse: now
      };
    } else {
      // Increment usage
      usage.count += 1;
    }

    this.setUsage(storageKey, usage);
  }

  /**
   * Get remaining usage count
   */
  getRemaining(type: 'demo' | 'trial'): number {
    const config = type === 'demo' ? DEMO_LIMITS : TRIAL_LIMITS;
    const storageKey = type === 'demo' ? DEMO_STORAGE_KEY : TRIAL_STORAGE_KEY;

    const usage = this.getUsage(storageKey);

    if (!usage) {
      return config.maxCount;
    }

    return Math.max(0, config.maxCount - usage.count);
  }

  /**
   * Get usage percentage (0-100)
   */
  getUsagePercentage(type: 'demo' | 'trial'): number {
    const config = type === 'demo' ? DEMO_LIMITS : TRIAL_LIMITS;
    const remaining = this.getRemaining(type);
    return ((config.maxCount - remaining) / config.maxCount) * 100;
  }

  /**
   * Get time until reset in human-readable format
   */
  getTimeUntilReset(type: 'demo' | 'trial'): string {
    const storageKey = type === 'demo' ? DEMO_STORAGE_KEY : TRIAL_STORAGE_KEY;
    const usage = this.getUsage(storageKey);

    if (!usage) {
      return 'No limit active';
    }

    const timeLeft = usage.resetAt - Date.now();

    if (timeLeft <= 0) {
      return 'Reset now';
    }

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Reset usage for testing
   */
  reset(type: 'demo' | 'trial'): void {
    const storageKey = type === 'demo' ? DEMO_STORAGE_KEY : TRIAL_STORAGE_KEY;
    localStorage.removeItem(storageKey);
  }

  /**
   * Get full usage status
   */
  getStatus(type: 'demo' | 'trial') {
    const config = type === 'demo' ? DEMO_LIMITS : TRIAL_LIMITS;

    return {
      allowed: this.isAllowed(type),
      remaining: this.getRemaining(type),
      total: config.maxCount,
      percentage: this.getUsagePercentage(type),
      timeUntilReset: this.getTimeUntilReset(type),
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// React hook
import { useState, useEffect } from 'react';

export function useRateLimit(type: 'demo' | 'trial') {
  const [status, setStatus] = useState(() => rateLimiter.getStatus(type));

  const checkLimit = () => {
    setStatus(rateLimiter.getStatus(type));
  };

  const recordUsage = () => {
    rateLimiter.recordUsage(type);
    checkLimit();
  };

  useEffect(() => {
    checkLimit();
  }, [type]);

  return {
    ...status,
    recordUsage,
    refresh: checkLimit,
  };
}

/**
 * Analytics Service for Validation Experiment
 * Tracks the 3 gates: Interest → Use → Money
 */

export type AnalyticsEvent =
  // Gate A: Interest
  | 'landing_page_view'
  | 'demo_cta_click'
  | 'waitlist_submit'
  // Gate B: Use
  | 'demo_interaction_start'
  | 'demo_message_sent'
  | 'demo_session_end'
  | 'wizard_start'
  | 'wizard_step_complete'
  | 'wizard_step_abandon'
  | 'instance_created'
  // Gate C: Money
  | 'reserve_page_view'
  | 'payment_intent_start'
  | 'payment_complete'
  | 'pilot_inquiry_submit'
  | 'trial_to_paid_conversion';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'chatvrm_analytics';
const SESSION_KEY = 'chatvrm_session_id';
const SESSION_START_KEY = 'chatvrm_session_start';

class AnalyticsService {
  private sessionId: string;
  private sessionStart: number;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStart = this.getSessionStart();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  private getSessionStart(): number {
    if (typeof window === 'undefined') return Date.now();

    let start = sessionStorage.getItem(SESSION_START_KEY);
    if (!start) {
      const now = Date.now();
      sessionStorage.setItem(SESSION_START_KEY, now.toString());
      return now;
    }
    return parseInt(start);
  }

  /**
   * Track an analytics event
   */
  track(event: AnalyticsEvent, metadata?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    const eventData: AnalyticsEventData = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        sessionDuration: this.getSessionDuration(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }
    };

    this.persistEvent(eventData);

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, metadata);
    }
  }

  /**
   * Get current session duration in seconds
   */
  getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStart) / 1000);
  }

  /**
   * Track time on page (call on page exit)
   */
  trackTimeOnPage(pageName: string): void {
    this.track('landing_page_view', {
      page: pageName,
      timeOnPage: this.getSessionDuration()
    });
  }

  /**
   * Persist event to localStorage
   */
  private persistEvent(eventData: AnalyticsEventData): void {
    try {
      const events = this.getStoredEvents();
      events.push(eventData);

      // Keep only last 1000 events per user
      const trimmed = events.slice(-1000);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to persist analytics event:', error);
    }
  }

  /**
   * Get all stored events
   */
  getStoredEvents(): AnalyticsEventData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Export analytics data for admin dashboard
   */
  exportData(): string {
    const events = this.getStoredEvents();
    return JSON.stringify(events, null, 2);
  }

  /**
   * Calculate gate metrics
   */
  calculateMetrics() {
    const events = this.getStoredEvents();

    // Gate A: Interest
    const landingViews = events.filter(e => e.event === 'landing_page_view').length;
    const demoClicks = events.filter(e => e.event === 'demo_cta_click').length;
    const waitlistSubmits = events.filter(e => e.event === 'waitlist_submit').length;

    // Gate B: Use
    const demoStarts = events.filter(e => e.event === 'demo_interaction_start').length;
    const demoMessages = events.filter(e => e.event === 'demo_message_sent').length;
    const wizardStarts = events.filter(e => e.event === 'wizard_start').length;
    const instancesCreated = events.filter(e => e.event === 'instance_created').length;

    // Gate C: Money
    const paymentIntents = events.filter(e => e.event === 'payment_intent_start').length;
    const paymentsComplete = events.filter(e => e.event === 'payment_complete').length;
    const pilotInquiries = events.filter(e => e.event === 'pilot_inquiry_submit').length;
    const trialConversions = events.filter(e => e.event === 'trial_to_paid_conversion').length;

    // Calculate session durations
    const sessionDurations = events
      .filter(e => e.metadata?.sessionDuration)
      .map(e => e.metadata!.sessionDuration as number);

    const medianSessionDuration = sessionDurations.length > 0
      ? sessionDurations.sort((a, b) => a - b)[Math.floor(sessionDurations.length / 2)]
      : 0;

    return {
      gateA: {
        landingViews,
        demoClicks,
        waitlistSubmits,
        demoCTR: landingViews > 0 ? (demoClicks / landingViews * 100).toFixed(1) : '0',
        waitlistCTR: landingViews > 0 ? (waitlistSubmits / landingViews * 100).toFixed(1) : '0',
      },
      gateB: {
        demoStarts,
        demoMessages,
        wizardStarts,
        instancesCreated,
        demoStartRate: demoClicks > 0 ? (demoStarts / demoClicks * 100).toFixed(1) : '0',
        wizardStartRate: demoStarts > 0 ? (wizardStarts / demoStarts * 100).toFixed(1) : '0',
        medianSessionDuration,
      },
      gateC: {
        paymentIntents,
        paymentsComplete,
        pilotInquiries,
        trialConversions,
        paymentConversionRate: paymentIntents > 0 ? (paymentsComplete / paymentIntents * 100).toFixed(1) : '0',
        totalMoneySignals: paymentsComplete + pilotInquiries + trialConversions,
      }
    };
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_START_KEY);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Hook for React components
import { useEffect } from 'react';

export function useAnalytics(event: AnalyticsEvent, metadata?: Record<string, any>, deps: any[] = []) {
  useEffect(() => {
    analytics.track(event, metadata);
  }, deps);
}

export function usePageView(pageName: string) {
  useEffect(() => {
    analytics.track('landing_page_view', { page: pageName });

    // Track time on page on unmount
    return () => {
      analytics.trackTimeOnPage(pageName);
    };
  }, [pageName]);
}

import React, { Profiler, ProfilerOnRenderCallback } from 'react';

interface RenderMetrics {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

interface PerformanceReport {
  componentName: string;
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  updates: number;
  mounts: number;
}

class PerformanceMonitor {
  private metrics: Map<string, RenderMetrics[]> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  recordRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    if (!this.enabled) return;

    const metric: RenderMetrics = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions,
    };

    const existing = this.metrics.get(id) || [];
    existing.push(metric);
    this.metrics.set(id, existing);

    // Log slow renders (> 16ms indicates potential frame drops)
    if (actualDuration > 16) {
      console.warn(`⚠️ Slow render detected in ${id}:`, {
        duration: `${actualDuration.toFixed(2)}ms`,
        phase,
      });
    }
  };

  getReport(componentName?: string): PerformanceReport | PerformanceReport[] {
    if (componentName) {
      return this.generateReport(componentName);
    }

    const reports: PerformanceReport[] = [];
    for (const [name] of this.metrics) {
      reports.push(this.generateReport(name));
    }
    return reports;
  }

  private generateReport(componentName: string): PerformanceReport {
    const metrics = this.metrics.get(componentName) || [];
    
    if (metrics.length === 0) {
      return {
        componentName,
        renderCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        updates: 0,
        mounts: 0,
      };
    }

    const durations = metrics.map(m => m.actualDuration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const updates = metrics.filter(m => m.phase === 'update').length;
    const mounts = metrics.filter(m => m.phase === 'mount').length;

    return {
      componentName,
      renderCount: metrics.length,
      totalDuration,
      averageDuration: totalDuration / metrics.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      updates,
      mounts,
    };
  }

  reset() {
    this.metrics.clear();
  }

  logReport() {
    const reports = this.getReport();
    console.group('🚀 Performance Report');
    
    if (Array.isArray(reports)) {
      reports.forEach(report => {
        console.group(report.componentName);
        console.table({
          'Render Count': report.renderCount,
          'Total Duration': `${report.totalDuration.toFixed(2)}ms`,
          'Average Duration': `${report.averageDuration.toFixed(2)}ms`,
          'Max Duration': `${report.maxDuration.toFixed(2)}ms`,
          'Min Duration': `${report.minDuration.toFixed(2)}ms`,
          'Updates': report.updates,
          'Mounts': report.mounts,
        });
        console.groupEnd();
      });
    }
    
    console.groupEnd();
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// HOC for wrapping components with profiler
export function withPerformanceProfiler<P extends object>(
  Component: React.ComponentType<P>,
  id: string
) {
  return React.forwardRef<any, P>((props, ref) => (
    <Profiler id={id} onRender={performanceMonitor.recordRender}>
      <Component {...props} ref={ref} />
    </Profiler>
  ));
}

// Hook for manual performance tracking
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    return () => {
      const report = performanceMonitor.getReport(componentName);
      if (!Array.isArray(report) && report.renderCount > 0) {
        console.log(`📊 ${componentName} performance:`, {
          renders: report.renderCount,
          avgDuration: `${report.averageDuration.toFixed(2)}ms`,
        });
      }
    };
  }, [componentName]);
}

// Component for visualizing performance in development
export const PerformanceOverlay: React.FC<{ show?: boolean }> = ({ show = true }) => {
  const [reports, setReports] = React.useState<PerformanceReport[]>([]);
  
  React.useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      const allReports = performanceMonitor.getReport();
      if (Array.isArray(allReports)) {
        setReports(allReports);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [show]);
  
  if (!show || process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <h4 style={{ margin: '0 0 10px 0' }}>Performance Monitor</h4>
      {reports.map(report => (
        <div key={report.componentName} style={{ marginBottom: '8px' }}>
          <strong>{report.componentName}</strong>
          <div>Renders: {report.renderCount}</div>
          <div>Avg: {report.averageDuration.toFixed(2)}ms</div>
          {report.maxDuration > 16 && (
            <div style={{ color: '#ff6b6b' }}>
              ⚠️ Slow: {report.maxDuration.toFixed(2)}ms
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
import React, { Component, ReactNode } from 'react';
import { AppError, ErrorType, ErrorSeverity, errorHandler } from '@/lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to our error handling service
    const appError = new AppError(
      `React Error: ${error.message}`,
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        originalError: error,
        context: {
          component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
          action: 'component_error',
          metadata: {
            componentStack: errorInfo.componentStack
          }
        },
        userMessage: 'アプリケーションでエラーが発生しました。ページを再読み込みしてください。'
      }
    );

    errorHandler.handle(appError);

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!);
      }

      // Default error UI
      return (
        <div className="error-boundary-container" style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#c92a2a', marginBottom: '10px' }}>
            エラーが発生しました
          </h2>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ 
              textAlign: 'left', 
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#f8f8f8',
              borderRadius: '4px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                エラーの詳細（開発環境のみ）
              </summary>
              <pre style={{ 
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#333',
                color: '#fff',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#1971c2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to reset error boundary
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetErrorBoundary = () => setError(null);
  const throwError = (error: Error) => setError(error);

  return { resetErrorBoundary, throwError };
};
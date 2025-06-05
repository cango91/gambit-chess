import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a1111 100%);
  color: #ffffff;
  padding: 20px;
  text-align: center;
`;

const ErrorTitle = styled.h1`
  font-size: 24px;
  color: #ff6b6b;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  margin-bottom: 24px;
  max-width: 600px;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  background: #b58863;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #d4a574;
  }
`;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>🚨 Something went wrong</ErrorTitle>
          <ErrorMessage>
            Gambit Chess encountered an unexpected error. Don't worry - your games are safe!
            Try refreshing the page to continue playing.
          </ErrorMessage>
          {this.state.error && (
            <ErrorMessage style={{ fontSize: '14px', opacity: 0.7 }}>
              Error: {this.state.error.message}
            </ErrorMessage>
          )}
          <RetryButton onClick={this.handleRetry}>
            Refresh Page
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
} 
import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div<{ $status: string }>`
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${props => props.$status === 'connected' ? 0.7 : 1};
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.$status) {
      case 'connected':
        return 'background: #4ade80; box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);';
      case 'connecting':
        return 'background: #fbbf24; box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);';
      case 'disconnected':
        return 'background: #f87171; box-shadow: 0 2px 8px rgba(248, 113, 113, 0.3);';
      case 'error':
        return 'background: #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);';
      default:
        return 'background: #6b7280;';
    }
  }}
`;

const StatusDot = styled.div<{ $status: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  
  ${props => props.$status === 'connecting' && `
    animation: pulse 1.5s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

interface ConnectionStatusProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  // Don't show when connected and stable
  if (status === 'connected') {
    return null;
  }

  return (
    <StatusContainer $status={status}>
      <StatusDot $status={status} />
      {getStatusText(status)}
    </StatusContainer>
  );
}; 
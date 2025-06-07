import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const CookieOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const CookieContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  border: 2px solid rgba(181, 136, 99, 0.3);
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  text-align: center;
`;

const CookieTitle = styled.h2`
  color: #f0d9b5;
  font-size: 24px;
  margin: 0 0 16px 0;
  font-weight: 600;
`;

const CookieIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const CookieMessage = styled.p`
  color: #d0d0d0;
  line-height: 1.6;
  margin: 0 0 24px 0;
  font-size: 16px;
`;

const CookieDetails = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border-left: 3px solid #fbbf24;
`;

const CookieText = styled.p`
  color: #a0a0a0;
  font-size: 14px;
  margin: 0;
  text-align: left;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const CookieButton = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #b58863 0%, #d4af7a 100%)'
    : 'rgba(181, 136, 99, 0.2)'
  };
  color: ${props => props.$primary ? '#1a1a1a' : '#f0d9b5'};
  border: 1px solid rgba(181, 136, 99, 0.3);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 120px;

  &:hover {
    background: ${props => props.$primary 
      ? 'linear-gradient(135deg, #d4af7a 0%, #b58863 100%)'
      : 'rgba(181, 136, 99, 0.3)'
    };
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const COOKIE_CONSENT_KEY = 'gambit-chess-cookie-consent';

interface CookieNoticeProps {
  onAccept: () => void;
}

export const CookieNotice: React.FC<CookieNoticeProps> = ({ onAccept }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsent) {
      setIsVisible(true);
    }
    // Don't automatically call onAccept here - App.tsx handles this
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleLeave = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <CookieOverlay>
      <CookieContainer>
        <CookieIcon>🍪</CookieIcon>
        <CookieTitle>Cookie Notice</CookieTitle>
        <CookieMessage>
          Gambit Chess uses essential cookies to maintain your game session and provide security. 
          We only use cookies that are necessary for the website to function properly.
        </CookieMessage>
        
        <CookieDetails>
          <CookieText>
            <strong>Essential Cookies:</strong><br/>
            • Session management for secure anonymous gameplay<br/>
            • Authentication tokens for registered users<br/>
            • Game state preservation during play<br/><br/>
            <em>We do not use tracking, analytics, or advertising cookies.</em>
          </CookieText>
        </CookieDetails>

        <ButtonContainer>
          <CookieButton onClick={handleLeave}>
            Leave Site
          </CookieButton>
          <CookieButton $primary onClick={handleAccept}>
            Accept & Continue
          </CookieButton>
        </ButtonContainer>
      </CookieContainer>
    </CookieOverlay>
  );
}; 
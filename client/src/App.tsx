import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useGameStore } from './stores/gameStore';
import { Lobby } from './components/Lobby/Lobby';
import { GameContainer } from './components/Game/GameContainer';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { ConnectionStatus } from './components/UI/ConnectionStatus';
import { CookieNotice } from './components/CookieNotice/CookieNotice';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { Footer } from './components/UI/Footer';
import { PrivacyPolicy } from './components/Legal/PrivacyPolicy';
import { CookieSettings } from './components/Legal/CookieSettings';

const ONBOARDING_SEEN_KEY = 'gambit-chess-onboarding-seen';

function App() {
  const { 
    initializeSession, 
    isSessionLoading, 
    session, 
    connectionStatus 
  } = useGameStore();

  const [cookieConsent, setCookieConsent] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isManualTutorial, setIsManualTutorial] = useState<boolean>(false);

  // Check initial cookie consent state
  useEffect(() => {
    const hasConsent = localStorage.getItem('gambit-chess-cookie-consent');
    if (hasConsent) {
      setCookieConsent(true);
      // Initialize session after consent - get fresh reference
      useGameStore.getState().initializeSession();
      
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SEEN_KEY);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
        setIsManualTutorial(false);
      }
    }
  }, []); // Empty dependency array - only run once on mount

  const handleCookieAccept = useCallback(() => {
    setCookieConsent(true);
    // Get fresh reference and call directly - don't put in dependency array
    useGameStore.getState().initializeSession();
    
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_SEEN_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      setIsManualTutorial(false);
    }
  }, []); // Empty dependency array prevents re-creation

  const handleOnboardingClose = () => {
    if (!isManualTutorial) {
      localStorage.setItem(ONBOARDING_SEEN_KEY, 'seen');
    }
    setShowOnboarding(false);
    setIsManualTutorial(false);
  };

  const handleStartPractice = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, 'seen');
    setShowOnboarding(false);
    setIsManualTutorial(false);
    // Navigate to lobby - the practice button will be highlighted
    window.location.href = '/';
  };

  const handleShowManualTutorial = () => {
    setIsManualTutorial(true);
    setShowOnboarding(true);
  };

  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div 
          className="app" 
          style={{ 
            width: '100%', 
            minHeight: '100vh',
            overflowX: 'hidden',
            overflowY: 'auto'
          }}
        >
          {/* Cookie Notice - blocks everything until accepted */}
          {!cookieConsent && <CookieNotice onAccept={handleCookieAccept} />}
          
          {/* Only show app content after cookie consent */}
          {cookieConsent && (
            <>
              <ConnectionStatus status={connectionStatus} />
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  minHeight: '100vh',
                  width: '100%'
                }}
              >
                <div style={{ flex: 1, width: '100%' }}>
                  <Routes>
                    <Route path="/" element={<Lobby onShowTutorial={handleShowManualTutorial} />} />
                    <Route path="/game/:gameId" element={<GameContainer onShowTutorial={handleShowManualTutorial} />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/cookie-settings" element={<CookieSettings />} />
                  </Routes>
                </div>
                <Footer />
              </div>
              
              {/* Onboarding Modal - shows after cookie consent */}
              <OnboardingModal 
                isVisible={showOnboarding}
                onClose={handleOnboardingClose}
                onStartPractice={handleStartPractice}
                isManualView={isManualTutorial}
              />
            </>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useGameStore } from './stores/gameStore';
import { Lobby } from './components/Lobby/Lobby';
import { GameContainer } from './components/Game/GameContainer';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { ConnectionStatus } from './components/UI/ConnectionStatus';

function App() {
  const { 
    initializeSession, 
    isSessionLoading, 
    session, 
    connectionStatus 
  } = useGameStore();

  useEffect(() => {
    // Initialize anonymous session on app start
    initializeSession();
  }, [initializeSession]);

  // Show loading screen while initializing
  if (isSessionLoading || !session) {
    return <LoadingScreen message="Initializing Gambit Chess..." />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <ConnectionStatus status={connectionStatus} />
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/game/:gameId" element={<GameContainer />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 
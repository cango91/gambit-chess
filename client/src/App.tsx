import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Lazy loaded components for code splitting
const MainMenu = React.lazy(() => import('./components/ui/MainMenu'));
const GameContainer = React.lazy(() => import('./components/ui/GameContainer'));

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="loading">
    <div className="loading-spinner"></div>
    <p>Loading Gambit Chess...</p>
  </div>
);

/**
 * Main App Component
 * Handles routing and suspense loading
 */
const App: React.FC = () => {
  // Create router with array route configuration
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Suspense fallback={<LoadingSpinner />}>
          <MainMenu />
        </Suspense>
      )
    },
    {
      path: "/game/:gameId",
      element: (
        <Suspense fallback={<LoadingSpinner />}>
          <GameContainer />
        </Suspense>
      )
    },
    {
      path: "*",
      element: (
        <Suspense fallback={<LoadingSpinner />}>
          <MainMenu />
        </Suspense>
      )
    }
  ]);

  return <RouterProvider router={router} />;
};

export default App; 
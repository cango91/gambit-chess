declare module 'react-router-dom' {
  export const createBrowserRouter: any;
  export const RouterProvider: any;
  export const useNavigate: any;
  export const useParams: any;
  export const useLocation: any;
  export const Link: any;
  export const Outlet: any;
}

declare module './components/ui/MainMenu' {
  const MainMenu: React.FC;
  export default MainMenu;
}

declare module './components/ui/GameContainer' {
  const GameContainer: React.FC;
  export default GameContainer;
} 
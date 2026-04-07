import { useEffect, useState } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPanel from "./components/LoginPanel";
import Modal from "./components/Modal";
import Navbar from "./components/Navbar";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isPublicMarketingRoute =
    !isAuthenticated && (location.pathname === "/" || location.pathname === "/signup");

  useEffect(() => {
    if (!isAuthenticated && location.state?.openLoginModal) {
      setIsLoginModalOpen(true);
    }
  }, [isAuthenticated, location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoginModalOpen(false);
    }
  }, [isAuthenticated]);

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);

    if (location.state?.openLoginModal) {
      navigate(location.pathname, { replace: true });
    }
  };

  return (
    <div className={isPublicMarketingRoute ? "app-shell app-shell-auth" : "app-shell"}>
      <div className="app-background" />
      <Navbar onOpenLoginModal={handleOpenLoginModal} />
      <main className={isPublicMarketingRoute ? "page-shell page-shell-auth" : "page-shell"}>
        <AppRoutes onOpenLoginModal={handleOpenLoginModal} />
      </main>
      {!isAuthenticated ? (
        <Modal
          contentClassName="auth-modal-content"
          isOpen={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          panelClassName="auth-modal-panel"
          title="Login"
        >
          <LoginPanel showHeading={false} />
        </Modal>
      ) : null}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

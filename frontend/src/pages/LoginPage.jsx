import { Navigate, useLocation } from "react-router-dom";

function LoginPage() {
  const location = useLocation();

  return <Navigate replace state={{ ...location.state, openLoginModal: true }} to="/" />;
}

export default LoginPage;

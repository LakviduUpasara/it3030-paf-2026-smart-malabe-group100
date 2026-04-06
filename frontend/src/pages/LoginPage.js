import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const { login, logout, isAuthenticated } = useAuth();

  return (
    <section className="card">
      <h2>Login Placeholder</h2>
      <p className="muted">
        Replace this with OAuth 2.0 or token-based authentication later.
      </p>

      {isAuthenticated ? (
        <button className="button secondary" onClick={logout} type="button">
          Sign Out
        </button>
      ) : (
        <button className="button" onClick={login} type="button">
          Sign In
        </button>
      )}
    </section>
  );
}

export default LoginPage;


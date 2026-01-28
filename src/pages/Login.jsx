import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import "./Auth.css";

function Login({ switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      const userData = await loginUser(email, password);
      login(userData);
      console.log("✅ Logged in:", userData);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("❌ Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && email && password) {
      handleLogin();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">👋 Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to your ChatApp and continue connecting
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="auth-form">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            icon="📧"
            label="Email Address"
          />

          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            icon="🔒"
            label="Password"
          />

          <Button
            text={loading ? "Signing in..." : "Sign In"}
            onClick={handleLogin}
            disabled={loading || !email || !password}
            variant="primary"
          />
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account?{" "}
            <span
              className="auth-link"
              onClick={switchToRegister}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === "Enter" && switchToRegister()}
            >
              Register here
            </span>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="auth-decoration" />
    </div>
  );
}

export default Login;

import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { registerUser } from "../services/authService";
import "./Auth.css";

function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError("");
      setLoading(true);
      await registerUser(username, email, password);
      console.log("✅ Account created successfully!");
      switchToLogin();
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      console.error("❌ Register error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && username && email && password) {
      handleRegister();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">✨ Join ChatApp</h1>
          <p className="auth-subtitle">
            Create your account and start chatting with friends
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
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            icon="👤"
            label="Username"
          />

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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            icon="🔒"
            label="Password"
          />

          <Button
            text={loading ? "Creating account..." : "Register"}
            onClick={handleRegister}
            disabled={loading || !username || !email || !password}
            variant="primary"
          />
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{" "}
            <span
              className="auth-link"
              onClick={switchToLogin}
              role="button"
              tabIndex="0"
              onKeyPress={(e) => e.key === "Enter" && switchToLogin()}
            >
              Login here
            </span>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="auth-decoration" />
    </div>
  );
}

export default Register;

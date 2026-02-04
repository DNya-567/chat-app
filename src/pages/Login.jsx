import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import "./Auth.css";

function Login({ switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const validationRules = {
    email: [
      { rule: "Valid email format", status: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length === 0 },
    ],
    password: [
      { rule: "At least 6 characters", status: password.length >= 6 || password.length === 0 },
    ],
  };

  const handleLogin = async () => {
    try {
      setErrors({});
      setGeneralError("");
      setLoading(true);
      const userData = await loginUser(email, password);
      login(userData);
      console.log("✅ Logged in:", userData);
    } catch (err) {
      console.error("❌ Login error:", err.message, err.response?.data);

      // Parse validation errors from server response
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = {};
        err.response.data.errors.forEach((error) => {
          fieldErrors[error.field] = error.message;
        });
        setErrors(fieldErrors);
        setGeneralError("Please fix the errors below to continue.");
      } else {
        setGeneralError(err.message || "Login failed. Please try again.");
      }
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
        {generalError && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{generalError}</span>
          </div>
        )}

        {/* Form */}
        <div className="auth-form">
          {/* Email Field */}
          <div className="form-field-wrapper">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              icon="📧"
              label="Email Address"
              error={errors.email}
            />
            {/* Email validation rules */}
            <div className="validation-rules">
              {validationRules.email.map((rule, idx) => (
                <div key={idx} className={`rule ${rule.status ? "valid" : "invalid"}`}>
                  <span className="rule-indicator">{rule.status ? "✓" : "✗"}</span>
                  <span className="rule-text">{rule.rule}</span>
                </div>
              ))}
            </div>
            {errors.email && (
              <div className="field-error">
                <span className="error-icon">⛔</span>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="form-field-wrapper">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              icon="🔒"
              label="Password"
              error={errors.password}
            />
            {/* Password validation rules */}
            <div className="validation-rules">
              {validationRules.password.map((rule, idx) => (
                <div key={idx} className={`rule ${rule.status ? "valid" : "invalid"}`}>
                  <span className="rule-indicator">{rule.status ? "✓" : "✗"}</span>
                  <span className="rule-text">{rule.rule}</span>
                </div>
              ))}
            </div>
            {errors.password && (
              <div className="field-error">
                <span className="error-icon">⛔</span>
                {errors.password}
              </div>
            )}
          </div>

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

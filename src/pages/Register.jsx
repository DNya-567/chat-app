import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { registerUser } from "../services/authService";
import "./Auth.css";

function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation rules for display
  const validationRules = {
    username: [
      { rule: "3-30 characters", status: username.length >= 3 && username.length <= 30 },
      { rule: "Only letters and numbers", status: /^[a-zA-Z0-9]*$/.test(username) || username.length === 0 },
    ],
    email: [
      { rule: "Valid email format", status: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length === 0 },
      { rule: "Max 100 characters", status: email.length <= 100 },
    ],
    password: [
      { rule: "At least 6 characters", status: password.length >= 6 },
      { rule: "Max 100 characters", status: password.length <= 100 },
    ],
  };

  const handleRegister = async () => {
    try {
      setErrors({});
      setGeneralError("");
      setLoading(true);
      await registerUser(username, email, password);
      console.log("✅ Account created successfully!");
      switchToLogin();
    } catch (err) {
      console.error("❌ Register error:", err.message, err.response?.data);

      // Parse validation errors from server response
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = {};
        err.response.data.errors.forEach((error) => {
          fieldErrors[error.field] = error.message;
        });
        setErrors(fieldErrors);
        setGeneralError("Please fix the errors below to continue.");
      } else {
        setGeneralError(err.message || "Registration failed. Please try again.");
      }
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

        {/* General Error Message */}
        {generalError && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{generalError}</span>
          </div>
        )}

        {/* Form */}
        <div className="auth-form">
          {/* Username Field */}
          <div className="form-field-wrapper">
            <Input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              icon="👤"
              label="Username"
              error={errors.username}
            />
            {/* Username validation rules */}
            <div className="validation-rules">
              {validationRules.username.map((rule, idx) => (
                <div key={idx} className={`rule ${rule.status ? "valid" : "invalid"}`}>
                  <span className="rule-indicator">{rule.status ? "✓" : "✗"}</span>
                  <span className="rule-text">{rule.rule}</span>
                </div>
              ))}
            </div>
            {errors.username && (
              <div className="field-error">
                <span className="error-icon">⛔</span>
                {errors.username}
              </div>
            )}
          </div>

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
              placeholder="Create a password"
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

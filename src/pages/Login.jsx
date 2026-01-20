import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

function Login({ switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      setError("");
      const userData = await loginUser(email, password);
      login(userData); // store user globally
      console.log("Logged in:", userData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button text="Login" onClick={handleLogin} />

      <p style={{ marginTop: "10px" }}>
        Don’t have an account?{" "}
        <span style={linkStyle} onClick={switchToRegister}>
          Register
        </span>
      </p>
    </div>
  );
}

const containerStyle = {
  width: "350px",
  margin: "40px auto 0",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  textAlign: "center",
};

const linkStyle = {
  color: "#4f46e5",
  cursor: "pointer",
};

export default Login;

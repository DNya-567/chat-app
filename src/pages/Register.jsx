import { useState } from "react";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { registerUser } from "../services/authService";

function Register({ switchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    try {
      setError("");
      await registerUser(username, email, password);

      console.log("Redirecting to login...");
      switchToLogin(); // go to login page
    } catch (err) {
      console.error("Register error:", err.message);
      setError(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Register</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

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

      <Button text="Register" onClick={handleRegister} />

      <p style={{ marginTop: "10px" }}>
        Already have an account?{" "}
        <span style={linkStyle} onClick={switchToLogin}>
          Login
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

export default Register;

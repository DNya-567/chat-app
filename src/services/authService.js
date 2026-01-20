// src/services/authService.js
const API_URL = "http://localhost:5000/api/auth";

/* -------------------------------------------------
   REGISTER USER
   ------------------------------------------------- */
export const registerUser = async (username, email, password) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Registration failed");
  }
  return res.json(); // { message: "User registered successfully" }
};

/* -------------------------------------------------
   LOGIN USER
   ------------------------------------------------- */
export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Login failed");
  }
  return res.json(); // { token, user }
};

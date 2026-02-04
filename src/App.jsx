import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import { useAuth } from "./context/AuthContext";

function ProtectedApp() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (isAuthenticated) {
    return <Chat />;
  }

  return showLogin ? (
    <Login switchToRegister={() => setShowLogin(false)} />
  ) : (
    <Register switchToLogin={() => setShowLogin(true)} />
  );
}

function App() {
  return (
    <ProtectedApp />
  );
}

export default App;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./index.css";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FontThemeProvider } from "./context/FontThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <FontThemeProvider>
        <AuthProvider>
          <App />
          <SpeedInsights />
        </AuthProvider>
      </FontThemeProvider>
    </ThemeProvider>
  </StrictMode>
);

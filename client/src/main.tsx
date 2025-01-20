import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from './App';
import "./index.css";
import "./lib/i18n"; // Import i18n configuration

// Wait for i18n initialization before rendering
const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App/>
  </StrictMode>
);
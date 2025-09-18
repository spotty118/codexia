import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import "./App.css";

/**
 * Simplified main entry point
 * Removes complex routing and uses the simplified App component directly
 */

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

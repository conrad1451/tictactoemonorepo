// frontend/src/main.ts

// CHQ: Claude AI (Haiku) generated file

import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "@descope/react-sdk";

import { App } from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);

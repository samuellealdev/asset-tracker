import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:2rem;color:red;font-family:sans-serif"><h1>Error: Root element not found</h1></div>';
  throw new Error("Root element not found");
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  rootElement.innerHTML = `<div style="padding:2rem;color:red;font-family:sans-serif"><h1>React failed to mount</h1><pre>${err}</pre></div>`;
  console.error("React mount error:", err);
}

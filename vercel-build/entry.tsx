import React from "react";
import ReactDOM from "react-dom/client";
import "../src/styles.css";
import { Dashboard } from "../src/components/soulframe/Dashboard";
import { Toaster } from "../src/components/ui/sonner";

function App() {
  return (
    <>
      <Dashboard />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}

const rootEl = document.getElementById("root")!;
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

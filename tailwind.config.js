import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Floating from "./floating/Floating";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* The tray hotkey opens a frameless window at #/floating */}
        <Route path="/floating" element={<Floating />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

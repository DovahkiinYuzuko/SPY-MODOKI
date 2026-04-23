import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n"; // 多言語化の初期化

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

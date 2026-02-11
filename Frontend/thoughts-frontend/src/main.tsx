import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setAuthToken } from "./lib/api";

// initialize auth token if present
const token = localStorage.getItem("token");
if (token) setAuthToken(token);

createRoot(document.getElementById("root")!).render(<App />);

// global error handlers to surface runtime errors on screen (helps debug white screen)
window.addEventListener("error", (ev) => {
  try {
    const e = ev.error || ev;
    console.error("Runtime error:", e);
    const pre = document.createElement("pre");
    pre.style.position = "fixed";
    pre.style.left = "0";
    pre.style.top = "0";
    pre.style.right = "0";
    pre.style.background = "#1f2937";
    pre.style.color = "#f8fafc";
    pre.style.padding = "16px";
    pre.style.zIndex = "99999";
    pre.textContent = `Error: ${e?.message || e}\n${e?.stack || ""}`;
    document.body.innerHTML = "";
    document.body.appendChild(pre);
  } catch (err) {
    console.error(err);
  }
});

window.addEventListener("unhandledrejection", (ev) => {
  console.error("Unhandled promise rejection:", ev);
  const pre = document.createElement("pre");
  pre.style.position = "fixed";
  pre.style.left = "0";
  pre.style.top = "0";
  pre.style.right = "0";
  pre.style.background = "#1f2937";
  pre.style.color = "#f8fafc";
  pre.style.padding = "16px";
  pre.style.zIndex = "99999";
  pre.textContent = `Unhandled Rejection: ${JSON.stringify(ev.reason)}`;
  document.body.innerHTML = "";
  document.body.appendChild(pre);
});

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExplorerClient from "../app/explorer-client";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("Root element was not found");

createRoot(root).render(
  <StrictMode>
    <ExplorerClient />
  </StrictMode>,
);

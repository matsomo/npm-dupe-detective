import "./css/index.css";
import "./shared.js";
import { setupFileHandlers, loadFileFromPath } from "./fileHandler.js";
import { setupUIHandlers } from "./uiController.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("initialize");
  setupFileHandlers();
  setupUIHandlers();

  const urlParams = new URLSearchParams(window.location.search);
  const filePath = urlParams.get("file");

  if (filePath) {
    loadFileFromPath(filePath);
  }
});

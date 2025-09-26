import { processData } from "./packageAnalyzer.js";
import { showLoader, hideLoader } from "./uiHelpers.js";

// DOM Elements
const fileInput = document.getElementById("file-input");

export function setupFileHandlers() {
  // File input event handler
  fileInput.addEventListener("change", handleFileSelect);

  // Handle drag and drop
  document.body.addEventListener("dragover", (event) => {
    event.preventDefault();
    document.body.classList.add("dragover");
  });

  document.body.addEventListener("dragleave", (event) => {
    event.preventDefault();
    document.body.classList.remove("dragover");
  });

  document.body.addEventListener("drop", (event) => {
    event.preventDefault();
    document.body.classList.remove("dragover");

    if (event.dataTransfer.files.length) {
      fileInput.files = event.dataTransfer.files;
      handleFileSelect(event);
    }
  });
}

// Load file from path
export async function loadFileFromPath(path) {
  try {
    showLoader("Loading dependency data...");
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error(
        `Failed to load file: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    processData(data);
  } catch (error) {
    hideLoader();
    alert(`Error loading file: ${error.message}`);
  }
}

// Handle file selection
export function handleFileSelect(event) {
  const file = event.target.files[0];

  if (!file) return;

  showLoader("Reading file...");

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      processData(data);
    } catch (error) {
      hideLoader();
      alert("Error parsing JSON: " + error.message);
    }
  };

  reader.onerror = () => {
    hideLoader();
    alert("Error reading file");
  };

  reader.readAsText(file);
}

// Example URL handler for the demo
export function loadExample() {
  loadFileFromPath("example-dependency.json");
}

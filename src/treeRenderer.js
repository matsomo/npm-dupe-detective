import { showPackageDetails, showVersionConflicts } from "./packageAnalyzer.js";
import state from "./state.js";

// DOM Elements
const treeContainer = document.getElementById("tree-container");

// Render dependency tree
export function renderDependencyTree(data) {
  treeContainer.innerHTML = "";

  // Create root node
  const rootNode = document.createElement("div");
  rootNode.className = "tree-node";

  const rootContent = document.createElement("div");
  rootContent.className = "tree-content";

  rootContent.innerHTML = `
    <span class="tree-toggle">▼</span>
    <span class="tree-name root-name">${data.name}</span>
    <span class="tree-version">${data.version}</span>
  `;

  rootNode.appendChild(rootContent);

  // Add event listener for node selection
  rootContent.addEventListener("click", function (event) {
    // Remove previous selection
    const selected = document.querySelector(".tree-content.selected");
    if (selected) selected.classList.remove("selected");

    // Add selection to current node
    const currentElement = event.currentTarget;
    if (currentElement) currentElement.classList.add("selected");

    showPackageDetails(data.name, data.version);
  });

  // Create children container
  const childrenContainer = document.createElement("div");
  childrenContainer.className = "tree-children";

  // Add dependencies
  if (data.dependencies) {
    for (const [name, info] of Object.entries(data.dependencies)) {
      const childNode = createDependencyNode(name, info);
      childrenContainer.appendChild(childNode);
    }
  }

  rootNode.appendChild(childrenContainer);
  treeContainer.appendChild(rootNode);

  // Add toggle functionality
  addToggleFunctionality();
}

// Create a dependency node
export function createDependencyNode(name, info) {
  const node = document.createElement("div");
  node.className = "tree-node";

  const content = document.createElement("div");
  content.className = "tree-content";

  // Determine if package has version conflicts
  const hasConflict = state.duplicatePackages[name] !== undefined;
  const conflictClass = hasConflict ? "conflict" : "";

  content.innerHTML = `
    ${info.dependencies ? '<span class="tree-toggle">▶</span>' : '<span class="tree-toggle-placeholder"></span>'}
    <span class="tree-name ${conflictClass}">${name}</span>
    <span class="tree-version">${info.version}</span>
  `;

  node.appendChild(content);

  // Add event listener for node selection
  content.addEventListener("click", function (event) {
    // Remove previous selection
    const selected = document.querySelector(".tree-content.selected");
    if (selected) selected.classList.remove("selected");

    // Add selection to current node
    const currentElement = event.currentTarget;
    if (currentElement) currentElement.classList.add("selected");

    showPackageDetails(name, info.version);

    // If this is a package with version conflicts, show those
    if (hasConflict) {
      showVersionConflicts(name);
    } else {
      document.getElementById("conflict-list").innerHTML = "";
    }

    // Don't toggle when clicking on the content
    event.stopPropagation();
  });

  // Add children if there are dependencies
  if (info.dependencies) {
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "tree-children";
    childrenContainer.style.display = "none";

    for (const [childName, childInfo] of Object.entries(info.dependencies)) {
      const childNode = createDependencyNode(childName, childInfo);
      childrenContainer.appendChild(childNode);
    }

    node.appendChild(childrenContainer);
  }

  return node;
}

// Toggle tree nodes
export function addToggleFunctionality() {
  document.querySelectorAll(".tree-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function (event) {
      const childrenContainer =
        this.closest(".tree-node").querySelector(".tree-children");

      if (childrenContainer) {
        if (childrenContainer.style.display === "none") {
          childrenContainer.style.display = "block";
          this.textContent = "▼";
        } else {
          childrenContainer.style.display = "none";
          this.textContent = "▶";
        }
      }

      event.stopPropagation();
    });
  });
}

// Expand all tree nodes
export function expandAll() {
  document.querySelectorAll(".tree-children").forEach((container) => {
    container.style.display = "block";
  });

  document.querySelectorAll(".tree-toggle").forEach((toggle) => {
    toggle.textContent = "▼";
  });
}

// Collapse all tree nodes
export function collapseAll() {
  document
    .querySelectorAll(".tree-node .tree-children")
    .forEach((container) => {
      if (
        !container
          .closest(".tree-node")
          .parentElement.classList.contains("tree-container")
      ) {
        container.style.display = "none";
      }
    });

  document.querySelectorAll(".tree-toggle").forEach((toggle) => {
    toggle.textContent = "▶";
  });
}

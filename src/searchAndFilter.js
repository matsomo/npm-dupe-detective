import { showVersionConflicts } from "./packageAnalyzer.js";
import state from "./state.js";

// DOM Elements
const treeContainer = document.getElementById("tree-container");
const conflictList = document.getElementById("conflict-list");

// Search for packages
export function searchPackage(term) {
  if (!term.trim() || !state.dependencyData) return;

  const searchTerm = term.trim().toLowerCase();
  const matches = [];

  // Find all matching packages
  for (const [name, _] of Object.entries(state.packageVersions)) {
    if (name.toLowerCase().includes(searchTerm)) {
      matches.push(name);
    }
  }

  if (matches.length === 0) {
    alert("No packages found matching: " + term);
    return;
  }

  // Clear previous highlights
  treeContainer.querySelectorAll(".highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  // Find elements in tree and highlight them
  const treeElements = treeContainer.querySelectorAll(".tree-name");
  let firstMatchElement = null;

  treeElements.forEach((el) => {
    const packageName = el.textContent;
    if (matches.includes(packageName)) {
      el.classList.add("highlight");
      if (!firstMatchElement) {
        firstMatchElement = el;
      }

      // Expand path to this element
      let parent = el.closest(".tree-node");
      while (parent) {
        const childrenContainer = parent.querySelector(".tree-children");
        const toggle = parent.querySelector(".tree-toggle");

        if (childrenContainer) {
          childrenContainer.style.display = "block";
        }

        if (toggle) {
          toggle.textContent = "▼";
        }

        parent = parent.parentElement
          ? parent.parentElement.closest(".tree-node")
          : null;
      }
    }
  });

  // Scroll to first match
  if (firstMatchElement) {
    firstMatchElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Trigger click on the parent tree-content to show details
    const parentContent = firstMatchElement.closest(".tree-content");
    if (parentContent) {
      parentContent.click();
    }
  }

  // Show conflict details for the first match
  if (matches.length > 0) {
    showVersionConflicts(matches[0]);
  }
}

// Sort duplicate packages
export function sortDuplicatePackages(sortBy) {
  // Update active button
  document
    .querySelectorAll(".sort-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`sort-by-${sortBy}`).classList.add("active");

  // Get the list of duplicate packages
  const dupesList = document.getElementById("dupes-list");
  if (!dupesList) return;

  // Convert to array for sorting
  const duplicateEntries = Object.entries(state.duplicatePackages);

  // Sort based on criteria
  if (sortBy === "name") {
    duplicateEntries.sort((a, b) => a[0].localeCompare(b[0]));
  } else if (sortBy === "duplicates") {
    duplicateEntries.sort((a, b) => b[1].length - a[1].length);
  }

  // Rebuild the list
  dupesList.innerHTML = "";

  for (const [name, versions] of duplicateEntries) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<a href="#" onclick="searchPackage('${name}'); return false;">${name}</a> (${versions.length} versions)`;
    dupesList.appendChild(listItem);
  }
}

// Filter tree to show only nodes with specific version
export function filterTreeByVersion(packageName, version) {
  // First remove any existing filters
  clearTreeFilter();

  // Find all tree nodes with this package name
  const packageNodes = Array.from(
    document.querySelectorAll(".tree-name"),
  ).filter((node) => node.textContent === packageName);

  // For each node, check if it has the correct version and show/hide accordingly
  packageNodes.forEach((node) => {
    const versionElement = node.nextElementSibling;
    const nodeVersion = versionElement ? versionElement.textContent : "";
    const treeNode = node.closest(".tree-node");

    if (nodeVersion === version) {
      // Highlight this node
      node.closest(".tree-content").classList.add("version-match");

      // Make sure this node is visible by expanding all its parents
      let parent = treeNode.parentElement.closest(".tree-node");
      while (parent) {
        const childrenContainer = parent.querySelector(".tree-children");
        if (childrenContainer) childrenContainer.style.display = "block";

        const toggle = parent.querySelector(".tree-toggle");
        if (toggle) toggle.textContent = "▼";

        parent = parent.parentElement
          ? parent.parentElement.closest(".tree-node")
          : null;
      }
    } else {
      // Dim this node to indicate it's not the selected version
      node.closest(".tree-content").classList.add("version-non-match");
    }
  });

  // Show the clear filter button
  document.getElementById("clear-filter-btn").style.display = "block";
}

// Clear any version filters
export function clearTreeFilter() {
  document
    .querySelectorAll(".version-match, .version-non-match")
    .forEach((el) => {
      el.classList.remove("version-match", "version-non-match");
    });

  // Hide the clear filter button
  document.getElementById("clear-filter-btn").style.display = "none";
}

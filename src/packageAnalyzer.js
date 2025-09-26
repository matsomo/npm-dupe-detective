import { renderDependencyTree } from "./treeRenderer.js";
import { showLoader, hideLoader } from "./uiHelpers.js";
import {
  clearTreeFilter,
  sortDuplicatePackages,
  filterTreeByVersion,
} from "./searchAndFilter.js";
import state from "./state.js";

const detailsPanel = document.getElementById("details-panel");
const conflictList = document.getElementById("conflict-list");
const packageCount = document.getElementById("package-count");
const packageCountTotal = document.getElementById("package-count-total");
const statsContainer = document.getElementById("stats-container");
const dupesContainer = document.getElementById("dupes-container");

function compareVersions(a, b) {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  return 0;
}

// Process dependency data
export function processData(data) {
  showLoader("Processing dependency data...");
  state.setDependencyData(data);
  state.packageVersions = {};
  state.duplicatePackages = {};
  traverseDependencies(data.dependencies);

  // Find duplicate packages (packages with multiple versions)
  for (const [name, instances] of Object.entries(state.packageVersions)) {
    const versions = new Set(instances.map((i) => i.version));
    if (versions.size > 1) {
      state.addDuplicatePackage(name, Array.from(versions));
    }
  }

  renderDependencyTree(data);
  updateStats();
  hideLoader();
}

function traverseDependencies(deps, path = []) {
  for (const [name, info] of Object.entries(deps)) {
    const currentPath = [...path, name];

    if (!state.packageVersions[name]) {
      state.packageVersions[name] = [];
    }

    state.packageVersions[name].push({
      version: info.version,
      path: currentPath,
    });

    if (info.dependencies) {
      traverseDependencies(info.dependencies, currentPath);
    }
  }
}

export function showPackageDetails(name, version) {
  detailsPanel.innerHTML = `
    <h3>${name} <button id="clear-details-btn" class="clear-btn">Clear</button></h3>
    <p>Version: ${version}</p>
  `;

  document
    .getElementById("clear-details-btn")
    .addEventListener("click", clearPackageDetails);

  if (state.duplicatePackages[name]) {
    showVersionConflicts(name);
  }
}

export function clearPackageDetails() {
  detailsPanel.innerHTML = "<p>Select a package to view details</p>";
  conflictList.innerHTML = "";

  const highlightedElements = document.querySelectorAll(".highlight");
  highlightedElements.forEach((el) => {
    el.classList.remove("highlight");
  });

  clearTreeFilter();

  const selectedNode = document.querySelector(".tree-content.selected");
  if (selectedNode) {
    selectedNode.classList.remove("selected");
  }
}

export function showVersionConflicts(packageName) {
  if (
    !state.duplicatePackages[packageName] ||
    !state.packageVersions[packageName]
  ) {
    conflictList.innerHTML = "<p>No version conflicts for this package.</p>";
    return;
  }

  const versions = state.packageVersions[packageName];

  let html = `<p>Found ${versions.length} instances with ${state.duplicatePackages[packageName].length} different versions:</p>`;

  // Add expand/collapse all buttons
  const actionButtons = document.createElement("div");
  actionButtons.className = "conflict-actions";

  const expandAllBtn = document.createElement("button");
  expandAllBtn.className = "conflict-action-btn";
  expandAllBtn.textContent = "Expand All";
  expandAllBtn.addEventListener("click", () => {
    document
      .querySelectorAll(".conflict-content")
      .forEach((el) => (el.style.display = "block"));
    document
      .querySelectorAll(".conflict-toggle")
      .forEach((el) => (el.textContent = "▼"));
  });

  const collapseAllBtn = document.createElement("button");
  collapseAllBtn.className = "conflict-action-btn";
  collapseAllBtn.textContent = "Collapse All";
  collapseAllBtn.addEventListener("click", () => {
    document
      .querySelectorAll(".conflict-content")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(".conflict-toggle")
      .forEach((el) => (el.textContent = "▶"));
  });

  actionButtons.appendChild(expandAllBtn);
  actionButtons.appendChild(collapseAllBtn);

  conflictList.innerHTML = html;
  conflictList.appendChild(actionButtons);
  // Add a clear filter button to the conflict panel
  const clearFilterBtn = document.createElement("button");
  clearFilterBtn.id = "clear-filter-btn";
  clearFilterBtn.textContent = "Clear Filter";
  clearFilterBtn.style.display = "none";
  clearFilterBtn.addEventListener("click", clearTreeFilter);

  // Add it to the conflict panel if it doesn't exist yet
  if (!document.getElementById("clear-filter-btn")) {
    document
      .querySelector("#conflict-panel h3")
      .insertAdjacentElement("afterend", clearFilterBtn);
  }

  // Group by version
  const byVersion = {};
  for (const instance of versions) {
    if (!byVersion[instance.version]) {
      byVersion[instance.version] = [];
    }
    byVersion[instance.version].push(instance.path);
  }

  const sortedVersions = Object.keys(byVersion).sort((a, b) => {
    return compareVersions(b, a); // Use b, a to get descending order
  });

  for (const version of sortedVersions) {
    const paths = byVersion[version];
    const conflictItem = document.createElement("div");
    conflictItem.className = "conflict-item";

    // Create the collapsible header
    const header = document.createElement("div");
    header.className = "conflict-header";

    // Add a button to filter tree view by this version
    const filterBtn = document.createElement("button");
    filterBtn.className = "filter-version-btn";
    filterBtn.textContent = `Show only v${version}`;
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent toggling when clicking the button
      filterTreeByVersion(packageName, version);
    });

    // Create toggle indicator and header text
    const toggleSpan = document.createElement("span");
    toggleSpan.className = "conflict-toggle";
    toggleSpan.textContent = "▼";

    const headerText = document.createElement("span");
    headerText.innerHTML = `<strong>Version ${version}</strong> (${paths.length} instances)`;

    // Add elements to header
    header.appendChild(toggleSpan);
    header.appendChild(headerText);
    header.appendChild(filterBtn);

    // Create content container
    const content = document.createElement("div");
    content.className = "conflict-content";

    // Add paths to content
    let pathsHtml = "<ul>";
    for (const path of paths) {
      pathsHtml += `<li>${path.join(" → ")}</li>`;
    }
    pathsHtml += "</ul>";
    content.innerHTML = pathsHtml;

    // Add toggle functionality to header
    header.addEventListener("click", () => {
      if (content.style.display === "none") {
        content.style.display = "block";
        toggleSpan.textContent = "▼";
      } else {
        content.style.display = "none";
        toggleSpan.textContent = "▶";
      }
    });

    // Add header and content to the item
    conflictItem.appendChild(header);
    conflictItem.appendChild(content);

    // Add to conflict list
    conflictList.appendChild(conflictItem);
  }
}

// Update statistics
export function updateStats() {
  const totalPackages = Object.keys(state.packageVersions).length;
  const duplicates = Object.keys(state.duplicatePackages).length;

  packageCount.textContent = duplicates;
  packageCountTotal.textContent = totalPackages;

  if (duplicates > 0) {
    statsContainer.classList.add("has-conflicts");
  } else {
    statsContainer.classList.remove("has-conflicts");
  }

  // Show list of duplicate packages
  let dupeList = "<h3>Duplicate Packages</h3>";

  // Add sorting controls
  dupeList += `
    <div class="sort-controls">
      <button id="sort-by-name" class="sort-btn active">Sort by Name</button>
      <button id="sort-by-duplicates" class="sort-btn">Sort by Duplicates</button>
    </div>
  `;

  dupeList += "<ul id='dupes-list'>";

  // Convert to array for sorting
  const duplicateEntries = Object.entries(state.duplicatePackages);

  // Default sort by name
  duplicateEntries.sort((a, b) => a[0].localeCompare(b[0]));

  for (const [name, versions] of duplicateEntries) {
    dupeList += `<li><a href="#" onclick="searchPackage('${name}'); return false;">${name}</a> (${versions.length} versions)</li>`;
  }

  dupeList += "</ul>";
  dupesContainer.innerHTML = duplicates > 0 ? dupeList : "";

  // Add event listeners to sorting buttons
  if (duplicates > 0) {
    document
      .getElementById("sort-by-name")
      .addEventListener("click", () => sortDuplicatePackages("name"));
    document
      .getElementById("sort-by-duplicates")
      .addEventListener("click", () => sortDuplicatePackages("duplicates"));
  }
}

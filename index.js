// Variable to store dependency data
let dependencyData;
let packageVersions = {};
let duplicatePackages = {};

// DOM Elements
const fileInput = document.getElementById("file-input");
const treeContainer = document.getElementById("tree-container");
const detailsPanel = document.getElementById("details-panel");
const conflictList = document.getElementById("conflict-list");
const searchInput = document.getElementById("search-input");
const packageCount = document.getElementById("package-count");
const packageCountTotal = document.getElementById("package-count-total");
const statsContainer = document.getElementById("stats-container");
const dupesContainer = document.getElementById("dupes-container");
const loader = document.getElementById("loader");

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Event listeners
  fileInput.addEventListener("change", handleFileSelect);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchPackage(this.value);
    }
  });

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

  // Check for URL param with file path
  const urlParams = new URLSearchParams(window.location.search);
  const filePath = urlParams.get("file");

  if (filePath) {
    loadFileFromPath(filePath);
  }
});

// Load file from path
async function loadFileFromPath(path) {
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
function handleFileSelect(event) {
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

// Process dependency data
function processData(data) {
  showLoader("Processing dependency data...");

  // Store for later use
  dependencyData = data;

  // Extract and count package versions
  packageVersions = {};
  duplicatePackages = {};

  // Recursively gather package info
  function traverseDependencies(deps, path = []) {
    for (const [name, info] of Object.entries(deps)) {
      const currentPath = [...path, name];

      if (!packageVersions[name]) {
        packageVersions[name] = [];
      }

      packageVersions[name].push({
        version: info.version,
        path: currentPath,
      });

      if (info.dependencies) {
        traverseDependencies(info.dependencies, currentPath);
      }
    }
  }

  traverseDependencies(data.dependencies);

  // Find duplicate packages (packages with multiple versions)
  for (const [name, instances] of Object.entries(packageVersions)) {
    const versions = new Set(instances.map((i) => i.version));

    if (versions.size > 1) {
      duplicatePackages[name] = Array.from(versions);
    }
  }

  // Render tree
  renderDependencyTree(data);
  updateStats();
  hideLoader();
}

// Render dependency tree
function renderDependencyTree(data) {
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
function createDependencyNode(name, info) {
  const node = document.createElement("div");
  node.className = "tree-node";

  const content = document.createElement("div");
  content.className = "tree-content";

  // Determine if package has version conflicts
  const hasConflict = duplicatePackages[name] !== undefined;
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
      conflictList.innerHTML = "";
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

// Show package details
function showPackageDetails(name, version) {
  detailsPanel.innerHTML = `
    <h3>${name}</h3>
    <p>Version: ${version}</p>
  `;

  // If there are version conflicts, show them
  if (duplicatePackages[name]) {
    showVersionConflicts(name);
  }
}

// Show version conflicts for a package
function showVersionConflicts(packageName) {
  if (!duplicatePackages[packageName] || !packageVersions[packageName]) {
    conflictList.innerHTML = "<p>No version conflicts for this package.</p>";
    return;
  }

  const versions = packageVersions[packageName];

  let html = `<p>Found ${versions.length} instances with ${duplicatePackages[packageName].length} different versions:</p>`;
  conflictList.innerHTML = html;

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

  for (const [version, paths] of Object.entries(byVersion)) {
    const conflictItem = document.createElement("div");
    conflictItem.className = "conflict-item";

    let pathsHtml = "<ul>";
    for (const path of paths) {
      pathsHtml += `<li>${path.join(" → ")}</li>`;
    }
    pathsHtml += "</ul>";

    // Add a button to filter tree view by this version
    const filterBtn = document.createElement("button");
    filterBtn.className = "filter-version-btn";
    filterBtn.textContent = `Show only version ${version}`;
    filterBtn.addEventListener("click", () =>
      filterTreeByVersion(packageName, version),
    );

    conflictItem.innerHTML = `
      <strong>Version ${version}</strong> (${paths.length} instances)
      ${pathsHtml}
    `;

    conflictItem.prepend(filterBtn);
    conflictList.appendChild(conflictItem);
  }
}

// Search for packages
function searchPackage(term) {
  if (!term.trim() || !dependencyData) return;

  const searchTerm = term.trim().toLowerCase();
  const matches = [];

  // Find all matching packages
  for (const [name, instances] of Object.entries(packageVersions)) {
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

// Toggle tree nodes
function addToggleFunctionality() {
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
function expandAll() {
  document.querySelectorAll(".tree-children").forEach((container) => {
    container.style.display = "block";
  });

  document.querySelectorAll(".tree-toggle").forEach((toggle) => {
    toggle.textContent = "▼";
  });
}

// Collapse all tree nodes
function collapseAll() {
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

// Update statistics
function updateStats() {
  const totalPackages = Object.keys(packageVersions).length;
  const duplicates = Object.keys(duplicatePackages).length;
  const duplicatePercentage = Math.round((duplicates / totalPackages) * 100);

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
  const duplicateEntries = Object.entries(duplicatePackages);

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

// Sort duplicate packages
function sortDuplicatePackages(sortBy) {
  // Update active button
  document
    .querySelectorAll(".sort-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`sort-by-${sortBy}`).classList.add("active");

  // Get the list of duplicate packages
  const dupesList = document.getElementById("dupes-list");
  if (!dupesList) return;

  // Convert to array for sorting
  const duplicateEntries = Object.entries(duplicatePackages);

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
function filterTreeByVersion(packageName, version) {
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
function clearTreeFilter() {
  document
    .querySelectorAll(".version-match, .version-non-match")
    .forEach((el) => {
      el.classList.remove("version-match", "version-non-match");
    });

  // Hide the clear filter button
  document.getElementById("clear-filter-btn").style.display = "none";
}

// Show loader with custom message
function showLoader(message = "Loading...") {
  document.getElementById("loader-message").textContent = message;
  loader.style.display = "flex";
}

// Hide loader
function hideLoader() {
  loader.style.display = "none";
}

// Example URL handler for the demo
function loadExample() {
  loadFileFromPath("example-dependency.json");
}

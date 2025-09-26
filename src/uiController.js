import { searchPackage } from "./searchAndFilter.js";
import { expandAll, collapseAll } from "./treeRenderer.js";

// dom elements
const searchInput = document.getElementById("search-input");

export function setupUIHandlers() {
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchPackage(this.value);
    }
  });

  window.searchPackage = searchPackage;
  window.expandAll = expandAll;
  window.collapseAll = collapseAll;
}

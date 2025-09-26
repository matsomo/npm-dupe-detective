import {
  searchPackage,
  sortDuplicatePackages,
  filterTreeByVersion,
  clearTreeFilter,
} from "./searchAndFilter.js";
import { loadExample } from "./fileHandler.js";
import { expandAll, collapseAll } from "./treeRenderer.js";
import {
  showPackageDetails,
  showVersionConflicts,
  clearPackageDetails,
} from "./packageAnalyzer.js";

// Expose functions to window for HTML event handlers
window.searchPackage = searchPackage;
window.sortDuplicatePackages = sortDuplicatePackages;
window.filterTreeByVersion = filterTreeByVersion;
window.clearTreeFilter = clearTreeFilter;
window.loadExample = loadExample;
window.expandAll = expandAll;
window.collapseAll = collapseAll;
window.showPackageDetails = showPackageDetails;
window.showVersionConflicts = showVersionConflicts;
window.clearPackageDetails = clearPackageDetails;

export default "shared";

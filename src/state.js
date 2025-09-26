const state = {
  dependencyData: null,
  packageVersions: {},
  duplicatePackages: {},

  setDependencyData(data) {
    this.dependencyData = data;
  },

  addDuplicatePackage(name, versions) {
    this.duplicatePackages[name] = versions;
  },
};

export default state;

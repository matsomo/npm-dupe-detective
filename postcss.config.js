module.exports = {
  plugins: [
    require("postcss-import")({
      path: ["src/css"],
    }),
    require("postcss-preset-env")(),
  ],
};

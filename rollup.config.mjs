import postcss from "rollup-plugin-postcss";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "src/index.js",
  output: {
    file: "bundle.js",
    format: "iife",
  },
  plugins: [
    postcss({
      extract: true,
      minimize: true,
      sourceMap: true,
      use: ["sass"],
      extensions: [".css"],
      modules: false,
      autoModules: false,
      config: {
        path: path.resolve(__dirname, "./postcss.config.js"),
      },
    }),
  ],
};

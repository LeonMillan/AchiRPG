import fs from 'fs/promises';
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";

const extensions = [".ts", ".js"];
const preset = {
  output: {
    format: "iife",
    globals: {
      "archipelago.js": "ArchiLib",
      "@leonmillan/rpgmaker-ts/lib/mv": "window",
    },
  },
  external: [
    "archipelago.js",
    "@leonmillan/rpgmaker-ts/lib/global",
    "@leonmillan/rpgmaker-ts/lib/mv",
  ],
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      babelHelpers: "bundled",
    }),
  ],
  treeshake: false,
};

export default [
  {
    ...preset,
    input: "src/core/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG.js",
      banner: async () => fs.readFile("./src/core/header.js", { encoding: "utf8" }),
    },
  },
  {
    ...preset,
    input: "src/connect/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG_Connect.js",
      banner: async () => fs.readFile("./src/connect/header.js", { encoding: "utf8" }),
    },
  },
  {
    ...preset,
    input: "src/notifications/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG_Notifications.js",
      banner: async () => fs.readFile("./src/notifications/header.js", { encoding: "utf8" }),
    },
  },
  {
    ...preset,
    input: "src/items/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG_Items.js",
      banner: async () => fs.readFile("./src/items/header.js", { encoding: "utf8" }),
    },
  },
  {
    ...preset,
    input: "src/deathlink/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG_Deathlink.js",
      banner: async () => fs.readFile("./src/deathlink/header.js", { encoding: "utf8" }),
    },
  },
  {
    ...preset,
    input: "src/patcher/main.ts",
    output: {
      ...preset.output,
      file: "dist/ArchiRPG_Patcher.js",
      banner: async () => fs.readFile("./src/patcher/header.js", { encoding: "utf8" }),
    },
  },
];

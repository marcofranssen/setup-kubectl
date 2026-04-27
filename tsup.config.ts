import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  outDir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  dts: false,
  noExternal: [/.*/],
  banner: {
    js: `import{createRequire}from"module";const require=createRequire(import.meta.url);`,
  },
});

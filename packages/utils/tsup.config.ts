import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  splitting: false,
  bundle: true,
  sourcemap: false,
  clean: true,
  target: "es2020",
  esbuildOptions(options, context) {
    if (context.format === "esm") {
      options.outExtension = { ".js": ".mjs" };
    }
    if (context.format === "cjs") {
      options.outExtension = { ".js": ".js" };
    }
  },
});

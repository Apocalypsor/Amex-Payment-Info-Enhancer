#!/usr/bin/env bun

async function build() {
  console.log("Building userscript...");

  try {
    // Read userscript header template
    const headerTemplate = await Bun.file("./src/userscript-header.txt").text();

    // Get version from package.json or environment variable (for CI)
    const packageJson = await Bun.file("./package.json").json();
    const version = process.env.VERSION || packageJson.version;

    // Replace version placeholder
    const userscriptHeader = headerTemplate.replace("{{VERSION}}", version);

    // Build with Bun
    const result = await Bun.build({
      entrypoints: ["./src/index.ts"],
      target: "browser",
      minify: false,
      format: "iife",
    });

    if (!result.outputs || result.outputs.length === 0) {
      console.error("Build failed: No outputs generated");
      process.exit(1);
    }

    // Get the built code
    let code = await result.outputs[0]!.text();

    // Wrap in IIFE if not already wrapped
    if (!code.trim().startsWith("(function")) {
      code = `(function () {
  "use strict";
${code}
})();`;
    }

    // Combine header with built code
    const finalScript = userscriptHeader + code;

    // Write to dist folder
    const distPath = "./dist/amex-payment-info-enhancer.user.js";
    await Bun.write(distPath, finalScript);

    console.log(`✓ Build complete: ${distPath}`);
    console.log(`  Version: ${version}`);
    console.log(`  Size: ${(finalScript.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();

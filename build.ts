#!/usr/bin/env bun

const userscriptHeader = `// ==UserScript==
// @name         Amex Payment Info Enhancer
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  Enhance payment info on Amex Travel, Uber Eats, Resy, and Saks Fifth Avenue.
// @author       Apocalypsor
// @match        https://www.travel.americanexpress.com/en-us/book/accommodations/*
// @match        https://www.ubereats.com/*
// @match        https://resy.com/*
// @match        https://widgets.resy.com/*
// @match        https://www.saksfifthavenue.com/*
// @grant        none
// @run-at       document-start
// @downloadURL https://git.dov.moe/dov/Scripts/raw/branch/main/UserScript/amex-payment-info-enhancer.user.js
// @updateURL https://git.dov.moe/dov/Scripts/raw/branch/main/UserScript/amex-payment-info-enhancer.user.js
// ==/UserScript==

`;

async function build() {
  console.log("Building userscript...");

  try {
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
    console.log(`  Size: ${(finalScript.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();

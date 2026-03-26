import { AmexEnhancer } from "./enhancers/amex";
import { ResyEnhancer } from "./enhancers/resy";
import { SaksEnhancer } from "./enhancers/saks";
import { UberEnhancer } from "./enhancers/uber";

/**
 * Initialize all site enhancers
 * Each enhancer will check if it should be active on the current page
 */
function init(): void {
  const enhancers = [
    new UberEnhancer(),
    new ResyEnhancer(),
    new AmexEnhancer(),
    new SaksEnhancer(),
  ];

  // Initialize all enhancers
  // Each will only activate if shouldActivate() returns true
  for (const enhancer of enhancers) {
    enhancer.init();
  }
}

// Start the script
init();

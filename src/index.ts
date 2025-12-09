import { UberEnhancer } from "./enhancers/uber";
import { ResyEnhancer } from "./enhancers/resy";
import { AmexEnhancer } from "./enhancers/amex";
import { SaksEnhancer } from "./enhancers/saks";

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
  enhancers.forEach((enhancer) => enhancer.init());
}

// Start the script
init();

import { SiteEnhancer } from "./base";

export class AmexEnhancer extends SiteEnhancer {
  protected siteName = "Amex Travel";
  private processed = false;

  shouldActivate(): boolean {
    return (
      window.location.hostname.includes("travel.americanexpress.com") &&
      window.location.pathname.includes("book/accommodations/checkout")
    );
  }

  setupInterceptor(): void {
    // Amex doesn't need XHR interception
  }

  updatePage(): void {
    if (this.processed) return; // Run only once

    const selectElement = document.querySelector(
      'select[data-testid="card-payment-select-input"]'
    );
    if (selectElement) {
      const options = selectElement.querySelectorAll("option");
      if (options.length === 0) return; // Wait for options to populate

      options.forEach((option) => {
        const match = option.textContent?.match(/\(.*\)/);
        const parenthesesText = match ? ` ${match[0]}` : "";
        option.textContent =
          (option as HTMLOptionElement).value + parenthesesText;
      });

      this.processed = true; // Mark as done
    }
  }
}

import { SiteEnhancer } from "./base";

export class SaksEnhancer extends SiteEnhancer {
  protected siteName = "Saks Fifth Avenue";

  shouldActivate(): boolean {
    return (
      window.location.hostname.includes("saksfifthavenue.com") &&
      window.location.pathname.includes("/checkout")
    );
  }

  setupInterceptor(): void {
    // Saks doesn't need XHR interception
  }

  updatePage(): void {
    document
      .querySelectorAll(".saved-credit-card-expiration-date.d-none")
      .forEach((el) => {
        el.classList.remove("d-none");
      });
  }
}

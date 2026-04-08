import type {
  ResyDepositInfo,
  ResyPaymentMethod,
  ResySearchResponse,
  ResyUserResponse,
} from "../types";
import { SiteEnhancer } from "./base";

export class ResyEnhancer extends SiteEnhancer {
  protected siteName = "Resy";
  private paymentInfo: ResyPaymentMethod[] | null = null;
  private venueDeposits = new Map<number, ResyDepositInfo>();

  shouldActivate(): boolean {
    return (
      window.location.hostname === "resy.com" ||
      window.location.hostname === "widgets.resy.com"
    );
  }

  setupInterceptor(): void {
    if (window.location.hostname === "resy.com") {
      this.setupAccountInterceptor();
      this.setupSearchInterceptor();
    } else if (window.location.hostname === "widgets.resy.com") {
      this.setupWidgetInterceptor();
    }
  }

  protected override onPathChange(): void {
    this.venueDeposits.clear();
  }

  updatePage(): void {
    const path = window.location.pathname;

    if (
      window.location.hostname === "resy.com" &&
      path.startsWith("/account/payment-methods")
    ) {
      this.updateAccountPage();
    } else if (
      window.location.hostname === "resy.com" &&
      path.startsWith("/cities/")
    ) {
      this.updateSearchPage();
    } else if (window.location.hostname === "widgets.resy.com") {
      this.updateWidgetPage();
    }
  }

  private setupAccountInterceptor(): void {
    this.interceptXHR(
      (url) => url.startsWith("https://api.resy.com/2/user"),
      (data: ResyUserResponse) => {
        if (data?.payment_methods) {
          this.paymentInfo = data.payment_methods;
        }
      },
    );
  }

  private setupWidgetInterceptor(): void {
    this.interceptXHR(
      (url) => url.startsWith("https://api.resy.com/2/user"),
      (data: ResyUserResponse) => {
        if (data?.payment_methods) {
          this.paymentInfo = data.payment_methods;
        }
      },
    );
  }

  private setupSearchInterceptor(): void {
    this.interceptXHR(
      (url) => url === "https://api.resy.com/3/venuesearch/search",
      (data: ResySearchResponse) => {
        this.processSearchData(data);
      },
    );
  }

  private updateAccountPage(): void {
    if (this.paymentInfo) {
      const paymentContainers = document.querySelectorAll(
        ".AccountPaymentMethodRow",
      );
      if (paymentContainers.length === this.paymentInfo.length) {
        this.paymentInfo.forEach((foundPayment, index) => {
          const container = paymentContainers[index];
          if (!container) return;

          const cardDisplaySpan = container.querySelector(
            ".AccountPaymentMethodRow__bullets + span",
          );
          if (
            cardDisplaySpan &&
            !cardDisplaySpan.textContent?.includes("Exp:")
          ) {
            const expMonth = String(foundPayment.exp_month).padStart(2, "0");
            const expYear = String(foundPayment.exp_year).slice(-2);
            cardDisplaySpan.textContent += ` (Exp: ${expMonth}/${expYear})`;
          }
        });
      }
    }
  }

  private updateWidgetPage(): void {
    if (!this.paymentInfo) return;

    const selectElement = document.querySelector(
      "select#payment_method",
    ) as HTMLSelectElement | null;
    if (!selectElement) return;

    this.paymentInfo.forEach((foundPayment) => {
      const optionElement = selectElement.querySelector(
        `option[value="${foundPayment.id}"]`,
      ) as HTMLOptionElement | null;
      if (optionElement && !optionElement.textContent?.includes("Exp:")) {
        const expMonth = String(foundPayment.exp_month).padStart(2, "0");
        const expYear = String(foundPayment.exp_year).slice(-2);
        const originalLabel = optionElement.label.split(" (Exp:")[0];
        const newText = `${originalLabel} (Exp: ${expMonth}/${expYear})`;
        optionElement.textContent = newText;
        optionElement.label = newText;
      }
    });
  }

  private updateSearchPage(): void {
    const searchResults = document.querySelectorAll(
      ".SearchResult.SearchResult--bordered",
    );

    searchResults.forEach((result, index) => {
      if (result.querySelector(".deposit-info")) return;

      const depositInfo = this.venueDeposits.get(index);
      const titleContainer = result.querySelector(
        ".SearchResult__title--container",
      );
      if (titleContainer) {
        const depositElement = document.createElement("span");
        depositElement.className = "deposit-info";
        depositElement.style.cssText =
          "color: #e63946; font-weight: 500; margin-left: 8px; font-size: 14px;";

        if (depositInfo?.hasDeposit) {
          depositElement.textContent = "Require Deposit";
        } else {
          depositElement.textContent = "No Deposit";
          depositElement.style.color = "#28a745";
        }
        titleContainer.appendChild(depositElement);
      }
    });
  }

  private processSearchData(data: ResySearchResponse): void {
    if (data?.search?.hits) {
      this.venueDeposits.clear();
      data.search.hits.forEach((result, index) => {
        if (result.id?.resy) {
          let hasDeposit = false;
          let depositFee: number | null = null;
          if (result.availability?.templates) {
            const templates = result.availability.templates;
            for (const templateId in templates) {
              const template = templates[templateId];
              if (template?.deposit_fee && template.deposit_fee > 0) {
                hasDeposit = true;
                depositFee = template.deposit_fee;
                break;
              }
            }
          }
          const depositInfo = {
            fee: depositFee,
            hasDeposit: hasDeposit,
          };
          this.venueDeposits.set(index, depositInfo);
        }
      });
      // Update the DOM after processing data
      setTimeout(() => this.updateSearchPage(), 500);
    }
  }
}

import { SiteEnhancer } from "./base";
import type { UberApiResponse, UberCardInfo } from "../types";

export class UberEnhancer extends SiteEnhancer {
  protected siteName = "Uber Eats";
  private cardInfo: Record<string, UberCardInfo> = {};
  private dataProcessed = false;
  private processedCardIds = new Set<string>();
  private lastHref = "";

  shouldActivate(): boolean {
    return window.location.hostname.includes("ubereats.com");
  }

  setupInterceptor(): void {
    this.interceptXHR(
      (url) =>
        url.startsWith("https://payments.ubereats.com/_api/payment-profiles"),
      (data: UberApiResponse) => {
        if (!this.dataProcessed) {
          this.processApiData(data);
          this.dataProcessed = true;
        }
      }
    );
  }

  updatePage(): void {
    // Reset processed cards if navigating to a new page
    const currentHref = window.location.href;
    if (currentHref !== this.lastHref) {
      this.processedCardIds.clear();
      this.lastHref = currentHref;
    }

    const paymentHeader = Array.from(
      document.querySelectorAll("div, span, p")
    ).find(
      (el) =>
        el.textContent?.trim() === "Payment" ||
        el.textContent?.trim() === "付款方式"
    );

    if (paymentHeader && this.dataProcessed) {
      const parentContainer = paymentHeader.parentElement;
      if (parentContainer) {
        const cardLabels = parentContainer.querySelectorAll("label");
        cardLabels.forEach((label) => {
          const cardId = label.getAttribute("for");
          if (cardId && !this.processedCardIds.has(cardId)) {
            const cardInput = document.getElementById(
              cardId
            ) as HTMLInputElement | null;
            const cardUUID = cardInput ? cardInput.value : null;

            if (cardUUID && this.cardInfo[cardUUID]) {
              const info = this.cardInfo[cardUUID];
              const cardImage = label.querySelector("img");
              let cardInfoDiv: Element | null = null;

              if (cardImage) {
                let sibling = cardImage.nextElementSibling;
                while (sibling) {
                  if (
                    sibling.tagName === "DIV" &&
                    sibling.textContent?.includes("••••")
                  ) {
                    cardInfoDiv = sibling;
                    break;
                  }
                  sibling = sibling.nextElementSibling;
                }
              }

              if (cardInfoDiv) {
                const originalText = cardInfoDiv.textContent?.trim();
                if (originalText && !originalText.includes(info.bin)) {
                  cardInfoDiv.textContent = `${info.cardType} ${info.bin} ${info.last4} (${info.expiration})`;
                  this.processedCardIds.add(cardId);
                }
              }
            }
          }
        });
      }
    }
  }

  private processApiData(data: UberApiResponse): void {
    if (data && data.availablePaymentProfiles) {
      data.availablePaymentProfiles.forEach((profile) => {
        if (profile.uuid && profile.cardNumber && profile.cardExpiration) {
          this.cardInfo[profile.uuid] = {
            cardType: profile.cardType,
            bin: profile.cardBin,
            last4: "••••" + profile.cardNumber,
            expiration: profile.cardExpiration,
          };
        }
      });
    }
  }
}

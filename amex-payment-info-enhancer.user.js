// ==UserScript==
// @name         Amex Payment Info Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Shows last 5 digits of Amex cards
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

(function () {
  "use strict";
(() => {
  // src/enhancers/base.ts
  class SiteEnhancer {
    interceptorSetup = false;
    init() {
      this.observeDOM();
    }
    checkAndActivate() {
      if (this.shouldActivate()) {
        if (!this.interceptorSetup) {
          this.setupInterceptor();
          this.interceptorSetup = true;
        }
        this.updatePage();
      }
    }
    observeDOM() {
      if (document.body) {
        const observer = new MutationObserver(() => this.checkAndActivate());
        observer.observe(document.body, { childList: true, subtree: true });
        this.checkAndActivate();
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          const observer = new MutationObserver(() => this.checkAndActivate());
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          this.checkAndActivate();
        }, { once: true });
      }
    }
    interceptXHR(urlMatcher, onResponse) {
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR;
        let url;
        const originalOpen = xhr.open;
        xhr.open = function(method, requestUrl, ...args) {
          url = requestUrl;
          return originalOpen.apply(this, arguments);
        };
        const originalSend = xhr.send;
        xhr.send = function(...args) {
          if (url && urlMatcher(url)) {
            xhr.addEventListener("load", function() {
              if (this.readyState === 4 && this.status === 200) {
                try {
                  const responseData = JSON.parse(this.responseText);
                  onResponse(responseData);
                } catch (e) {
                  console.error("Error parsing API response:", e);
                }
              }
            });
          }
          return originalSend.apply(this, arguments);
        };
        return xhr;
      };
    }
  }

  // src/enhancers/uber.ts
  class UberEnhancer extends SiteEnhancer {
    siteName = "Uber Eats";
    cardInfo = {};
    dataProcessed = false;
    processedCardIds = new Set;
    lastHref = "";
    shouldActivate() {
      return window.location.hostname.includes("ubereats.com");
    }
    setupInterceptor() {
      this.interceptXHR((url) => url.startsWith("https://payments.ubereats.com/_api/payment-profiles"), (data) => {
        if (!this.dataProcessed) {
          this.processApiData(data);
          this.dataProcessed = true;
        }
      });
    }
    updatePage() {
      const currentHref = window.location.href;
      if (currentHref !== this.lastHref) {
        this.processedCardIds.clear();
        this.lastHref = currentHref;
      }
      const paymentHeader = Array.from(document.querySelectorAll("div, span, p")).find((el) => el.textContent?.trim() === "Payment" || el.textContent?.trim() === "付款方式");
      if (paymentHeader && this.dataProcessed) {
        const parentContainer = paymentHeader.parentElement;
        if (parentContainer) {
          const cardLabels = parentContainer.querySelectorAll("label");
          cardLabels.forEach((label) => {
            const cardId = label.getAttribute("for");
            if (cardId && !this.processedCardIds.has(cardId)) {
              const cardInput = document.getElementById(cardId);
              const cardUUID = cardInput ? cardInput.value : null;
              if (cardUUID && this.cardInfo[cardUUID]) {
                const info = this.cardInfo[cardUUID];
                const cardImage = label.querySelector("img");
                let cardInfoDiv = null;
                if (cardImage) {
                  let sibling = cardImage.nextElementSibling;
                  while (sibling) {
                    if (sibling.tagName === "DIV" && sibling.textContent?.includes("••••")) {
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
    processApiData(data) {
      if (data && data.availablePaymentProfiles) {
        data.availablePaymentProfiles.forEach((profile) => {
          if (profile.uuid && profile.cardNumber && profile.cardExpiration) {
            this.cardInfo[profile.uuid] = {
              cardType: profile.cardType,
              bin: profile.cardBin,
              last4: "••••" + profile.cardNumber,
              expiration: profile.cardExpiration
            };
          }
        });
      }
    }
  }

  // src/enhancers/resy.ts
  class ResyEnhancer extends SiteEnhancer {
    siteName = "Resy";
    paymentInfo = null;
    dataProcessed = false;
    venueDeposits = new Map;
    shouldActivate() {
      return window.location.hostname === "resy.com" || window.location.hostname === "widgets.resy.com";
    }
    setupInterceptor() {
      const path = window.location.pathname;
      if (window.location.hostname === "resy.com" && path.startsWith("/account/payment-methods")) {
        this.setupAccountInterceptor();
      } else if (window.location.hostname === "resy.com" && path.startsWith("/cities/")) {
        this.setupSearchInterceptor();
      } else if (window.location.hostname === "widgets.resy.com") {
        this.setupWidgetInterceptor();
      }
    }
    updatePage() {
      const path = window.location.pathname;
      if (window.location.hostname === "resy.com" && path.startsWith("/account/payment-methods")) {
        this.updateAccountPage();
      } else if (window.location.hostname === "resy.com" && path.startsWith("/cities/")) {
        this.updateSearchPage();
      } else if (window.location.hostname === "widgets.resy.com") {
        this.updateWidgetPage();
      }
    }
    setupAccountInterceptor() {
      this.interceptXHR((url) => url.startsWith("https://api.resy.com/2/user"), (data) => {
        if (!this.dataProcessed && data && data.payment_methods) {
          this.paymentInfo = data.payment_methods;
          this.dataProcessed = true;
        }
      });
    }
    setupWidgetInterceptor() {
      this.interceptXHR((url) => url.startsWith("https://api.resy.com/2/user"), (data) => {
        if (!this.dataProcessed && data && data.payment_methods) {
          this.paymentInfo = data.payment_methods;
          this.dataProcessed = true;
        }
      });
    }
    setupSearchInterceptor() {
      this.interceptXHR((url) => url === "https://api.resy.com/3/venuesearch/search", (data) => {
        this.processSearchData(data);
      });
    }
    updateAccountPage() {
      if (this.paymentInfo && this.dataProcessed) {
        const paymentContainers = document.querySelectorAll(".AccountPaymentMethodRow");
        if (paymentContainers.length === this.paymentInfo.length) {
          this.paymentInfo.forEach((foundPayment, index) => {
            const container = paymentContainers[index];
            if (!container)
              return;
            const cardDisplaySpan = container.querySelector(".AccountPaymentMethodRow__bullets + span");
            if (cardDisplaySpan && !cardDisplaySpan.textContent?.includes("Exp:")) {
              const expMonth = String(foundPayment.exp_month).padStart(2, "0");
              const expYear = String(foundPayment.exp_year).slice(-2);
              cardDisplaySpan.textContent += ` (Exp: ${expMonth}/${expYear})`;
            }
          });
        }
      }
    }
    updateWidgetPage() {
      if (!this.paymentInfo || !this.dataProcessed)
        return;
      const selectElement = document.querySelector("select#payment_method");
      if (!selectElement)
        return;
      this.paymentInfo.forEach((foundPayment) => {
        const optionElement = selectElement.querySelector(`option[value="${foundPayment.id}"]`);
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
    updateSearchPage() {
      const searchResults = document.querySelectorAll(".SearchResult.SearchResult--bordered");
      searchResults.forEach((result, index) => {
        if (result.querySelector(".deposit-info"))
          return;
        const depositInfo = this.venueDeposits.get(index);
        const titleContainer = result.querySelector(".SearchResult__title--container");
        if (titleContainer) {
          const depositElement = document.createElement("span");
          depositElement.className = "deposit-info";
          depositElement.style.cssText = "color: #e63946; font-weight: 500; margin-left: 8px; font-size: 14px;";
          if (depositInfo && depositInfo.hasDeposit) {
            depositElement.textContent = "Require Deposit";
          } else {
            depositElement.textContent = "No Deposit";
            depositElement.style.color = "#28a745";
          }
          titleContainer.appendChild(depositElement);
        }
      });
    }
    processSearchData(data) {
      if (data && data.search && data.search.hits) {
        this.venueDeposits.clear();
        data.search.hits.forEach((result, index) => {
          if (result.id && result.id.resy) {
            let hasDeposit = false;
            let depositFee = null;
            if (result.availability && result.availability.templates) {
              const templates = result.availability.templates;
              for (const templateId in templates) {
                const template = templates[templateId];
                if (template && template.deposit_fee && template.deposit_fee > 0) {
                  hasDeposit = true;
                  depositFee = template.deposit_fee;
                  break;
                }
              }
            }
            const depositInfo = {
              fee: depositFee,
              hasDeposit
            };
            this.venueDeposits.set(index, depositInfo);
          }
        });
        setTimeout(() => this.updateSearchPage(), 500);
      }
    }
  }

  // src/enhancers/amex.ts
  class AmexEnhancer extends SiteEnhancer {
    siteName = "Amex Travel";
    processed = false;
    shouldActivate() {
      return window.location.hostname.includes("travel.americanexpress.com") && window.location.pathname.includes("book/accommodations/checkout");
    }
    setupInterceptor() {}
    updatePage() {
      if (this.processed)
        return;
      const selectElement = document.querySelector('select[data-testid="card-payment-select-input"]');
      if (selectElement) {
        const options = selectElement.querySelectorAll("option");
        if (options.length === 0)
          return;
        options.forEach((option) => {
          const match = option.textContent?.match(/\(.*\)/);
          const parenthesesText = match ? ` ${match[0]}` : "";
          option.textContent = option.value + parenthesesText;
        });
        this.processed = true;
      }
    }
  }

  // src/enhancers/saks.ts
  class SaksEnhancer extends SiteEnhancer {
    siteName = "Saks Fifth Avenue";
    shouldActivate() {
      return window.location.hostname.includes("saksfifthavenue.com") && window.location.pathname.includes("/checkout");
    }
    setupInterceptor() {}
    updatePage() {
      document.querySelectorAll(".saved-credit-card-expiration-date.d-none").forEach((el) => {
        el.classList.remove("d-none");
      });
    }
  }

  // src/index.ts
  function init() {
    const enhancers = [
      new UberEnhancer,
      new ResyEnhancer,
      new AmexEnhancer,
      new SaksEnhancer
    ];
    enhancers.forEach((enhancer) => enhancer.init());
  }
  init();
})();

})();
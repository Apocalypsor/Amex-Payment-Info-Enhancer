/**
 * Abstract base class for site-specific payment info enhancers
 * Each site (Uber, Resy, Amex, Saks) extends this class and implements
 * the required methods for XHR interception and DOM updates
 */
export abstract class SiteEnhancer {
  protected abstract siteName: string;
  private interceptorSetup = false;

  /**
   * Setup XHR interceptors for this site
   * Called once during initialization
   */
  abstract setupInterceptor(): void;

  /**
   * Update the DOM with enhanced payment information
   * Called by MutationObserver on DOM changes
   */
  abstract updatePage(): void;

  /**
   * Check if this enhancer should be active on the current page
   */
  abstract shouldActivate(): boolean;

  /**
   * Initialize the enhancer
   * Sets up interceptor and starts observing DOM changes
   */
  init(): void {
    this.observeDOM();
  }

  /**
   * Check and activate the enhancer if on the right page
   * Sets up interceptor on first activation and updates the page
   */
  private checkAndActivate(): void {
    if (this.shouldActivate()) {
      // Setup interceptor on first activation
      if (!this.interceptorSetup) {
        this.setupInterceptor();
        this.interceptorSetup = true;
      }
      this.updatePage();
    }
  }

  /**
   * Poll for DOM changes at a fixed interval
   */
  protected observeDOM(): void {
    const start = () => {
      this.checkAndActivate();
      setInterval(() => this.checkAndActivate(), 1000);
    };

    if (document.body) {
      start();
    } else {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    }
  }

  /**
   * Helper method to setup XHR interception with a custom handler
   */
  protected interceptXHR(
    urlMatcher: (url: string) => boolean,
    onResponse: (data: any) => void,
  ): void {
    const originalXHR = window.XMLHttpRequest;
    (window.XMLHttpRequest as any) = () => {
      const xhr = new originalXHR();
      let url: string;
      const originalOpen = xhr.open;

      xhr.open = function (
        _method: string,
        requestUrl: string,
        ...rest: any[]
      ) {
        url = requestUrl;
        return originalOpen.apply(this, [_method, requestUrl, ...rest] as [
          string,
          string | URL,
          boolean,
          string?,
          string?,
        ]);
      };

      const originalSend = xhr.send;
      xhr.send = function (...args: any[]) {
        if (url && urlMatcher(url)) {
          xhr.addEventListener("load", function (this: XMLHttpRequest) {
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
        return originalSend.apply(
          this,
          args as [body?: Document | XMLHttpRequestBodyInit | null],
        );
      };
      return xhr;
    };
  }
}

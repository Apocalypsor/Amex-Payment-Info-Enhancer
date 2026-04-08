/**
 * Abstract base class for site-specific payment info enhancers
 * Each site (Uber, Resy, Amex, Saks) extends this class and implements
 * the required methods for XHR interception and DOM updates
 */
type XHRInterceptor = {
  urlMatcher: (url: string) => boolean;
  onResponse: (data: any) => void;
};

const xhrInterceptors: XHRInterceptor[] = [];
const requestUrls = new WeakMap<XMLHttpRequest, string>();
let xhrPatchInstalled = false;

function installXHRPatch(): void {
  if (xhrPatchInstalled) {
    return;
  }

  xhrPatchInstalled = true;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    requestUrl: string | URL,
    ...rest: any[]
  ) {
    requestUrls.set(this, String(requestUrl));
    const async = typeof rest[0] === "boolean" ? rest[0] : true;
    return originalOpen.apply(this, [
      method,
      requestUrl,
      async,
      rest[1],
      rest[2],
    ] as [string, string | URL, boolean, string?, string?]);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    ...args: any[]
  ) {
    const url = requestUrls.get(this);

    if (url) {
      for (const interceptor of xhrInterceptors) {
        if (!interceptor.urlMatcher(url)) {
          continue;
        }

        this.addEventListener("load", function () {
          if (this.readyState === 4 && this.status === 200) {
            try {
              const responseData = JSON.parse(this.responseText);
              interceptor.onResponse(responseData);
            } catch (error) {
              console.error("Error parsing API response:", error);
            }
          }
        });
      }
    }

    return originalSend.apply(
      this,
      args as [body?: Document | XMLHttpRequestBodyInit | null],
    );
  };
}

export abstract class SiteEnhancer {
  protected abstract siteName: string;
  private interceptorSetup = false;
  private lastPath = "";

  /**
   * Setup XHR interceptors for this site
   * Called once per hostname — register all interceptors needed for this host
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
   * Called when the pathname changes while the enhancer is active.
   * Override to reset state flags (e.g. dataProcessed).
   */
  protected onPathChange(): void {}

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
      if (!this.interceptorSetup) {
        this.setupInterceptor();
        this.interceptorSetup = true;
      }

      const currentPath = window.location.pathname;
      if (this.lastPath && this.lastPath !== currentPath) {
        this.onPathChange();
      }
      this.lastPath = currentPath;

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
    xhrInterceptors.push({ urlMatcher, onResponse });
    installXHRPatch();
  }
}

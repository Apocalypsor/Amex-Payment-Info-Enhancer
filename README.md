# Amex Payment Info Enhancer

[![Release](https://img.shields.io/github/v/release/Apocalypsor/Amex-Payment-Info-Enhancer)](https://github.com/Apocalypsor/Amex-Payment-Info-Enhancer/releases)

Enhanced payment information display for Amex cards.

## ✨ Features

Refer to [this thread](https://www.uscardforum.com/t/topic/438676)

## 📦 Installation

### For Users

Click to install the userscript:

- **[Install from Latest Release](https://github.com/Apocalypsor/Amex-Payment-Info-Enhancer/releases/latest/download/amex-payment-info-enhancer.user.js)**
- Or from [release branch](https://github.com/Apocalypsor/Amex-Payment-Info-Enhancer/blob/release/amex-payment-info-enhancer.user.js)

Requirements: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)

## 🏗️ Architecture

Built with **TypeScript** using an **abstract class pattern** for easy maintenance and extensibility.

```
SiteEnhancer (Abstract Base Class)
    ├── UberEnhancer
    ├── ResyEnhancer
    ├── AmexEnhancer
    └── SaksEnhancer
```

Each enhancer implements:

- `shouldActivate()` - Check if active on current page
- `setupInterceptor()` - Setup XHR interception
- `updatePage()` - Update DOM with enhanced info

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) runtime

### Setup

```bash
# Install dependencies
bun install

# Build userscript
bun run build
```

Output: `dist/amex-payment-info-enhancer.user.js`

### Adding New Sites

1. Create a new enhancer class in `src/enhancers/`:

```typescript
import { SiteEnhancer } from "./base";

export class NewSiteEnhancer extends SiteEnhancer {
  protected siteName = "New Site";

  shouldActivate(): boolean {
    return window.location.hostname.includes("example.com");
  }

  setupInterceptor(): void {
    // Setup XHR interception if needed
  }

  updatePage(): void {
    // Update DOM with enhanced info
  }
}
```

2. Register in `src/index.ts`:

```typescript
import { NewSiteEnhancer } from "./enhancers/new-site";

const enhancers = [
  // ... existing enhancers
  new NewSiteEnhancer(),
];
```

3. Build and test!

## 🚀 Release Process

Releases are automated via GitHub Actions:

1. Create a tag on GitHub web interface (e.g., `v4.7.0`)
2. GitHub Action automatically:
   - Builds the userscript with version number
   - Deploys to `release` branch
   - Updates GitHub Release with notes and file

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

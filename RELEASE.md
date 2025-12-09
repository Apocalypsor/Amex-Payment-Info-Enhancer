# Release Workflow

## 如何发布新版本

### 1. 创建并推送标签

```bash
# 创建标签（例如 v4.7.0）
git tag v4.7.0

# 推送标签到远程
git push origin v4.7.0
```

### 2. 自动化流程

推送标签后，GitHub Action 会自动：

1. ✅ 从标签中提取版本号（如 `v4.7.0` → `4.7.0`）
2. ✅ 更新 `package.json` 中的版本
3. ✅ 构建油猴脚本，版本号会自动替换到脚本头部
4. ✅ 提交更新到 `release` 分支
5. ✅ 创建 GitHub Release 并附加构建的脚本文件

### 3. 文件说明

- **`userscript-header.txt`** - 油猴脚本头部模板
  - 使用 `{{VERSION}}` 占位符，构建时自动替换
- **`build.ts`** - 构建脚本
  - 从 `package.json` 或环境变量 `VERSION` 读取版本
  - 替换头部模板中的 `{{VERSION}}`
- **`.github/workflows/release.yml`** - GitHub Action 工作流
  - 监听 `v*` 标签推送
  - 自动构建并发布到 `release` 分支

### 4. 版本号规范

使用语义化版本：`v{major}.{minor}.{patch}`

- `v4.7.0` - 新功能
- `v4.7.1` - Bug 修复
- `v5.0.0` - 重大更新

### 5. Release 分支

`release` 分支包含：

- 最新的 `package.json`（版本已更新）
- 构建好的 `dist/amex-payment-info-enhancer.user.js`

用户可以直接从 release 分支安装最新版本。

### 6. 本地开发

本地构建时使用 `package.json` 中的版本：

```bash
bun run build
```

CI 构建时会使用标签版本：

```bash
VERSION=4.7.0 bun run build
```

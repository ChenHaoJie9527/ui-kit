# JSR 可行性调研：ui-kit

调研日期：2026-10-20

## 结论

JSR 可以解决两件当前很实际的问题：

1. 公共包安装时不再依赖 GitHub Packages token。
2. 可以从 GitHub Actions 使用 OIDC 无密钥发布，不要求本地保存 npm token。

但 JSR **不能消除包名中的 scope 前缀**。JSR 的所有包名都必须是 `@scope/package`，
因此不能得到真正无前缀的 `ui-kit`。能做的是：

- 把较长的 `@chenhaojie9527/*` 改成更短的 JSR scope，例如 `@chj/ui-kit`。
- 在消费端通过 npm alias 把 JSR 包映射成无前缀的本地依赖名，但这需要额外配置，
  不是包的公开 JSR 名称。

对这个仓库而言，JSR 适合作为新的 ESM / React 分发渠道，但不建议立即替换现有
GitHub Packages。应先发布较简单的 hooks 包，验证 React 18、React 19、Vite 和
Next.js 的 npm 兼容消费路径，再决定是否迁移 UI 包。

## 一手资料确认的事实

### 1. JSR 包名一定带 scope

JSR 官方 scope 文档写明，所有包都位于 scope 中，scope 以 `@` 开头。
scope 长度为 2–20 个字符，包名长度为 2–20 个字符。

来源：

- [JSR: Scopes](https://jsr.io/docs/scopes)
- [JSR: Publishing packages](https://jsr.io/docs/publishing-packages)

因此 `ui-kit` 不能作为 JSR 的顶层包名。即使是 `@chj/ui`，导入时仍然有 `@chj/`
前缀。

### 2. Node、Vite、Next.js 可以通过 npm 兼容层安装

JSR 官方 npm compatibility 文档确认：

- npm、Yarn、pnpm 等基于 `node_modules` 的工具可以使用 JSR。
- pnpm 10.9+ 和 Yarn 4.9+ 原生支持 JSR。
- pnpm 可直接执行 `pnpm install jsr:@luca/cases`。
- npm 可执行 `npx jsr add @luca/cases`，CLI 会更新 `package.json` 和 `.npmrc`。
- 安装后代码中仍使用 `@luca/cases` 这样的 scoped import。
- JSR 通过特殊的 `@jsr` npm scope 提供 tarball，例如
  `@jsr/luca__cases`，registry 为 `https://npm.jsr.io`。

来源：[JSR: npm compatibility](https://jsr.io/docs/npm-compatibility)

对使用现代 pnpm 的消费者，理想形式是：

```bash
pnpm add jsr:@chj/ui-kit
```

```tsx
import { Button } from "@chj/ui-kit";
import "@chj/ui-kit/styles.css";
```

上述 CSS 子路径能否发布，仍需要对本仓库的 CSS 构建产物做 dry-run 验证。

### 3. 可以通过消费端 alias 获得无前缀 import

JSR 文档给出的 npm alias 形式是：

```json
{
  "dependencies": {
    "ui-kit": "npm:@jsr/chj__ui-kit@0.1.0"
  }
}
```

同时在项目中配置：

```ini
@jsr:registry=https://npm.jsr.io
```

之后可以：

```tsx
import { Button } from "ui-kit";
import "ui-kit/styles.css";
```

这只是本地依赖别名。JSR 页面、版本号和包的正式身份仍然是
`@chj/ui-kit`；消费者仍需理解 `@jsr` registry 和 alias 配置。

来源：[JSR: npm compatibility — Advanced setup](https://jsr.io/docs/npm-compatibility#advanced-setup)

### 4. GitHub Actions 发布不需要 token

JSR 官方发布文档确认，把 JSR 包关联到 GitHub 仓库后，可以在 GitHub Actions
中通过 OIDC 发布，不需要配置 secret。工作流需要 `id-token: write` 权限。

来源：

- [JSR: Publishing from GitHub Actions](https://jsr.io/docs/publishing-packages#publishing-from-github-actions)
- [JSR: Scopes — GitHub Actions publishing security](https://jsr.io/docs/scopes#github-actions-publishing-security)

这直接解决了当前 GitHub Packages 发布需要 token、用户安装也需要认证的问题。

### 5. JSR 只发布 ESM

JSR 包必须是 ESM，不能发布 CommonJS。npm 兼容层会把 TypeScript 转译成
JavaScript，并生成 `.d.ts`。

来源：[JSR: Publishing packages — JSR package rules](https://jsr.io/docs/publishing-packages#jsr-package-rules)

当前仓库同时构建 ESM 和 CJS。迁移 JSR 时：

- JSR 入口只需要 ESM。
- CJS 消费者仍应使用现有 GitHub Packages 包，除非另行验证。
- 不建议为了 JSR 删除 CJS，除非已经明确放弃 CJS 用户。

### 6. React 组件可以发布，但 peer dependency 要特别验证

JSR 上存在真实的 React 组件库案例，例如
[`@primitiv-ui/react`](https://jsr.io/@primitiv-ui/react)。该案例同时提供
`package.json` 中的 React peer dependencies 和指向 TypeScript 源码的 `jsr.json`。

但 JSR 的 npm 兼容 manifest 会把这些 peer 依赖表现为普通 npm dependencies。
例如：

```json
{
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5"
  }
}
```

可查看它的 [npm 兼容 manifest](https://npm.jsr.io/@jsr/primitiv-ui__react)。
这说明 React 在 npm 兼容层可能被安装成额外副本，而不是严格复用应用自身的
peer React。pnpm 通常能更好地去重，但 React 18 项目仍可能遇到版本不匹配。

JSR 文档也明确提示：受 npm / Yarn 依赖布局限制，JSR 依赖可能产生重复副本，
推荐使用 pnpm。

对本仓库的影响：

- 必须分别测试 React 18 + Vite、React 19 + Vite、React 18 + Next.js、
  React 19 + Next.js。
- 不能只验证构建通过，还要检查运行时没有重复 React、Invalid hook call、
  context 不共享等问题。

## 当前仓库的具体迁移障碍

### `workspace:*` 不能直接发布

`packages/ui` 当前依赖：

```json
"@chenhaojie9527/ui-kit-hooks": "workspace:*"
```

JSR 发布时不能把 workspace 协议当成可安装版本。需要：

- 先发布 `@chj/ui-kit-hooks` 的明确版本；
- 让 UI 包依赖该 JSR 包；
- 重新构建 UI 的 ESM 产物，使外部依赖名称与新包名一致。

### CSS 是单独产物

UI 源码中有：

```ts
import "./styles/tokens.css";
```

各组件也分别导入 CSS。Vite 构建后得到：

```text
dist/index.js
dist/styles.css
```

`dist/index.js` 已不再直接导入 CSS，但 JSR 发布时必须显式包含并导出
`dist/styles.css`。如果直接将 `src/index.ts` 作为 JSR 入口，CSS 导入还需要额外
验证，因为 JSR 的主要运行环境是 Deno/ESM，而不是浏览器 CSS bundler。

建议先做一个只在 `/tmp` 中的 `jsr publish --dry-run`，确认以下配置能通过：

```json
{
  "name": "@chj/ui-kit",
  "version": "0.1.0",
  "exports": {
    ".": "./dist/index.js",
    "./styles.css": "./dist/styles.css"
  }
}
```

并显式把 `dist` 纳入发布文件。官方文档说明 `dist` 被 `.gitignore` 忽略时，
可通过 `publish.exclude: ["!dist"]` 取消忽略。

来源：[JSR: Filtering files](https://jsr.io/docs/publishing-packages#filtering-files)

### 包名前缀仍然存在

可以选择短 scope 来降低输入成本，例如：

- `@chj/ui-kit`
- `@chj/hooks`
- `@chj/ui`

但这只是把长用户名换成短组织名，不是无 scope。JSR 文档明确要求配置中的 `name`
必须带 JSR scope。

来源：[JSR: package configuration — name](https://jsr.io/docs/package-configuration)

## 推荐路线

### 方案 A：用短 scope 发布到 JSR，接受保留 `@`

这是最容易落地的方案。

1. 在 JSR 创建短 scope，例如 `@chj`；名字是否可用需实际查询。
2. 先发布 `@chj/hooks` 或 `@chj/ui-kit-hooks`，这是没有 CSS 的较小验证面。
3. 在 GitHub Actions 中配置 `id-token: write`，关联仓库后用 OIDC 发布。
4. 用 Vite 和 Next.js 分别验证 React 18 / 19。
5. 再发布 UI 包，并把 CSS 子路径作为独立 export 验证。
6. 保留现有 GitHub Packages 包作为过渡版本，避免已有用户断供。

消费者路径：

```bash
pnpm add jsr:@chj/ui-kit
```

```tsx
import { Button } from "@chj/ui-kit";
import "@chj/ui-kit/styles.css";
```

### 方案 B：用消费端 alias 做到无前缀 import

如果“导入时必须写 scope”是硬性痛点，可以让消费者通过 npm alias 改名：

```ini
@jsr:registry=https://npm.jsr.io
```

```json
{
  "dependencies": {
    "ui-kit": "npm:@jsr/chj__ui-kit@0.1.0"
  }
}
```

```tsx
import { Button } from "ui-kit";
import "ui-kit/styles.css";
```

代价是每个消费者都要配置 alias，不能做到“安装后天然就是无前缀名称”。

### 方案 C：如果必须真正无前缀，需要另一个 npm 兼容 registry

JSR 约束下无法提供真正的公共无前缀包名。真正需要：

```tsx
import { Button } from "ui-kit";
```

而又不接受 alias 配置时，仍然需要发布到一个支持无 scope 包名的 npm 兼容
registry，或者使用 GitHub Release 的 tarball / git 依赖。后者不需要 npm token，
但版本管理、依赖解析和 CSS 子路径都更麻烦，不适合作为主要公共分发方式。

## 最终建议

先做 JSR 试点，不要直接迁移全部包：

1. 创建短 scope。
2. 发布 hooks 包。
3. 做 React 18/19 + Vite/Next 的真实消费测试。
4. dry-run UI 包的 `dist` + `styles.css`。
5. 只有全部通过后，再把 JSR 作为正式的第二发布渠道。

如果最终目标是“无认证安装 + 短名称”，JSR 能把长前缀缩短为 `@chj/*`，但不能变成
无前缀。如果目标是严格无前缀 import，则 JSR 只能通过消费端 alias 实现，不能改变
package 的正式名称。

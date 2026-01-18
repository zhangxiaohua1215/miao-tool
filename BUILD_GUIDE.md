# 使用构建工具改造 Chrome 扩展指南

## 📦 方案：Vite + TypeScript

### 1. 安装依赖

```bash
npm init -y
npm install -D vite @types/chrome typescript
npm install -D vite-plugin-chrome-extension
```

### 2. 新的项目结构

```
妙妙工具/
├── src/                      # 源代码目录
│   ├── background/
│   │   └── index.ts         # background.js → index.ts
│   ├── content/
│   │   ├── index.ts         # 主入口 (content.js)
│   │   ├── config.ts        # 配置
│   │   ├── utils.ts         # 工具函数
│   │   ├── ui.ts            # UI 相关
│   │   └── styles.css       # content.css
│   └── manifest.json        # 清单文件
├── dist/                     # 构建输出目录（给 Chrome 加载）
├── package.json
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── README.md
```

### 3. 配置文件

#### package.json

```json
{
  "name": "playwright-pom-helper",
  "version": "2.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "vite build",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.254",
    "typescript": "^5.3.3",
    "vite": "^5.0.0"
  }
}
```

#### vite.config.ts

```typescript
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content/index.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
  publicDir: "public", // 静态文件目录（存放 manifest.json）
});
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "types": ["chrome"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. 代码改造示例

#### src/content/config.ts

```typescript
export interface ScanRule {
  selector: string;
  type: string;
}

export interface BaseClassInfo {
  name: string;
  import: string;
}

export interface POMConfigType {
  scanRules: ScanRule[];
  iframeSelector: string;
  baseClassMap: Record<string, BaseClassInfo>;
  plugins: Plugin[];
}

export const POMConfig: POMConfigType = {
  scanRules: [
    { selector: ".ant-table-wrapper", type: "Table" },
    { selector: "button.ant-btn-primary", type: "Button" },
    // ...
  ],

  iframeSelector: ".main-content iframe",

  baseClassMap: {
    Modal: {
      name: "ModalPage",
      import: "import { ModalPage } from './base';",
    },
    // ...
  },

  plugins: [],
};
```

#### src/content/utils.ts

```typescript
import type { POMConfigType } from "./config";

export class POMUtils {
  static toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, (c) => c.toLowerCase());
  }

  static getBestSelector(el: Element): string {
    const tag = el.tagName.toLowerCase();

    // data-testid 最优
    if (el.getAttribute("data-testid")) {
      return `[data-testid="${el.getAttribute("data-testid")}"]`;
    }

    // ... 其他逻辑
    return tag;
  }

  static detectElementType(el: Element): string {
    // ... 检测逻辑
    return "Locator";
  }

  static highlightCode(code: string): string {
    // ... 语法高亮逻辑
    return code;
  }

  static showToast(
    message: string,
    type: "success" | "error" = "success"
  ): void {
    // ... Toast 逻辑
  }
}
```

#### src/content/ui.ts

```typescript
export class POMUI {
  static createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.id = "pom-helper-panel";
    panel.className = "pom-panel";
    // ... 创建面板 DOM
    document.body.appendChild(panel);
    return panel;
  }

  static createPickHint(): HTMLElement {
    // ... 创建提示元素
    return document.createElement("div");
  }

  static updateSelectedList(
    elements: any[],
    removeCallback: (index: number) => void
  ): void {
    // ... 更新列表
  }

  static updateCodeDisplay(code: string): void {
    // ... 更新代码显示
  }

  static setModeActive(mode: "scan" | "pick" | "none"): void {
    // ... 设置模式
  }

  static makeDraggable(element: HTMLElement): void {
    // ... 拖拽逻辑
  }

  static cleanup(): void {
    // ... 清理
  }

  static bindPanelEvents(panel: HTMLElement, callbacks: any): void {
    // ... 绑定事件
  }
}
```

#### src/content/index.ts（主入口）

```typescript
import { POMConfig } from "./config";
import { POMUtils } from "./utils";
import { POMUI } from "./ui";
import "./styles.css";

// 防止重复注入
if ((window as any).__POM_HELPER_LOADED__) {
  throw new Error("POM Helper already loaded");
}
(window as any).__POM_HELPER_LOADED__ = true;

interface State {
  isPickMode: boolean;
  selectedElements: any[];
  hoveredElement: Element | null;
  panel: HTMLElement | null;
  plainCode: string;
  rootElement: Element | null;
  rootType: string | null;
}

const state: State = {
  isPickMode: false,
  selectedElements: [],
  hoveredElement: null,
  panel: null,
  plainCode: "",
  rootElement: null,
  rootType: null,
};

// 检测根容器
function detectRootElement(): { element: Element; type: string } {
  const visibleModal = document.querySelector(
    '.ant-modal:not([style*="display: none"])'
  );
  if (visibleModal) {
    return { element: visibleModal, type: "Modal" };
  }

  // ... 其他检测逻辑

  return { element: document.body, type: "Page" };
}

// 自动扫描
function autoScan(): void {
  const rootInfo = detectRootElement();
  state.rootElement = rootInfo.element;
  state.rootType = rootInfo.type;

  const scanRules = POMConfig.scanRules;

  scanRules.forEach((rule) => {
    const elements = rootInfo.element.querySelectorAll(rule.selector);
    elements.forEach((el) => {
      // ... 处理逻辑
    });
  });

  POMUtils.showToast(`扫描完成，找到 ${state.selectedElements.length} 个元素`);
}

// 初始化
function init(): void {
  state.panel = POMUI.createPanel();
  POMUI.setModeActive("scan");
  autoScan();
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_panel") {
    if (state.panel) {
      closePanel();
    } else {
      init();
    }
  }
});

function closePanel(): void {
  state.panel?.remove();
  state.panel = null;
  POMUI.cleanup();
}
```

#### src/background/index.ts

```typescript
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_panel" });
  }
});
```

#### public/manifest.json（更新后）

```json
{
  "manifest_version": 3,
  "name": "Playwright POM Helper",
  "version": "2.1",
  "description": "一键生成 Playwright Page Object 代码",
  "permissions": ["activeTab", "scripting"],
  "action": {},
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_end",
      "all_frames": true
    }
  ]
}
```

### 5. 开发流程

#### 开发模式（自动重新构建）

```bash
npm run dev
```

然后在 Chrome 中加载 `dist` 目录。每次代码修改后会自动重新构建。

#### 生产构建

```bash
npm run build
```

生成优化后的代码到 `dist` 目录。

#### 类型检查

```bash
npm run type-check
```

检查 TypeScript 类型错误。

### 6. 优势对比

| 特性     | 当前方案      | 构建工具方案           |
| -------- | ------------- | ---------------------- |
| 模块化   | ❌ 全局变量   | ✅ ES6 import/export   |
| 类型检查 | ❌ 无         | ✅ TypeScript 全面支持 |
| 代码提示 | ⚠️ 有限       | ✅ 完整的智能提示      |
| 代码分割 | ❌ 手动管理   | ✅ 自动按需加载        |
| 构建优化 | ❌ 无         | ✅ Tree-shaking、压缩  |
| 开发体验 | ⚠️ 需手动刷新 | ✅ 热更新（HMR）       |
| 依赖管理 | ❌ 手动       | ✅ npm 管理            |
| 单元测试 | ❌ 困难       | ✅ 容易集成            |

### 7. 迁移步骤

1. ✅ 创建新的项目结构
2. ✅ 安装依赖
3. ✅ 配置 vite.config.ts 和 tsconfig.json
4. 📝 将 JS 文件改为 TS 并添加类型
5. 📝 改用 import/export 语法
6. 🧪 测试功能是否正常
7. 🎉 享受现代化开发体验

### 8. 注意事项

⚠️ **构建后文件体积可能增加**

- Vite 会打包所有依赖到一个文件
- 但会进行代码压缩和优化

⚠️ **Source Map**

- 开发时启用 source map 便于调试
- 生产环境可以关闭

⚠️ **Chrome 扩展热更新**

- 需要手动刷新扩展页面
- 可以使用 `chrome-extension-reloader` 插件自动化

## 🎯 推荐做法

**小型项目（< 1000 行）**：保持当前的全局变量方案
**中大型项目（> 1000 行）**：使用 Vite + TypeScript

对于你的项目，**当前保持原样即可**，除非你需要：

- TypeScript 类型安全
- 更好的代码组织
- 团队协作开发
- 复杂的构建需求

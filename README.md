# 🎯 POM Helper - Playwright Page Object 代码生成器

一个强大的 Chrome 浏览器扩展，帮助测试工程师快速生成 Playwright Page Object Model (POM) 代码，提升自动化测试开发效率。

![Version](https://img.shields.io/badge/version-2.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 功能特性

### 🚀 核心功能

- **🔍 扫描模式** - 自动识别页面上的 Ant Design 组件（表格、按钮、输入框等）
- **👆 点选模式** - 手动点击页面元素，精准选择需要生成的组件
- **🧠 智能命名** - 自动将中文按钮文字、placeholder 转换为英文变量名
- **📝 代码生成** - 一键生成完整的 TypeScript POM 代码
- **🎨 语法高亮** - 代码预览区支持语法高亮，提升可读性
- **📋 一键复制** - 生成的代码可直接复制到项目中使用

### 💡 智能特性

- **中英文映射** - 内置 60+ 常用中文词汇映射表
- **选择器优化** - 自动生成最佳选择器（优先 data-testid > id > class）
- **类型识别** - 自动识别组件类型（Button、Input、Table、Select 等）
- **去重处理** - 自动处理重复元素，避免生成冗余代码

## 📦 安装方法

### 方式一：从源码安装（推荐）

1. 克隆或下载本项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目文件夹

### 方式二：打包安装

1. 在 `chrome://extensions/` 页面点击「打包扩展程序」
2. 选择项目文件夹，生成 `.crx` 文件
3. 拖拽 `.crx` 文件到扩展页面完成安装

## 🎮 使用方法

### 快速开始

1. **打开目标网页** - 访问需要生成 POM 代码的页面
2. **点击扩展图标** - 点击浏览器工具栏中的 POM Helper 图标
3. **自动扫描** - 扩展会自动扫描页面并生成代码
4. **复制代码** - 点击「复制代码」按钮，粘贴到你的项目中

### 两种模式

#### 🔍 扫描模式（默认）

- 自动识别页面上的所有 Ant Design 组件
- 适合快速生成整个页面的 POM 代码
- 点击「扫描模式」按钮即可重新扫描

#### 👆 点选模式

- 点击「点选模式」按钮开启
- 鼠标悬停元素会显示虚线高亮
- 点击元素即可添加到列表
- 按 `ESC` 键退出点选模式

### 操作说明

- **清空** - 清除所有已选元素，重新开始
- **复制代码** - 复制生成的完整代码到剪贴板
- **拖拽面板** - 拖动标题栏可以移动面板位置
- **调整大小** - 拖拽面板右下角可以调整大小
- **最小化** - 点击标题栏的 `─` 按钮最小化面板

## 📁 项目结构

```
妙妙工具/
├── manifest.json      # 扩展配置文件
├── background.js      # 后台服务脚本（处理图标点击）
├── config.js          # 配置和映射表（中英文映射、扫描规则）
├── utils.js           # 工具函数（命名、选择器、语法高亮）
├── ui.js              # UI 相关（面板创建、拖拽、列表更新）
├── content.js         # 主逻辑（状态管理、事件处理）
├── content.css        # 样式文件
└── README.md          # 项目说明文档
```

## 🛠️ 技术栈

- **Manifest V3** - Chrome 扩展最新规范
- **原生 JavaScript** - 无依赖，轻量高效
- **CSS3** - 现代化 UI 设计，支持拖拽和调整大小
- **TypeScript 代码生成** - 生成符合 Playwright 规范的代码

## 📝 生成的代码示例

```typescript
import { Page, Locator } from "@playwright/test";
import { Button, Input, Table, Select } from "./components";

class GeneratedPage {
  readonly submitBtn: Button;
  readonly usernameInput: Input;
  readonly dataTable: Table;
  readonly statusSelect: Select;

  constructor(private page: Page) {
    this.submitBtn = new Button(page.locator('button:has-text("提交")'));
    this.usernameInput = new Input(
      page.locator('input[placeholder="请输入用户名"]')
    );
    this.dataTable = new Table(page.locator(".ant-table-wrapper >> nth=0"));
    this.statusSelect = new Select(page.locator(".ant-select >> nth=0"));
  }
}
```

## 🎯 支持的组件类型

- ✅ **Button** - 按钮组件
- ✅ **Input** - 输入框组件
- ✅ **Table** - 表格组件
- ✅ **Select** - 下拉选择组件
- ✅ **TextArea** - 文本域组件
- ✅ **DatePicker** - 日期选择器
- ✅ **Modal** - 模态框
- ✅ **Search** - 搜索区域
- ✅ **Form** - 表单
- ✅ **Link** - 链接
- ✅ **Locator** - 通用定位器（兜底类型）

## 🔧 配置说明

### 自定义扫描规则

编辑 `config.js` 文件，修改 `scanRules` 数组：

```javascript
scanRules: [
  { selector: ".ant-table-wrapper", type: "Table", onlyFirst: false },
  { selector: "button.ant-btn-primary", type: "Button" },
  // 添加你的自定义规则...
];
```

### 扩展中英文映射

编辑 `config.js` 文件，在 `zhToEn` 对象中添加映射：

```javascript
zhToEn: {
  '你的按钮文字': 'yourButtonName',
  // 添加更多映射...
}
```

## 🐛 已知问题

- 某些动态加载的页面可能需要刷新后重新扫描
- 复杂嵌套组件可能需要手动点选模式选择

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢 Playwright 团队提供的优秀测试框架
- 感谢 Ant Design 提供的组件库

## 📮 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](https://github.com/zhangxiaohua1215/miao-tool/issues)
- 发送邮件至项目维护者

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！

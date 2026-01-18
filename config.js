// POM Helper - 配置文件
// 用户可以直接修改此文件来自定义配置

window.POMConfig = {
  // ==================== 基础配置 ====================

  // 扫描规则（必须）
  // 定义哪些元素会被自动扫描，以及它们的类型
  scanRules: [
    { selector: '.ant-table-wrapper', type: 'Table' },
    { selector: '.ant-pro-table-search, .ant-form.ant-form-horizontal', type: 'Search' },
    { selector: 'button.ant-btn-primary, button[type="submit"], button.ant-btn-danger', type: 'Button' },
    { selector: 'input.ant-input, .ant-input-affix-wrapper > input', type: 'Input' },
    { selector: '.ant-select:not(.ant-select-in-form-item .ant-select)', type: 'Select' },
    { selector: 'textarea.ant-input', type: 'TextArea' },
    { selector: '.ant-picker', type: 'DatePicker' },
    { selector: '.ant-modal-wrap:not([style*="display: none"])', type: 'Modal' },
  ],

  // ==================== 高级配置（可选）====================

  // iframe 选择器（用于微前端场景）
  // 如果页面有 iframe，工具会尝试扫描 iframe 内的元素
  iframeSelector: '.main-content iframe',

  // 基类映射配置（可选）
  // 根据容器类型定义对应的基类
  baseClassMap: {
    'Modal': {
      name: 'ModalPage',
      import: "import { ModalPage } from './base';"
    },
    'Drawer': {
      name: 'DrawerPage',
      import: "import { DrawerPage } from './base';"
    },
    'IframePage': {
      name: 'IframePage',
      import: "import { IframePage } from './base';"
    }
    // 如果不在映射表中，则不继承基类
  },

  // 代码生成插件（可选）
  // 用于处理复杂的组件初始化逻辑（如 Form、Table 需要传入 schema）
  plugins: [
    // Form 组件插件 - 自动生成表单 schema
    {
      match(el, type) {
        return type === 'Form' || type === 'Search';
      },
      generateCode(el, name, selector, type) {
        // 扫描表单内的输入字段
        const fields = [];
        const inputs = el.querySelectorAll('input[placeholder], textarea[placeholder]');
        inputs.forEach(input => {
          const placeholder = input.placeholder;
          const fieldName = window.POMUtils.toCamelCase(placeholder || 'field');
          fields.push({
            name: fieldName,
            label: placeholder,
            type: input.type === 'textarea' ? 'textarea' : 'input'
          });
        });

        // 生成 schema
        const schemaName = `${name}Schema`;
        const schemaValue = JSON.stringify(fields, null, 2);

        return {
          import: `import { Form } from './components';`,
          schema: {
            name: schemaName,
            value: schemaValue
          },
          property: `readonly ${name}: Form;`,
          constructor: `this.${name} = new Form(this.root.locator('${selector}'), ${schemaName});`
        };
      }
    },

    // Table 组件插件 - 自动生成列定义
    {
      match(el, type) {
        return type === 'Table';
      },
      generateCode(el, name, selector, type) {
        // 扫描表格列
        const columns = [];
        const headers = el.querySelectorAll('thead th');
        headers.forEach((th, index) => {
          const text = th.textContent.trim();
          if (text) {
            columns.push({
              key: window.POMUtils.toCamelCase(text) || `col${index}`,
              title: text,
              index: index
            });
          }
        });

        // 生成 schema
        const schemaName = `${name}Columns`;
        const schemaValue = JSON.stringify(columns, null, 2);

        return {
          import: `import { Table } from './components';`,
          schema: {
            name: schemaName,
            value: schemaValue
          },
          property: `readonly ${name}: Table;`,
          constructor: `this.${name} = new Table(this.root.locator('${selector}'), ${schemaName});`
        };
      }
    }
  ]
};

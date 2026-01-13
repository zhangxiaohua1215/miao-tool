// POM Helper - 工具函数

window.POMUtils = {
  // 中文转英文
  translateZh(text) {
    if (!text) return '';
    text = text.trim();
    const zhToEn = POMConfig.zhToEn;

    // 直接匹配
    if (zhToEn[text]) return zhToEn[text];

    // 部分匹配
    for (const [zh, en] of Object.entries(zhToEn)) {
      if (text.includes(zh)) return en;
    }

    // 如果是纯英文，直接返回
    if (/^[a-zA-Z0-9_]+$/.test(text)) {
      return text.charAt(0).toLowerCase() + text.slice(1);
    }

    // 兜底
    return 'element';
  },

  // 驼峰命名
  toCamelCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
  },

  // 获取元素的智能名称
  getSmartName(el, type) {
    // 1. 优先使用 data-testid
    if (el.dataset && el.dataset.testid) {
      return this.toCamelCase(el.dataset.testid);
    }

    // 2. 使用 id
    if (el.id && !/^\d/.test(el.id)) {
      return this.toCamelCase(el.id);
    }

    // 3. 按钮：用文字内容
    if (type === 'Button' || el.tagName === 'BUTTON') {
      const text = el.textContent?.trim().slice(0, 10);
      if (text) {
        const enName = this.translateZh(text);
        return enName + 'Btn';
      }
    }

    // 4. 输入框：用 placeholder 或关联 label
    if (type === 'Input' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const placeholder = el.placeholder?.trim().slice(0, 10);
      if (placeholder) {
        const enName = this.translateZh(placeholder.replace('请输入', '').replace('请选择', ''));
        if (enName && enName !== 'element') return enName + 'Input';
      }

      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) {
        const enName = this.translateZh(label.textContent?.trim().slice(0, 10));
        if (enName && enName !== 'element') return enName + 'Input';
      }
    }

    // 5. 使用 aria-label
    if (el.getAttribute('aria-label')) {
      const enName = this.translateZh(el.getAttribute('aria-label').slice(0, 10));
      if (enName && enName !== 'element') return enName;
    }

    // 6. 使用 name 属性
    if (el.name) {
      return this.toCamelCase(el.name);
    }

    // 7. 兜底
    return type.toLowerCase();
  },

  // 获取最佳选择器
  getBestSelector(el) {
    const tag = el.tagName.toLowerCase();
    const classList = el.className || '';

    // 1. data-testid 最优
    if (el.dataset && el.dataset.testid) {
      return `[data-testid="${el.dataset.testid}"]`;
    }

    // 2. id（排除自动生成的 id）
    if (el.id && !/^\d/.test(el.id) && !el.id.startsWith('rc-') && el.id.length < 30) {
      return `#${el.id}`;
    }

    // 3. Ant Design 组件专用选择器
    if (classList.includes('ant-table-wrapper')) {
      const allTables = document.querySelectorAll('.ant-table-wrapper');
      const index = Array.from(allTables).indexOf(el);
      return `.ant-table-wrapper >> nth=${index}`;
    }

    if (classList.includes('ant-pro-table-search')) {
      return '.ant-pro-table-search';
    }

    if (classList.includes('ant-select') && !classList.includes('ant-select-open')) {
      const allSelects = document.querySelectorAll('.ant-select');
      const index = Array.from(allSelects).indexOf(el);
      if (allSelects.length === 1) return '.ant-select';
      return `.ant-select >> nth=${index}`;
    }

    if (classList.includes('ant-picker')) {
      const allPickers = document.querySelectorAll('.ant-picker');
      const index = Array.from(allPickers).indexOf(el);
      if (allPickers.length === 1) return '.ant-picker';
      return `.ant-picker >> nth=${index}`;
    }

    // 4. 按钮 - 优先用文字定位
    if (tag === 'button' || classList.includes('ant-btn')) {
      const text = el.textContent?.trim();
      if (text && text.length <= 20) {
        return `button:has-text("${text}")`;
      }
    }

    // 5. 输入框 - 用 placeholder 定位
    if (tag === 'input' || classList.includes('ant-input')) {
      const placeholder = el.placeholder;
      if (placeholder) {
        return `input[placeholder="${placeholder}"]`;
      }
      const name = el.name;
      if (name) {
        return `input[name="${name}"]`;
      }
    }

    // 6. 通用 class 选择器
    const meaningfulClasses = Array.from(el.classList || []).filter(c =>
      c.startsWith('ant-') && (c.includes('btn') || c.includes('input') || c.includes('table') || c.includes('select') || c.includes('form'))
    );

    if (meaningfulClasses.length > 0) {
      const selector = '.' + meaningfulClasses[0];
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
      const index = Array.from(matches).indexOf(el);
      return `${selector} >> nth=${index}`;
    }

    // 7. 兜底
    const allSameTags = document.querySelectorAll(tag);
    const index = Array.from(allSameTags).indexOf(el);
    if (allSameTags.length === 1) {
      return tag;
    }
    return `${tag} >> nth=${index}`;
  },

  // 判断元素类型
  detectElementType(el) {
    const tag = el.tagName.toLowerCase();
    const classList = el.className || '';

    if (classList.includes('ant-table-wrapper')) return 'Table';
    if (classList.includes('ant-pro-table-search')) return 'Search';
    if (classList.includes('ant-modal')) return 'Modal';
    if (classList.includes('ant-picker')) return 'DatePicker';
    if (classList.includes('ant-select')) return 'Select';
    if (tag === 'button' || classList.includes('ant-btn')) return 'Button';
    if (tag === 'input' || classList.includes('ant-input')) return 'Input';
    if (tag === 'textarea') return 'TextArea';
    if (classList.includes('ant-form')) return 'Form';
    if (tag === 'a') return 'Link';

    return 'Locator';
  },

  // 语法高亮
  highlightCode(code) {
    const strings = [];
    const comments = [];

    let html = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. 提取注释
    html = html.replace(/(\/\/.*$)/gm, (match) => {
      comments.push(match);
      return `__COMMENT_${comments.length - 1}__`;
    });

    // 2. 提取字符串
    html = html.replace(/(["'])(?:(?!\1)[^\\]|\\.)*?\1/g, (match) => {
      strings.push(match);
      return `__STRING_${strings.length - 1}__`;
    });

    // 3. 关键字
    html = html.replace(/\b(import|from|class|readonly|constructor|private|public|new|this|const|let|var|return|export|default|extends|implements)\b/g, '<span class="keyword">$1</span>');

    // 4. 类型
    html = html.replace(/:\s*(Page|Locator|Button|Input|Table|Select|TextArea|DatePicker|Modal|Search|Form|Link|string|number|boolean)\b/g, ': <span class="type">$1</span>');

    // 5. 类名
    html = html.replace(/(<span class="keyword">new<\/span>\s*)(\w+)(?=\s*\()/g, '$1<span class="class-name">$2</span>');

    // 6. 属性名
    html = html.replace(/(<span class="keyword">this<\/span>\.)(\w+)/g, '$1<span class="property">$2</span>');

    // 7. 方法调用
    html = html.replace(/\.(\w+)(?=\s*\()/g, '.<span class="method">$1</span>');

    // 8. 还原字符串
    html = html.replace(/__STRING_(\d+)__/g, (_, idx) => {
      return `<span class="string">${strings[parseInt(idx)]}</span>`;
    });

    // 9. 还原注释
    html = html.replace(/__COMMENT_(\d+)__/g, (_, idx) => {
      return `<span class="comment">${comments[parseInt(idx)]}</span>`;
    });

    return html;
  },

  // 显示 Toast 提示
  showToast(message, type = 'success') {
    let toast = document.getElementById('pom-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'pom-toast';
      toast.id = 'pom-toast';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = 'pom-toast ' + type;

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => toast.classList.remove('show'), 2000);
  },
};


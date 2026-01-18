// POM Helper - 工具函数

window.POMUtils = {
  // 转义选择器中的特殊字符
  escapeSelector(str) {
    if (!str) return '';
    // 转义引号、反斜杠等特殊字符
    return str.replace(/["'\\]/g, '\\$&');
  },

  // 驼峰命名
  toCamelCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^./, c => c.toLowerCase());
  },

  // 获取元素的智能名称（简单策略）
  // 传入 selectedElements 数组用于统计同类型数量
  getSmartName(el, type, selectedElements) {
    // 统计已选元素中相同类型的数量
    const sameTypeCount = selectedElements.filter(item => item.type === type).length;

    // 类型名转小写作为基础名称
    const baseName = type.toLowerCase();

    // 如果已经有同类型的元素，加上序号（从1开始）
    if (sameTypeCount > 0) {
      return `${baseName}${sameTypeCount + 1}`;
    }

    // 第一个该类型的元素，直接用类型名
    return baseName;
  },

  // 重新命名所有元素（用于删除元素后重新编号）
  renameElements(selectedElements) {
    // 按类型分组统计
    const typeCounters = {};

    selectedElements.forEach(item => {
      const type = item.type;
      const baseName = type.toLowerCase();

      // 初始化计数器
      if (!typeCounters[type]) {
        typeCounters[type] = { count: 0, total: 0 };
      }

      // 先统计总数
      typeCounters[type].total++;
    });

    // 重新命名
    const typeCurrentIndex = {};
    selectedElements.forEach(item => {
      const type = item.type;
      const baseName = type.toLowerCase();

      if (!typeCurrentIndex[type]) {
        typeCurrentIndex[type] = 0;
      }

      typeCurrentIndex[type]++;

      // 如果该类型只有1个，直接用类型名
      if (typeCounters[type].total === 1) {
        item.name = baseName;
      } else {
        // 有多个，加序号
        item.name = `${baseName}${typeCurrentIndex[type]}`;
      }
    });
  },

  // 获取最佳选择器（通用策略，按优先级从高到低）
  getBestSelector(el) {
    const tag = el.tagName.toLowerCase();

    // 1. data-testid 最优（专为测试设计的属性）
    if (el.dataset?.testid) {
      return `[data-testid="${this.escapeSelector(el.dataset.testid)}"]`;
    }

    // 2. 稳定的 id（排除自动生成的 id）
    if (el.id && this.isStableId(el.id)) {
      return `#${el.id}`;
    }

    // 3. 按钮 - 优先用文字定位（语义化，可读性强）
    if (tag === 'button' || el.matches('button, [role="button"]')) {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length <= 30) {
        return `button:has-text("${this.escapeSelector(text)}")`;
      }
    }

    // 4. 输入框 - 优先用 placeholder 或 name
    if (tag === 'input' || tag === 'textarea') {
      if (el.placeholder) {
        return `${tag}[placeholder="${this.escapeSelector(el.placeholder)}"]`;
      }
      if (el.name) {
        return `${tag}[name="${this.escapeSelector(el.name)}"]`;
      }
    }

    // 5. 通用：有意义的 class（如果有的话）
    const meaningfulClass = this.getMostMeaningfulClass(el);
    if (meaningfulClass) {
      return this.buildSelectorWithIndex(`.${meaningfulClass}`, el);
    }

    // 6. 兜底：元素没有 class 时，使用标签 + 索引
    return this.buildSelectorWithIndex(tag, el);
  },

  // 判断 id 是否稳定（非自动生成）
  isStableId(id) {
    // 排除纯数字、rc- 开头、uuid 格式等自动生成的 id
    return (
      id.length < 50 &&                    // 不要太长
      !/^\d+$/.test(id) &&                 // 不是纯数字
      !id.startsWith('rc-') &&             // 不是 rc-components 生成的
      !id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-/) // 不是 uuid
    );
  },

  // 获取最有意义的 class（优先级：组件根类 > 语义类 > 框架类 > 第一个）
  getMostMeaningfulClass(el) {
    const classes = Array.from(el.classList || []);
    if (classes.length === 0) return null;  // 没有 class 时返回 null，触发标签兜底

    // 1. 优先：组件根类（通常是 xxx-wrapper, xxx-container）
    const rootClass = classes.find(c =>
      c.endsWith('-wrapper') || c.endsWith('-container')
    );
    if (rootClass) return rootClass;

    // 2. 其次：带语义的类（使用词边界匹配，避免误匹配）
    const semanticClass = classes.find(c =>
      /\b(table|form|modal|button|btn|input|select|picker|menu|card|panel)\b/i.test(c)
    );
    if (semanticClass) return semanticClass;

    // 3. 再次：第一个有框架前缀的类（如 ant-xxx, el-xxx, van-xxx）
    const prefixClass = classes.find(c =>
      c.startsWith('ant-') || c.startsWith('el-') || c.startsWith('van-')
    );
    if (prefixClass) return prefixClass;

    // 4. 兜底：返回第一个 class（总比没有强）
    return classes[0];
  },

  // 根据选择器构建带索引的完整选择器（优化性能）
  buildSelectorWithIndex(selector, el) {
    // 先尝试不带索引（如果唯一）
    const matches = document.querySelectorAll(selector);
    if (matches.length === 1) {
      return selector;
    }

    // 需要索引，计算位置
    let index = -1;
    for (let i = 0; i < matches.length; i++) {
      if (matches[i] === el) {
        index = i;
        break;
      }
    }

    return index >= 0 ? `${selector} >> nth=${index}` : selector;
  },

  // 判断元素类型
  detectElementType(el) {
    // 获取扫描规则
    const scanRules = POMConfig.scanRules;

    // 遍历扫描规则，看哪个匹配
    for (const rule of scanRules) {
      try {
        if (el.matches(rule.selector)) {
          return rule.type;
        }
      } catch (e) {
        // 选择器可能无效，跳过
        continue;
      }
    }

    // 兜底：根据标签判断
    const tag = el.tagName.toLowerCase();
    if (tag === 'button') return 'Button';
    if (tag === 'input') return 'Input';
    if (tag === 'textarea') return 'TextArea';
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

    // 4. 类型（动态收集）
    const types = new Set(['Page', 'Locator', 'string', 'number', 'boolean']);

    // 从扫描规则收集组件类型
    if (POMConfig.scanRules) {
      POMConfig.scanRules.forEach(rule => {
        if (rule.type) types.add(rule.type);
      });
    }

    // 从基类映射收集基类名称
    if (POMConfig.baseClassMap) {
      Object.values(POMConfig.baseClassMap).forEach(baseClass => {
        if (baseClass.name) types.add(baseClass.name);
      });
    }

    const typePattern = new RegExp(`:\\s*(${Array.from(types).join('|')})\\b`, 'g');
    html = html.replace(typePattern, ': <span class="type">$1</span>');

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


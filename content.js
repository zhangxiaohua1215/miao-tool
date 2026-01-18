// POM Helper - 主入口
// 状态管理、事件处理、对外接口

(function () {
  // 防止重复注入
  if (window.__POM_HELPER_LOADED__) return;
  window.__POM_HELPER_LOADED__ = true;

  // ==================== 状态管理 ====================
  const state = {
    isPickMode: false,
    selectedElements: [],
    hoveredElement: null,
    panel: null,
    plainCode: '',
    rootElement: null, // 根容器元素
    rootType: null, // 根容器类型（Page/Modal/Drawer/IframePage）
  };

  // ==================== 点选模式 ====================

  // 检测根容器
  // 返回 { element, type } 对象
  function detectRootElement() {
    // 1. 优先查找可见的模态框
    const visibleModal = document.querySelector('.ant-modal:not([style*="display: none"])');
    if (visibleModal) {
      return { element: visibleModal, type: 'Modal' };
    }

    // 2. 查找可见的抽屉
    const visibleDrawer = document.querySelector('.ant-drawer:not(.ant-drawer-close)');
    if (visibleDrawer) {
      return { element: visibleDrawer, type: 'Drawer' };
    }

    // 3. 检查是否在 iframe 内（微前端场景）
    if (window.self !== window.top) {
      return { element: document.body, type: 'IframePage' };
    }

    // 4. 如果在主页面，检查是否有 iframe（同源）
    if (window.self === window.top) {
      const iframeSelector = POMConfig.iframeSelector || '.main-content iframe';
      const microAppIframe = document.querySelector(iframeSelector);
      if (microAppIframe) {
        try {
          const iframeBody = microAppIframe.contentDocument?.body;
          if (iframeBody) {
            return { element: iframeBody, type: 'IframePage' };
          }
        } catch (e) {
          // 跨域 iframe，无法访问内容
          console.warn('[POM Helper] 检测到跨域 iframe，无法扫描其内容:', e.message);
          // 继续使用主页面 body
        }
      }
    }

    // 5. 默认：当前 frame 的 body（普通页面）
    return { element: document.body, type: 'Page' };
  }

  // ==================== 点选模式 ====================

  function setPickMode(enabled) {
    state.isPickMode = enabled;
    const hint = document.getElementById('pom-pick-hint') || POMUI.createPickHint();

    if (enabled) {
      hint.classList.add('show');
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      hint.classList.remove('show');
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      clearHover();
    }
  }

  function handleMouseOver(e) {
    if (!state.isPickMode) return;
    if (e.target.closest('#pom-helper-panel, .pom-toast, .pom-pick-hint')) return;

    clearHover();
    e.target.classList.add('pom-highlight-hover');
    state.hoveredElement = e.target;
  }

  function handleMouseOut(e) {
    if (!state.isPickMode) return;
    clearHover();
  }

  function handleClick(e) {
    if (!state.isPickMode) return;
    if (e.target.closest('#pom-helper-panel, .pom-toast, .pom-pick-hint')) return;

    e.preventDefault();
    e.stopPropagation();

    // 点选模式：添加元素后立即更新 UI
    const added = addElement(e.target);
    if (added) {
      updateUI();
      POMUtils.showToast(`已添加: ${state.selectedElements[state.selectedElements.length - 1].name}`);
    } else {
      POMUtils.showToast('该元素已添加', 'error');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setPickMode(false);
      POMUI.setModeActive('none');
      POMUtils.showToast('已退出点选模式');
    }
  }

  function clearHover() {
    if (state.hoveredElement) {
      state.hoveredElement.classList.remove('pom-highlight-hover');
      state.hoveredElement = null;
    }
  }

  // ==================== 元素管理 ====================

  // 清理单个元素的所有引用和副作用
  function cleanupElement(item) {
    if (!item) return;

    // 移除高亮样式
    item.el?.classList.remove('pom-highlight-selected');

    // 移除标签元素
    if (item.label) {
      item.label.remove();
      // 清理更新函数引用，防止内存泄漏
      delete item.label._updatePosition;
    }

    // 清理元素引用
    item.el = null;
    item.label = null;
  }

  // 纯数据操作：添加元素到状态
  function addElement(el, forceType) {
    if (state.selectedElements.find(item => item.el === el)) {
      return false; // 返回 false 表示未添加
    }

    const type = forceType || POMUtils.detectElementType(el);
    const name = POMUtils.getSmartName(el, type, state.selectedElements);
    const selector = POMUtils.getBestSelector(el);
    const label = POMUI.createElementLabel(el, name, type);

    state.selectedElements.push({ el, type, name, selector, label });
    el.classList.add('pom-highlight-selected');

    return true; // 返回 true 表示添加成功
  }

  function removeElement(index) {
    const item = state.selectedElements[index];
    if (item) {
      cleanupElement(item);
    }
    state.selectedElements.splice(index, 1);

    // 重新命名所有元素（保持编号连续）
    POMUtils.renameElements(state.selectedElements);

    // 更新所有标签显示
    state.selectedElements.forEach(item => {
      if (item.label && item.el) {
        item.label.remove();
        item.label = POMUI.createElementLabel(item.el, item.name, item.type);
      }
    });

    updateUI();
  }

  function clearSelected() {
    state.selectedElements.forEach(item => {
      cleanupElement(item);
    });
    state.selectedElements = [];
    updateUI();
    POMUtils.showToast('已清空');
  }

  function updateLabelsPosition() {
    state.selectedElements.forEach(item => {
      item.label?._updatePosition?.();
    });
  }

  // ==================== 自动扫描 ====================

  function autoScan() {
    // 先清空但不显示 toast
    state.selectedElements.forEach(item => {
      cleanupElement(item);
    });
    state.selectedElements = [];

    // 检测根容器
    const rootInfo = detectRootElement();
    state.rootElement = rootInfo.element;
    state.rootType = rootInfo.type;

    const scannedElements = new Set();
    const scanRules = POMConfig.scanRules;

    // 批量添加元素（纯数据操作）
    scanRules.forEach(rule => {
      // 只在根容器内查找
      const elements = rootInfo.element.querySelectorAll(rule.selector);

      elements.forEach(el => {
        if (el.closest('#pom-helper-panel')) return;

        let isDuplicate = false;
        scannedElements.forEach(scanned => {
          if (scanned.contains(el) || el.contains(scanned)) {
            isDuplicate = true;
          }
        });
        if (isDuplicate) return;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        scannedElements.add(el);
        addElement(el, rule.type); // 只做数据操作，不更新 UI
      });
    });

    // 所有元素添加完成后，统一更新 UI
    updateUI();
    POMUtils.showToast(`扫描完成，找到 ${state.selectedElements.length} 个元素`);
  }

  // ==================== 代码生成 ====================

  function generateCode() {
    if (state.selectedElements.length === 0) {
      return '// 请先选择页面元素';
    }

    const imports = new Set(["import { Page, Locator } from '@playwright/test';"]);
    const schemas = [];
    let properties = '';
    let constructorBody = '';

    // 检测基类
    const rootType = state.rootType || detectRootElement().type;
    let baseClass = null;

    if (POMConfig.baseClassMap && rootType) {
      baseClass = POMConfig.baseClassMap[rootType];
      if (baseClass && baseClass.import) {
        imports.add(baseClass.import);
      }
    }

    state.selectedElements.forEach((item, index) => {
      const { el, type, selector } = item;
      const name = item.name || `element${index + 1}`;

      let handled = false;

      // 尝试用插件处理
      if (POMConfig.plugins && POMConfig.plugins.length > 0) {
        for (const plugin of POMConfig.plugins) {
          if (plugin.match && plugin.match(el, type)) {
            const code = plugin.generateCode(el, name, selector, type);

            if (code.import) imports.add(code.import);
            if (code.schema) schemas.push(`const ${code.schema.name} = ${code.schema.value};`);
            properties += '  ' + code.property + '\n';
            constructorBody += '    ' + code.constructor + '\n';

            handled = true;
            break;
          }
        }
      }

      // 默认逻辑
      if (!handled) {
        if (type === 'Locator') {
          properties += `  readonly ${name}: Locator;\n`;
          constructorBody += `    this.${name} = this.root.locator('${selector}');\n`;
        } else {
          imports.add(`import { ${type} } from './components';`);
          properties += `  readonly ${name}: ${type};\n`;
          constructorBody += `    this.${name} = new ${type}(this.root.locator('${selector}'));\n`;
        }
      }
    });

    // 生成 schema 部分
    const schemaSection = schemas.length > 0
      ? '\n// Schema 定义\n' + schemas.join('\n\n') + '\n'
      : '';

    // 生成类声明
    const classDeclaration = baseClass
      ? `class GeneratedPage extends ${baseClass.name}`
      : `class GeneratedPage`;

    // 生成构造函数
    const constructorDeclaration = baseClass
      ? `constructor(root: Page | Locator) {\n    super(root);\n${constructorBody}  }`
      : `constructor(private root: Page | Locator) {\n${constructorBody}  }`;

    return `${Array.from(imports).join('\n')}
${schemaSection}
${classDeclaration} {
${properties}
  ${constructorDeclaration}
}`;
  }

  // ==================== UI 更新 ====================

  function updateUI() {
    POMUI.updateSelectedList(state.selectedElements, removeElement);
    state.plainCode = generateCode();
    POMUI.updateCodeDisplay(state.plainCode);
  }

  // 监听名称修改事件
  document.addEventListener('pom-name-change', (e) => {
    const { index, newName } = e.detail;
    if (state.selectedElements[index]) {
      state.selectedElements[index].name = newName;
      updateUI();
    }
  });

  // ==================== 面板控制 ====================

  function openPanel(startScan = true) {
    if (state.panel) return;

    state.panel = POMUI.createPanel();
    POMUI.createPickHint();

    POMUI.bindPanelEvents(state.panel, {
      onClose: closePanel,
      onPickMode: () => {
        setPickMode(true);
        POMUI.setModeActive('pick');
      },
      onScanMode: () => {
        setPickMode(false);
        POMUI.setModeActive('scan');
        autoScan();
      },
      onClear: clearSelected,
      onCopy: () => {
        if (state.plainCode) {
          navigator.clipboard.writeText(state.plainCode);
          POMUtils.showToast('代码已复制到剪贴板');
        }
      },
    });

    POMUI.makeDraggable(state.panel);
    window.addEventListener('scroll', updateLabelsPosition, true);

    if (startScan) {
      POMUI.setModeActive('scan');
      autoScan();
    } else {
      setPickMode(true);
      POMUI.setModeActive('pick');
    }
  }

  function closePanel() {
    setPickMode(false);

    state.selectedElements.forEach(item => {
      cleanupElement(item);
    });
    state.selectedElements = [];

    window.removeEventListener('scroll', updateLabelsPosition, true);
    POMUI.cleanup();

    state.panel = null;
    // 不重置 __POM_HELPER_LOADED__，避免重复注入脚本
  }

  // ==================== 对外接口 ====================

  window.POMHelper = {
    open: openPanel,
    close: closePanel,
    isOpen: () => !!state.panel,
    toggle: () => state.panel ? closePanel() : openPanel(true),
  };

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPanel') {
      openPanel(true);
      sendResponse({ success: true });
    } else if (message.action === 'togglePanel') {
      window.POMHelper.toggle();
      sendResponse({ success: true });
    }
    return true;
  });

})();

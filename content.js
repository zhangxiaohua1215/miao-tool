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
  };

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
    addElement(e.target);
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

  function addElement(el, forceType) {
    if (state.selectedElements.find(item => item.el === el)) {
      POMUtils.showToast('该元素已添加', 'error');
      return;
    }

    const type = forceType || POMUtils.detectElementType(el);
    const baseName = POMUtils.getSmartName(el, type);

    let name = baseName;
    let counter = 1;
    while (state.selectedElements.find(item => item.name === name)) {
      name = baseName + counter;
      counter++;
    }

    const selector = POMUtils.getBestSelector(el);
    const label = POMUI.createElementLabel(el, name, type);

    state.selectedElements.push({ el, type, name, selector, label });
    el.classList.add('pom-highlight-selected');

    updateUI();
    if (!forceType) POMUtils.showToast(`已添加: ${name}`);
  }

  function removeElement(index) {
    const item = state.selectedElements[index];
    if (item) {
      item.el?.classList.remove('pom-highlight-selected');
      item.label?.remove();
    }
    state.selectedElements.splice(index, 1);
    updateUI();
  }

  function clearSelected() {
    state.selectedElements.forEach(item => {
      item.el?.classList.remove('pom-highlight-selected');
      item.label?.remove();
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
      item.el?.classList.remove('pom-highlight-selected');
      item.label?.remove();
    });
    state.selectedElements = [];

    const scannedElements = new Set();

    POMConfig.scanRules.forEach(rule => {
      const elements = document.querySelectorAll(rule.selector);
      let count = 0;

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

        if (rule.onlyFirst && count > 0) return;

        scannedElements.add(el);
        addElement(el, rule.type);
        count++;
      });
    });

    POMUtils.showToast(`扫描完成，找到 ${state.selectedElements.length} 个元素`);
  }

  // ==================== 代码生成 ====================

  function generateCode() {
    if (state.selectedElements.length === 0) {
      return '// 请先选择页面元素';
    }

    const customTypes = new Set();
    const hasLocator = state.selectedElements.some(item => item.type === 'Locator');

    state.selectedElements.forEach(item => {
      if (item.type !== 'Locator') {
        customTypes.add(item.type);
      }
    });

    let properties = '';
    let constructorBody = '';

    state.selectedElements.forEach(item => {
      properties += `  readonly ${item.name}: ${item.type};\n`;

      if (item.type === 'Locator') {
        constructorBody += `    this.${item.name} = page.locator('${item.selector}');\n`;
      } else {
        constructorBody += `    this.${item.name} = new ${item.type}(page.locator('${item.selector}'));\n`;
      }
    });

    let imports = 'import { Page';
    if (hasLocator) imports += ', Locator';
    imports += " } from '@playwright/test';";

    if (customTypes.size > 0) {
      imports += `\nimport { ${Array.from(customTypes).join(', ')} } from './components';`;
    }

    return `${imports}

class GeneratedPage {
${properties}
  constructor(private page: Page) {
${constructorBody}  }
}`;
  }

  // ==================== UI 更新 ====================

  function updateUI() {
    POMUI.updateSelectedList(state.selectedElements, removeElement);
    state.plainCode = generateCode();
    POMUI.updateCodeDisplay(state.plainCode);
  }

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
      item.el?.classList.remove('pom-highlight-selected');
      item.label?.remove();
    });
    state.selectedElements = [];

    window.removeEventListener('scroll', updateLabelsPosition, true);
    POMUI.cleanup();

    state.panel = null;
    window.__POM_HELPER_LOADED__ = false;
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

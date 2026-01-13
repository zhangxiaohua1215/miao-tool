// POM Helper - UI 相关

window.POMUI = {
  // 创建主面板
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'pom-helper-panel';
    panel.innerHTML = `
      <div class="pom-header">
        <div class="pom-header-left">
          <span class="pom-logo">🎯</span>
          <span class="pom-title">POM Helper</span>
        </div>
        <div class="pom-header-btns">
          <button class="pom-header-btn" id="pom-minimize" title="最小化">─</button>
          <button class="pom-header-btn" id="pom-close" title="关闭">✕</button>
        </div>
      </div>
      <div class="pom-body">
        <div class="pom-mode-switch">
          <button class="pom-mode-btn active" id="pom-pick-mode">
            <span>👆</span>
            <span>点选模式</span>
          </button>
          <button class="pom-mode-btn" id="pom-scan-mode">
            <span>🔍</span>
            <span>扫描模式</span>
          </button>
        </div>
        
        <div class="pom-selected-label">
          <span>已选元素</span>
          <span class="pom-count" id="pom-count">0</span>
        </div>
        
        <div class="pom-selected-list" id="pom-selected-list">
          <div class="pom-empty">点击页面元素添加到列表</div>
        </div>
        
        <div class="pom-code-wrapper">
          <pre class="pom-code-area" id="pom-code"><code>// 生成的代码将显示在这里...</code></pre>
        </div>
        
        <div class="pom-actions">
          <button class="pom-action-btn secondary" id="pom-clear">🗑️ 清空</button>
          <button class="pom-action-btn primary" id="pom-copy">📋 复制代码</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    return panel;
  },

  // 创建点选提示条
  createPickHint() {
    const hint = document.createElement('div');
    hint.className = 'pom-pick-hint';
    hint.id = 'pom-pick-hint';
    hint.textContent = '🎯 点选模式已开启 - 点击页面元素添加到 POM，按 ESC 退出';
    document.body.appendChild(hint);
    return hint;
  },

  // 创建元素标签
  createElementLabel(el, name, type) {
    const label = document.createElement('div');
    label.className = 'pom-element-label';
    label.innerHTML = `<span class="pom-label-name">${name}</span><span class="pom-label-type">${type}</span>`;

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      label.style.left = (rect.left + window.scrollX) + 'px';
      label.style.top = (rect.top + window.scrollY - 24) + 'px';
    };

    updatePosition();
    document.body.appendChild(label);
    label._updatePosition = updatePosition;

    return label;
  },

  // 绑定面板事件
  bindPanelEvents(panel, handlers) {
    panel.querySelector('#pom-minimize').addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });

    panel.querySelector('#pom-close').addEventListener('click', handlers.onClose);
    panel.querySelector('#pom-pick-mode').addEventListener('click', handlers.onPickMode);
    panel.querySelector('#pom-scan-mode').addEventListener('click', handlers.onScanMode);
    panel.querySelector('#pom-clear').addEventListener('click', handlers.onClear);
    panel.querySelector('#pom-copy').addEventListener('click', handlers.onCopy);
  },

  // 拖拽功能
  makeDraggable(panel) {
    const header = panel.querySelector('.pom-header');
    if (!header) return;

    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.pom-header-btn')) return;

      isDragging = true;
      header.setPointerCapture(e.pointerId);

      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;

      panel.style.left = startLeft + 'px';
      panel.style.top = startTop + 'px';
      panel.style.right = 'auto';
      panel.style.transition = 'none';

      e.preventDefault();
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newLeft = startLeft + deltaX;
      let newTop = startTop + deltaY;

      newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, newTop));

      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    header.addEventListener('pointerup', (e) => {
      if (isDragging) {
        isDragging = false;
        header.releasePointerCapture(e.pointerId);
        panel.style.transition = '';
      }
    });

    header.addEventListener('selectstart', (e) => e.preventDefault());
  },

  // 更新已选元素列表
  updateSelectedList(elements, onDelete) {
    const list = document.getElementById('pom-selected-list');
    const count = document.getElementById('pom-count');

    if (!list || !count) return;

    count.textContent = elements.length;

    if (elements.length === 0) {
      list.innerHTML = '<div class="pom-empty">点击页面元素添加到列表</div>';
    } else {
      list.innerHTML = elements.map((item, idx) => `
        <div class="pom-selected-item">
          <div class="pom-item-info">
            <span class="pom-item-type">${item.type}</span>
            <span class="pom-item-name">${item.name}</span>
          </div>
          <button class="pom-item-delete" data-index="${idx}">✕</button>
        </div>
      `).join('');

      list.querySelectorAll('.pom-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          onDelete(index);
        });
      });
    }
  },

  // 更新代码显示
  updateCodeDisplay(code) {
    const codeEl = document.getElementById('pom-code');
    if (codeEl) {
      codeEl.innerHTML = POMUtils.highlightCode(code);
    }
  },

  // 设置模式按钮状态
  setModeActive(mode) {
    const pickBtn = document.getElementById('pom-pick-mode');
    const scanBtn = document.getElementById('pom-scan-mode');
    
    if (mode === 'pick') {
      pickBtn?.classList.add('active');
      scanBtn?.classList.remove('active');
    } else {
      scanBtn?.classList.add('active');
      pickBtn?.classList.remove('active');
    }
  },

  // 清理所有 UI 元素
  cleanup() {
    const panel = document.getElementById('pom-helper-panel');
    const toast = document.getElementById('pom-toast');
    const hint = document.getElementById('pom-pick-hint');

    if (panel) panel.remove();
    if (toast) toast.remove();
    if (hint) hint.remove();
  },
};


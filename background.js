// POM Helper - Background Service Worker
// 点击扩展图标直接启动扫描模式

chrome.action.onClicked.addListener(async (tab) => {
  // 检查是否是可以注入脚本的页面
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    return;
  }

  try {
    // 先尝试发送消息（如果 content script 已加载）
    await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
  } catch (error) {
    // content script 未加载，先注入所有文件
    try {
      // 注入 CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
      });

      // 按顺序注入 JS 文件（依赖关系：config -> utils -> ui -> content）
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['config.js', 'utils.js', 'ui.js', 'content.js']
      });

      // 等待一下再发送消息
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
        } catch (e) {
          console.error('POM Helper: 发送消息失败', e);
        }
      }, 100);
    } catch (e) {
      console.error('POM Helper: 无法在此页面使用', e);
    }
  }
});

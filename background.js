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

      // 使用重试机制确保脚本加载完成
      const sendMessageWithRetry = async (retries = 5, delay = 50) => {
        for (let i = 0; i < retries; i++) {
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
            return; // 成功则退出
          } catch (e) {
            if (i === retries - 1) {
              console.error('POM Helper: 发送消息失败，已重试', retries, '次', e);
            } else {
              // 等待后重试，延迟逐渐增加
              await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
          }
        }
      };

      sendMessageWithRetry();
    } catch (e) {
      console.error('POM Helper: 无法在此页面使用', e);
    }
  }
});

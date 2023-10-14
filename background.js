chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.redirect) {
    chrome.tabs.update(sender.tab.id, {url: chrome.runtime.getURL(request.redirect)});
  }
});


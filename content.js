/// Code ordered from most important to least important

async function blockWebsite(reason) {
  // redirect to block.html with reason
  chrome.runtime.sendMessage({redirect: 'blocked.html' + `?reason=${encodeURIComponent(reason)}`});
}

async function main() {
  const settings = (await getStorage()).settings
  const args = await shouldBlock(settings, {
    title: document.title,
    url: window.location.href,
    time: currentTime(),
  });
  if (args && args.block) {
    blockWebsite(args.reasoning);
  }
}

function init() {
  // mutation observer for title changes, on title change, run main
  const titleElement = document.querySelector('title');
  if (titleElement) {
    const observer = new MutationObserver(() => {
      console.log('Title changed: ', document.title)
      main()
    });
    observer.observe(titleElement, { childList: true });
  } else {
    setTimeout(init, 50);
  }
}

const loaded = (document.readyState === 'complete' || document.readyState === 'interactive')

if (loaded) {
  console.log('Load already completed')
  init()
} else {
  console.log('Waiting for load...')
  document.addEventListener('DOMContentLoaded', init)
}

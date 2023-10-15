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

// Has the document title fully loaded? (that's what we filter by)
function fullyLoaded() {
  const url = window.location.href;
  const title = document.title;

  // Tweets should contain " on Twitter: "
  if (url.match(/twitter\.com\/[^\/]+\/status\/\d+/) && !title.match(/ on (Twitter|X): /)) {
    return false;
  }

  // YouTube videos should end with " - YouTube"
  if (url.match(/youtube\.com\/watch\?v=/) && !title.match(/ - YouTube$/)) return false;

  // Disable for toggl because the title changes every second
  if (url.match(/track\.toggl\.com\/timer/)) return false;

  // Otherwise hope for the best!
  return true
}

function init() {
  // mutation observer for title changes, on title change, run main
  const titleElement = document.querySelector('title');
  if (titleElement) {
    const observer = new MutationObserver(() => {
      if (!fullyLoaded()) return;

      console.log('Title changed: ', document.title)
      if (!chrome.runtime?.id) {
        // The extension was reloaded and this script is orphaned
        observer.disconnect();
        return;
      }
      main()
    });
    observer.observe(titleElement, { childList: true });
  } else {
    setTimeout(init, 50); // wait for <title> to load
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

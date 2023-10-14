async function main() {
  if (await shouldBlock()) {
    document.body.innerHTML = `
  <h1 style="
      font-family: 'Arial', sans-serif !important;
      font-size: 24px !important;
      color: black !important;
      text-align: center !important;
      margin: 20% auto !important;
      padding: 20px !important;
      background-color: white !important;
      border: 2px solid red !important;
      display: block !important;
      width: 60% !important;
      box-shadow: 0px 0px 10px rgba(0,0,0,0.5) !important;
      max-width: 100% !important;
      overflow: hidden !important;
      word-wrap: break-word !important;
  ">
    This website is blocked based on its content
  </h1>`;
  }
}

function shouldBlock() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('blockedPatterns', function(data) {
      if (data.blockedPatterns) {
        for (let pattern of data.blockedPatterns) {
          let regex = new RegExp(pattern);
          if (regex.test(document.title)) {
            resolve(true);
            return;
          }
        }
      }
      resolve(false);
    });
  });
}


const loaded = (document.readyState === 'complete' || document.readyState === 'interactive')

if (loaded) {
  console.log("Load already completed")
  main()
} else {
  console.log("Waiting for load...")
  document.addEventListener('DOMContentLoaded', main)
}

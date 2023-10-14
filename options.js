document.getElementById('settingsForm').addEventListener('submit', function(event) {
  event.preventDefault();
  let formData = new FormData(this);
  let settings = {};
  for (const [key, value]  of formData.entries()) { settings[key] = value; }
  console.log('saving settings', settings)
  chrome.storage.sync.set({'settings': settings}, function() {
    console.log("Settings saved")
    // set submit button text to "saved" temporarily
    const submitInput = document.getElementById('submit');
    submitInput.value = "Saved";
    setTimeout(function() { submitInput.value = "Save"; }, 500);
  });
});

// Load existing patterns on opening the options page
chrome.storage.sync.get(function(data) {
  if (data.settings) {
    console.log("Past settings", data.settings)
    const form = document.getElementById('settingsForm');
    for (const [key, value] of Object.entries(data.settings)) {
      const element = form.elements.namedItem(key);
      if (element) { element.value = value; }
    }

    // If there are keys in the html form that are not in the settings, then
    // submit a synthetic event to set the default values.
    const newKeys = Array.from(form.querySelectorAll('textarea, input')).filter((el) => {
      return !Object.keys(data.settings).includes(el.name) && el.type != 'submit';
    });
    console.log("Keys", newKeys);
    if (newKeys.length > 0) {
      document.getElementById('submit').click();
    }
  }
});


document.getElementById('testButton').addEventListener('click', () => {
  // Read user history and display at the bottom
  chrome.history.search({text: '', maxResults: 20}, async (history) => {
    let resultElements = []
    const settings = (await getStorage()).settings

    for (const item of history) {
      const li = document.createElement('li');
      li.innerText = item.title + ' - ' + item.url;
      li.style.color = 'black'; // loading
      li.style.whiteSpace = 'pre-wrap';
      li.style.fontSize = '14px';
      resultElements.push(li);

      // Insert the li
      document.getElementById('testResults').replaceChildren(...resultElements);

      // check the site
      const args = await shouldBlock(settings, {
        title: item.title, url: item.url, time: currentTime()
      });
      if (!args) {
        li.innerText = 'Skipped: ' + item.title + ' - ' + item.url;
        li.style.color = 'gray';
        continue;
      }
      li.innerText = item.title + ' - ' + item.url + `\nReason: ${args.reasoning}`;
      li.style.color = args.block ? 'red' : 'green'
    }
  });
})

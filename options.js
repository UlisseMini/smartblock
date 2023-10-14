document.getElementById('settingsForm').addEventListener('submit', function(event) {
  console.log("Submit")
  event.preventDefault();
  let formData = new FormData(this);
  let settings = {};
  for (const [key, value]  of formData.entries()) { settings[key] = value; }
  console.log('saving settings', settings)
  chrome.storage.sync.set({'settings': settings}, function() {
    console.log("Settings saved")
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
  }
});


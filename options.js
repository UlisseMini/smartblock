document.getElementById('save').addEventListener('click', function() {
  let patterns = document.getElementById('patterns').value.split('\n');
  chrome.storage.sync.set({ "blockedPatterns": patterns });
});

// Load existing patterns on opening the options page
chrome.storage.sync.get('blockedPatterns', function(data) {
  if(data.blockedPatterns) {
    document.getElementById('patterns').value = data.blockedPatterns.join('\n');
  }
});


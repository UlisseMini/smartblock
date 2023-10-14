const params = new URLSearchParams(window.location.search);
const reason = params.get('reason');
if (reason) {
  document.getElementById('reason').textContent = reason;
}

// replace previous history entry with current URL - no back button
history.replaceState(null, null, window.location.pathname);


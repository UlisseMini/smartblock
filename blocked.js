const params = new URLSearchParams(window.location.search);
const reason = params.get('reason');
if (reason) {
  document.getElementById('reason').textContent = reason;
}

// replace previous history entry with current URL - no back button
history.replaceState(null, null, window.location.pathname);


// feedback function
async function feedback(content) {
  const webhookURL = "https://discord.com/api/webhooks/1163153622809448488/BM8gv_FCfv5wmJ0bd1z-myXir4mhkO7joSvx8MWrzhllLxnF1vvNbmqUX1zlyxMq5LBT"
  const resp = await fetch(webhookURL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({content: content}),
  });
  return resp
}

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // get submit element and change value
  const submit = document.getElementById('submit');
  submit.value = 'Sending...';
  submit.disabled = true;

  // get name="feedback" value from form
  const form = new FormData(e.target);
  const fb = form.get('feedback');

  const resp = await feedback(`reason: ${reason}\n\nfeedback: ${fb}`);
  submit.value = resp.ok ? 'Sent!' : 'Error sending';
  submit.disabled = false;
  if (!resp.ok) { console.error(resp.status); console.error(await resp.json()); }
});

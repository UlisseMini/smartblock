/// Code ordered from most important to least important

async function shouldBlock() {
  console.log(`------------ Checking ${document.title}`)
  let settings = (await getStorage()).settings;
  console.log('settings', settings)
  if (!settings.instructions) return;
  if (!settings.apiKey) return;

  let instructions = settings.instructions

  let date = new Date();
  let time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': [
        {'role': 'system', 'content': 'You are BlockGPT. an AI that blocks websites based on nuanced instructions and reasoning.'},
        {'role': 'user', 'content': `Block instructions: ${instructions}`},
        {'role': 'user', 'content': `Should the website with title "${document.title}" and url starting with "${window.location.href.slice(0, 40)}" be blocked at ${time}? Call the function with the answer.`},
      ],
      'temperature': 0,
      'functions': [{
        'name': 'block',
        'description': 'Pass true to block the site, or false not to',
        'parameters': {
          'type': 'object',
          'properties': {
            'reasoning': {
              'type': 'string',
              'description': 'Step-by-step reasoning for decision',
            },
            'block': {
              'type': 'boolean',
              'description': 'Whether to block the website',
            }
          },
          'required': ['reasoning', 'block'],
        },
      }],
    })
  });
  console.log(resp);
  if (!resp.ok) {
    console.log(`Error: ${resp.status} ${resp.statusText}`);
    return;
  }

  const json = await resp.json();
  message = json['choices'][0]['message']
  let args = null;
  if (message["function_call"] && message["function_call"]["name"] == 'block') {
    try {
      args = JSON.parse(message["function_call"]["arguments"])
      console.log(`raw args: ${message['function_call']['arguments']}`)
    } catch (e) {
      console.log(`Error parsing arguments: ${e}`)
    }
  }

  console.log(`--------- CONCLUSION: ${JSON.stringify(args)}`)
  return args;
}

async function blockWebsite(reason) {
  // Create a full-page overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.zIndex = '99999999'; // a high value to ensure it's on top
  overlay.style.backgroundColor = 'rgba(255,255,255,0.95)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.flexDirection = 'column';
  overlay.style.fontSize = '24px';
  overlay.textAlign = 'center';
  overlay.style.color = '#333';

  // Add block message and reason
  overlay.innerHTML = `
        <h1>This website is blocked</h1>
        <p style="max-width: 70ch; padding: 16px;">${reason}</p>
    `;

  // Append the overlay to the body
  document.body.replaceChildren(overlay);
}


async function main() {
  const args = await shouldBlock();
  if (args && args.block) {
    blockWebsite(args.reasoning);
  }
}


async function getStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(result);
      }
    });
  });
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

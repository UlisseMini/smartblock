// Pure function using the openai api
async function shouldBlock(settings, context) {
  console.log(`------------ Checking ${document.title}`)
  if (!settings.urlPatterns) return;
  if (!settings.instructions) return;
  if (!settings.system) return;
  if (!settings.apiKey) return;

  const patterns = settings.urlPatterns.trim().split('\n')
  if (!patterns.some(p => context.url.match(p.replace('*', '.*')))) {
    console.log(`No patterns matched ${context.url}`)
    return;
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': [
        {'role': 'system', 'content': settings.system},
        {'role': 'user', 'content': settings.instructions},
        {'role': 'user', 'content': substitute(settings.template, context)},
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
              'description': 'Step-by-step reasoning for if the site should be blocked',
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
  let rawArgs = null;
  if (message["function_call"] && message["function_call"]["name"] == 'block') {
    rawArgs = message["function_call"]["arguments"]
    try {
      args = JSON.parse(rawArgs)
      console.log(`raw args: ${message['function_call']['arguments']}`)
    } catch (e) {
      console.log(`Error parsing arguments: ${e}`)
    }
  }

  console.log(`--------- CONCLUSION, RAW ARGS: ${rawArgs}`)
  return args;
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

function currentTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit', minute:'2-digit', hour12: true,
  });
}

function substitute(str, vars) {
  return str.replace(/\$\{([^\}]*)\}/g, (_, match) => vars[match]);
}

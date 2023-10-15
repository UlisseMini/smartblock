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
  
  const body = {
      'model': 'gpt-3.5-turbo',
      'messages': [
        {'role': 'system', 'content': settings.system},
        {'role': 'user', 'content': settings.instructions},
        {'role': 'user', 'content': substitute(settings.template, context)},
      ],
      'temperature': 0,
      'functions': [{
        'name': 'block_decision',
        'description': 'Decide whether to block the website',
        'parameters': {
          'type': 'object',
          'properties': {
            'block_choice': {
              'type': 'boolean',
              'description': 'true if the site should be blocked, false otherwise',
            }
          },
          'required': ['block_choice'],
        },
      }],
  };
  console.log("Calling API with body:", JSON.stringify(body, null, 2));

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  console.log(resp);
  if (!resp.ok) {
    console.log(`Error: ${resp.status} ${resp.statusText}`);
    return;
  }

  const json = await resp.json();
  message = json['choices'][0]['message'];
    console.log('message response', message)
  let args = null;
  let rawArgs = null;
  if (message.content) {
    args = {reasoning: message.content};
  }
  if (message["function_call"] && message["function_call"]["name"] == 'block_decision') {
    rawArgs = message["function_call"]["arguments"];
    try {
      args = JSON.parse(rawArgs)
      console.log(`raw args: ${message['function_call']['arguments']}`);
      args.block = args.block_choice;
    } catch (e) {
      console.log(`Error parsing arguments: ${e}`);
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

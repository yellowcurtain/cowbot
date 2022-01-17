import fetch from 'cross-fetch'
import config from './config.json'


export function sendDiscordMessage(text: string, url: string) {    

  const data = { content: text }
  const response = fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => {
    console.log('Success:', response.status)
  })
  .catch((error) => {
    console.error('Error:', error)
  })
}



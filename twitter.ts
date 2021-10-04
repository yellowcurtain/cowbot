import TwitterApi from 'twitter-api-v2'
import config from './config.json'

export function sendTwitterMessage(text: string) {
  
  (async () => {
    const client = new TwitterApi({
      appKey: config.twitter.appKey,
      appSecret: config.twitter.appSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    })
    const response = await client.v1.tweet(text)
    console.log(response.created_at)
  })()
}


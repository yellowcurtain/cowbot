import { ethers } from "ethers"
import { isCow } from "./cow"
import { sendDiscordMessage } from "./discord"
import { sendTwitterMessage } from "./twitter"
import config from './config.json'


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  try {
    console.log("start")
    const provider = new ethers.providers.JsonRpcProvider(config.main.providerUrl)
    const contractAddress = "0x9008d19f58aabd9ed0d60971565aa8510560ab41"
    let endBlock = await provider.getBlockNumber()
    let startBlock = endBlock

    while(1) {
        console.log("====================")
        console.log('s:', startBlock)
        console.log('e:', endBlock)

        const filt = {
            address: contractAddress,
            fromBlock: startBlock, //13332639
            toBlock: endBlock //13349144
        }
        const logs = await provider.getLogs(filt)
        
        // group tx        
        let transactions = new Array()
        for (const log of logs) {
          const txHash = log.transactionHash  
          if (!transactions.includes(txHash)) {
            transactions.push(txHash)
          }
        }
        
        // console.log(transactions)
        for (const txHash of transactions) {
          const txReceipt = await provider.getTransactionReceipt(txHash)
          const txLogs = txReceipt.logs
          // console.log(txLogs)
          const result = isCow(txLogs)
          console.log(txHash)
          console.log(result)
          
          if (result) {
            
            // count trades in transaction
            let total_trade = 0
            for (const entry of txLogs) {
              if (entry.topics[0] == "0xa07a543ab8a018198e99ca0184c93fe9050a79400a0a723441f84de1d972cc17") {
                  total_trade = total_trade + 1
              }
            }

            const text = "We found a CoW, included " + total_trade + " trades. Transaction detail: https://etherscan.io/tx/" + txHash
            console.log(text)
                        
            sendDiscordMessage(text)
            sendTwitterMessage(text)
          }
        }
        
        // wait to fetch data every minutes
        await sleep(60000)
        startBlock = endBlock + 1
        endBlock = await provider.getBlockNumber()
    }
  } catch (e) {
      console.log("errer:")
      console.log(e)
  }
})()




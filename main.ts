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
            toBlock: endBlock
        }
        const logs = await provider.getLogs(filt)
        
        // group logs by tx
        let logsByTx = new Map()
        for (const log of logs) {
          const txHash = log.transactionHash      
          if (logsByTx.get(txHash) != null) {
            let txLogs = logsByTx.get(txHash)
            txLogs.push(log)
            logsByTx.set(txHash, txLogs)  
          } else {
            let txLogs = new Array()
            txLogs.push(log)
            logsByTx.set(txHash, txLogs)    
          }          
        }

        logsByTx.forEach((value,key)=>{
          const logs = value
          const txHash = key
          const result = isCow(logs)
          console.log(txHash)
          console.log(result)      
          
          if (result) {
            const text = "We found a cow: https://etherscan.io/tx/" + txHash
            console.log(text)
            sendDiscordMessage(text)
            sendTwitterMessage(text)
          }
        })
        
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




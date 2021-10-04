import { Log } from "@ethersproject/abstract-provider"
import { BigNumber, BigNumberish, ethers } from "ethers"
import { GPv2Settlement } from "@gnosis.pm/gp-v2-contracts/networks.json"

export const SETTLEMENT_CONTRACT = GPv2Settlement["1"].address.toLowerCase()

export function isCow(log_entries: Array<Log>): boolean {
  const parsed = parseLogs(log_entries)
  //console.log(parsed)
  return _isCow(parsed)
}

interface ParsedLogs {
  inflows: Map<string, BigNumberish>
  outflows: Map<string, BigNumberish>
}

function _isCow(parsed: ParsedLogs): boolean {
  if (parsed.outflows.size === 0) {
    // If there were not transfer interactions, then it was likely not a CoW
    return false
  }
  for (const [key, inAmount] of parsed.inflows) {
    const outAmount = BigNumber.from(parsed.outflows.get(key) || 0)
    console.log(`${inAmount} vs ${outAmount}`)
    // If less than 90% of inflow amount, flew back out this is a good sign for a CoW!
    if (outAmount.mul(10).div(inAmount).lt(9)) {    
      //sendDiscord()
      return true
    }
  }
  return false
}

function parseLogs(log_entries: Array<Log>): ParsedLogs {
  const inflows = new Map()
  const outflows = new Map()

  const x = indexOfLastInteraction(log_entries)
  //console.log(x)
  
  const relevant_logs = log_entries.slice(0, indexOfLastInteraction(log_entries))
  //console.log(relevant_logs)
  
  for (const entry of relevant_logs) {
    switch (entry.topics[0]) {
      case "0xa07a543ab8a018198e99ca0184c93fe9050a79400a0a723441f84de1d972cc17": {
        // Trade
        const sellToken = "0x" + entry.data.substring(26, 66)
        const sellAmount = BigNumber.from("0x" + entry.data.substring(130, 194))
        const feeAmount = BigNumber.from("0x" + entry.data.substring(258, 322))
        const previous = inflows.get(sellToken) || BigNumber.from(0)
        // only consider the part of the sell amount that is not fee
        inflows.set(sellToken, previous.add(sellAmount.sub(feeAmount)))
        break
      }
      case "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
        //Transfer
        if (entry.topics[1].includes(SETTLEMENT_CONTRACT.substring(2))) {
          const token = entry.address.toLowerCase()
          const amount = BigNumber.from(entry.data)
          const previous = outflows.get(token) || BigNumber.from(0)
          outflows.set(token, previous.add(amount))
          break
        }
      }
    }
  }
  return {
    inflows,
    outflows
  }
}

function indexOfLastInteraction(log_entries: Array<Log>) {
  let index = 0
  for (let i = 0; i < log_entries.length; i++) {
    if (log_entries[i].topics[0] === "0xed99827efb37016f2275f98c4bcf71c7551c75d59e9b450f79fa32e60be672c2") {
      index = i
    }
  }
  return index
}


//
// (async () => {
//   try {
//     console.log("start")
//
//     const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/3cf09824e2164be79af077c456dbf13f')
//     const contractAddress = "0x9008d19f58aabd9ed0d60971565aa8510560ab41"
//     const filt = {
//         address: contractAddress,
//         fromBlock: 13332639,
//         toBlock: 13332639
//     }
//     const logs = await provider.getLogs(filt)
//     console.log(logs)
//     // isCow(logs)
//   } catch (e) {
//       // Deal with the fact the chain failed
//
//       console.log("errer?")
//       console.log(e)
//   }
// })();
//



// (async () => {
//   try {
//     console.log("start")
//
//     const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/3cf09824e2164be79af077c456dbf13f')
//     const contractAddress = "0x9008d19f58aabd9ed0d60971565aa8510560ab41"
//     let endBlock = await provider.getBlockNumber()
//     let startBlock = endBlock
//
//     while(1) {
//         console.log(startBlock)
//         console.log(endBlock)
//         const filt = {
//             address: contractAddress,
//             fromBlock: startBlock,
//             toBlock: endBlock
//         }
//         const logs = await provider.getLogs(filt)
//         console.log(logs)
//         console.log("====================")
//         isCow(logs)
//
//         await sleep(60000)
//         startBlock = endBlock + 1
//         endBlock = await provider.getBlockNumber()
//     }
//   } catch (e) {
//       // Deal with the fact the chain failed
//
//       console.log("errer?")
//       console.log(e)
//   }
// })();




// const provider = new ethers.providers.WebSocketProvider("wss://mainnet.infura.io/ws/v3/3cf09824e2164be79af077c456dbf13f");
// const contractAddress = "0x9008d19f58aabd9ed0d60971565aa8510560ab41"
// let txQueue = []
// const filter = {
//     address: contractAddress
// }


// provider.getLogs(filter, (logs) => {
//
//     console.log(logs)
//
//     //console.log(last_txHash)
//     // tx = log.transactionHash
//     // if (txQueue.includes(tx) == false) {
//     //     txQueue.push(tx)
//     //     if (txQueue.length > 0) {
//     //         tx0 = txQueue[0]
//     //         const receipt = await provider.getTransactionReceipt(tx0)
//     //         const logs = receipt.logs
//     //         const result = isCow(logs)
//     //         // ?
//     //         // ??last_txHash = log.transactionHash
//     //         // ??
//     //         // console.log(last_txHash)
//     //         console.log("Is cows?")
//     //         console.log(result)
//     //     }
//     // }
//     //
//     //
//     // // New transaction
//     // if (log.transactionHash != last_txHash) {
//     //     // console.log("=======================")
//     //     console.log("New transaction")
//     //
//     //     let promises: Promise< TransactionReceipt  >[ ] = [ ];
//     //     promises.push();
//     //      Promise.all(promises)
//     //
//     //     // console.log("=======================")
//     // }
// })

// const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/3cf09824e2164be79af077c456dbf13f')
// const receipt = await provider.getTransactionReceipt("0xaa68ce79d91191297287cb359f4229e5e105fa82d4e95c2951c53a26a6f5ff2d")
// const logs = receipt.logs
// console.log(logs)
// const result = isCow(logs)
// console.log(result)

// const abiJson = require("./abi.json")
// const abi = abiJson["abi"]
// const contract = new ethers.Contract(
//   contractAddress,
//   abi,
//   provider.getSigner(0)
// );
//
// const newValue = await contract.address;
// console.log(newValue);





// var customWsProvider = new ethers.providers.WebSocketProvider("wss://mainnet.infura.io/ws/v3/3cf09824e2164be79af077c456dbf13f");
//
// customWsProvider.on("pending", (tx) => {
//   customWsProvider.getTransaction(tx).then(function (transaction) {
//     console.log(transaction);
//   });
// });



// interface TransactionReceipt {
//     to: string;
//     from: string;
//     contractAddress: string,
//     transactionIndex: number,
//     root?: string,
//     gasUsed: BigNumber,
//     logsBloom: string,
//     blockHash: string,
//     transactionHash: string,
//     logs: Array<Log>,
//     blockNumber: number,
//     confirmations: number,
//     cumulativeGasUsed: BigNumber,
//     effectiveGasPrice: BigNumber,
//     byzantium: boolean,
//     type: number;
//     status?: number
// }

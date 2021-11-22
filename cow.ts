import { Log } from "@ethersproject/abstract-provider"
import { BigNumber, BigNumberish, ethers } from "ethers"
import { GPv2Settlement } from "@gnosis.pm/gp-v2-contracts/networks.json"

export const SETTLEMENT_CONTRACT = GPv2Settlement["1"].address.toLowerCase()

export function isCow(log_entries: Array<Log>): boolean {
  const parsed = parseLogs(log_entries)
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
      return true
    }
  }
  return false
}

function parseLogs(log_entries: Array<Log>): ParsedLogs {
  const inflows = new Map()
  const outflows = new Map()

  const x = indexOfLastInteraction(log_entries)  
  const relevant_logs = log_entries.slice(0, indexOfLastInteraction(log_entries))
  
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

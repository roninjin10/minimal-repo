/**
 * op-viem builds on top of viem
 */
import { Hex, createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { goerli } from "viem/chains";
import { optimismGoerli } from "op-viem/chains";
import { ExampleNFT } from './ExampleNFT.sol'

console.log('Starting op-viem example')

/**
 * CONSTANTS
 */
const PRIVATE_KEY = process.env.BUN_PRIVATE_KEY
const NFT_ADDRESS = '0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b'
const TOKEN_ID = 187070n
if (!PRIVATE_KEY) {
  throw new Error('unable to read private key')
}

/**
 * Viem has an intuitive typesafeapi for interacting with contracts
 */
const account = privateKeyToAccount(PRIVATE_KEY as Hex)
/*
const l2WalletClient = createWalletClient({
  chain: optimismGoerli,
  transport: http('https://goerli.optimism.io')
})
const l2TxHash = await l2WalletClient.writeContract({
  account,
  abi: ExampleNFT.abi,
  address: NFT_ADDRESS,
  functionName: 'transferFrom',
  args: [account.address, account.address, TOKEN_ID]
})
const etherscanLinkSimple = `${optimismGoerli.blockExplorers?.etherscan?.url}/tx/${l2TxHash}`
console.log('Simple l2 send tx link', etherscanLinkSimple)
*/



/**
 * To use op-viem simply decorate your client with the appropriate op-viem actions
 */
const { walletL1OpStackActions, publicL1OpStackActions } = await import('op-viem')
const l1WalletClient = createWalletClient({
  chain: goerli,
  account,
  transport: http('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
}).extend(walletL1OpStackActions)
const l1PublicClient = createPublicClient({
  chain: goerli,
  transport: http('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
}).extend(publicL1OpStackActions)

const txHash = await l1WalletClient.writeDepositETH({
  account,
  l2Chain: optimismGoerli,
  value: parseEther('.042'),
  args: { minGasLimit: 200_000, to: account.address }
})
await l1PublicClient.waitForTransactionReceipt({ hash: txHash })
const hashes = await l1PublicClient.getL2HashesForDepositTx({ l1TxHash: txHash })
console.log({ hashes })
const etherscanLinkL1DepositEth = `${goerli.blockExplorers?.etherscan?.url}/tx/${txHash}`
const etherscanLinkL2DepositEth = `${optimismGoerli.blockExplorers?.etherscan?.url}/tx/${hashes[0]}`
console.log('L1 deposit eth tx link', etherscanLinkL1DepositEth)
console.log('L2 deposit eth tx link', etherscanLinkL2DepositEth)

/**
 * OP Viem is very intuitive if you are already used to viem and will be upstreamed into viem in the future
 * Note how this api to do a deposit tx from l1 matches exactly how we did it above from l2
 */
const l1TxHash = await l1WalletClient.writeContractDeposit({
  account,
  abi: ExampleNFT.abi,
  address: NFT_ADDRESS,
  functionName: 'transferFrom',
  args: [account.address, account.address, TOKEN_ID],
  ...{ value: parseEther('.0420420420') },
  // these are the only differences from the original function call
  l2Chain: optimismGoerli,
  l2MsgValue: parseEther('.042042042069'),
  l2GasLimit: 200_000n,
})
await l1PublicClient.waitForTransactionReceipt({ hash: l1TxHash })
const [l2DepositTxHash] = await l1PublicClient.getL2HashesForDepositTx({ l1TxHash })
const etherscanLinkL1Deposit = `${goerli.blockExplorers?.etherscan?.url}/tx/${l1TxHash}`
const etherscanLinkL2Deposit = `${optimismGoerli.blockExplorers?.etherscan?.url}/tx/${l2DepositTxHash}`
console.log('L1 deposit tx link', etherscanLinkL1Deposit)
console.log('L2 deposit tx link', etherscanLinkL2Deposit)


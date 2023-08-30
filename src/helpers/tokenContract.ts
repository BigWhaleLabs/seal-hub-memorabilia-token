import { AlchemyProvider } from '@ethersproject/providers'
import { SealHubMemorabiliaToken__factory } from '@big-whale-labs/seal-hub-memorabilia-token-contracts'
import env from 'helpers/env'

export default SealHubMemorabiliaToken__factory.connect(
  env.VITE_TOKEN_ADDRESS,
  new AlchemyProvider('goerli', env.VITE_ALCHEMY_KEY)
)

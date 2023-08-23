import '@rainbow-me/rainbowkit/styles.css'

import {
  RainbowKitProvider,
  getDefaultWallets,
  midnightTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

import ChildrenProp from 'models/ChildrenProp'
import env from 'helpers/env'

const { chains, publicClient } = configureChains(
  [goerli],
  [alchemyProvider({ apiKey: env.VITE_ALCHEMY_KEY }), publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'SealHub | memorabilia token',
  projectId: env.VITE_WALLETCONNECT_PROJECT_ID,
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export default function ({ children }: ChildrenProp) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        coolMode
        chains={chains}
        theme={midnightTheme({
          ...midnightTheme.accentColors.purple,
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

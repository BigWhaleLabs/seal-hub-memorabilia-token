import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

function ConnectionFlow() {
  return (
    <>
      <p>First, please connect your wallet!</p>
      <ConnectButton
        accountStatus="address"
        chainStatus="none"
        showBalance={false}
      />
    </>
  )
}

function MintingFlow() {
  const { address } = useAccount()
  return (
    <>
      <p>Connected address {address}</p>
      <p>Next, sign the message!</p>
      <button class="btn btn-primary">Sign the message!</button>
    </>
  )
}

export default function () {
  const { isConnected } = useAccount()

  return isConnected ? <MintingFlow /> : <ConnectionFlow />
}

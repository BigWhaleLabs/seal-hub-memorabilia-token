import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function () {
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

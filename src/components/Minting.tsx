import { useAccount } from 'wagmi'
import ConnectionFlow from 'components/ConnectionFlow'
import MintingFlow from 'components/MintingFlow'

export default function () {
  const { isConnected } = useAccount()

  return isConnected ? <MintingFlow /> : <ConnectionFlow />
}

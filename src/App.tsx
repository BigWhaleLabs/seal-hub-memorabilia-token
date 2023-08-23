import Description from 'components/Description'
import Minting from 'components/Minting'
import Root from 'components/Root'
import WalletProvider from 'components/WalletProvider'

export default function () {
  return (
    <WalletProvider>
      <Root>
        <Description />
        <Minting />
      </Root>
    </WalletProvider>
  )
}

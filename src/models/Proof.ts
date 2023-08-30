import { BigNumberish } from 'ethers'

export default interface Proof {
  _pA: [BigNumberish, BigNumberish]
  _pB: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]]
  _pC: [BigNumberish, BigNumberish]
  _pubSignals: [BigNumberish, BigNumberish]
}

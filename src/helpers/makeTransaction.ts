import { BigNumber } from 'ethers'
import Proof from 'models/Proof'
import ProofResult from 'models/ProofResult'

export default function (proofResult: ProofResult) {
  // This is a hacky way to get rid of the third arguments that are unnecessary and convert to BigNumber
  // Also pay attention to array indexes
  return {
    _pA: [
      BigNumber.from(proofResult.proof.pi_a[0]),
      BigNumber.from(proofResult.proof.pi_a[1]),
    ],
    _pB: [
      [
        BigNumber.from(proofResult.proof.pi_b[0][1]),
        BigNumber.from(proofResult.proof.pi_b[0][0]),
      ],
      [
        BigNumber.from(proofResult.proof.pi_b[1][1]),
        BigNumber.from(proofResult.proof.pi_b[1][0]),
      ],
    ],
    _pC: [
      BigNumber.from(proofResult.proof.pi_c[0]),
      BigNumber.from(proofResult.proof.pi_c[1]),
    ],
    _pubSignals: proofResult.publicSignals.map(BigNumber.from),
  } as Proof
}

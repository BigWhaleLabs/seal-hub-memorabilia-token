import { AlchemyProvider } from '@ethersproject/providers'
import {
  getCommitmentFromSignature,
  getMessage,
  isCommitmentRegistered,
} from '@big-whale-labs/seal-hub-kit'
import { useAccount, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'preact/hooks'
import env from 'helpers/env'

enum Step {
  empty = '',
  awaitingSignature = 'Awaiting signature...',
  checkingCommitment = 'Checking commitment...',
  commitmentNotRegistered = 'Commitment not registered',
  error = 'Error',
  minting = 'Minting...',
  minted = 'Minted!',
}

export default function () {
  const { address } = useAccount()
  const [globalLoading, setGlobalLoading] = useState(false)
  const [step, setStep] = useState<Step>(Step.empty)
  const {
    data: signatureData,
    error: signatureError,
    signMessage,
  } = useSignMessage()
  const [commitmentRegistered, setCommitmentRegistered] = useState<
    boolean | null
  >(null)
  // Account hooks
  useEffect(() => {
    // If address changes, reset everything
    setStep(Step.empty)
  }, [address])
  // Steps
  useEffect(() => {
    async function checkCommitment() {
      try {
        const commitment = await getCommitmentFromSignature(
          signatureData!,
          getMessage()
        )
        setCommitmentRegistered(
          await isCommitmentRegistered(
            commitment,
            new AlchemyProvider('goerli', env.VITE_ALCHEMY_KEY)
          )
        )
      } catch (error) {
        console.error(error)
        setStep(Step.error)
      }
    }

    switch (step) {
      case Step.empty:
        setGlobalLoading(false)
        setCommitmentRegistered(null)
        break
      case Step.awaitingSignature:
        setGlobalLoading(true)
        if (signatureData) {
          setStep(Step.checkingCommitment)
        } else if (signatureError) {
          console.error(signatureError)
          setStep(Step.error)
        } else {
          signMessage({ message: getMessage() })
        }
        break
      case Step.checkingCommitment:
        setGlobalLoading(true)
        if (commitmentRegistered === null) {
          void checkCommitment()
        } else if (commitmentRegistered) {
          setStep(Step.minting)
        } else {
          setStep(Step.commitmentNotRegistered)
        }
        break
      case Step.minting: // TODO: handle UI
        setGlobalLoading(true)
        break
      case Step.commitmentNotRegistered: // TODO: show UI for this
        setGlobalLoading(false)
        break
      case Step.error:
        setGlobalLoading(false)
        break
      case Step.minted: // TODO: show UI for this
        setGlobalLoading(false)
        break
    }
  }, [
    step,
    signatureData,
    signatureError,
    setCommitmentRegistered,
    signMessage,
    commitmentRegistered,
  ])

  return (
    <>
      <p>
        Connected address: <span class="address">{address}</span>.
      </p>
      <p>Next, mint the memorabilia token!</p>
      <p>
        This will ask you for a SealHub signature first, and then allow minting
        with Zero-Knowledge.
      </p>
      <button
        class="btn"
        disabled={globalLoading}
        onClick={() => setStep(Step.awaitingSignature)}
      >
        {step || 'Mint the token!'}
        {globalLoading && (
          <>
            {' '}
            <span class="loading loading-spinner loading-xs" />
          </>
        )}
      </button>
      {step === Step.commitmentNotRegistered && (
        <p>
          Commitment not registered. Please{' '}
          <a href="https://hub.sealc.red" target="_blank">
            register it first on SealHub
          </a>
          .
        </p>
      )}
      {step === Step.error && (
        <p>
          Oopsie! We've encountered an error 😱 Check the dev console to learn
          more!
        </p>
      )}
    </>
  )
}

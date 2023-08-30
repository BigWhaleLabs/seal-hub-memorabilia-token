import { AlchemyProvider } from '@ethersproject/providers'
import {
  getCommitmentFromSignature,
  getMessage,
  getSealHubValidatorInputs,
  isCommitmentRegistered,
} from '@big-whale-labs/seal-hub-kit'
import { useAccount, useSignMessage } from 'wagmi'
import { useEffect, useState } from 'preact/hooks'
import env from 'helpers/env'
import tokenContract from 'helpers/tokenContract'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const snarkjs: any

enum Step {
  empty = '',
  awaitingSignature = 'Awaiting signature...',
  checkingCommitment = 'Checking commitment...',
  commitmentNotRegistered = 'Commitment not registered',
  checkingBalance = 'Checking balance...',
  zk = 'Generating a ZK proof...',
  minting = 'Minting...',
  minted = 'Minted!',
  error = 'Error',
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

    async function checkBalance() {
      if (!address) {
        setStep(Step.error)
        return
      }
      const balance = await tokenContract.balanceOf(address)
      if (balance.eq(0)) {
        setStep(Step.zk)
      } else {
        setStep(Step.minted)
      }
    }

    async function generateZKProof() {
      if (!signatureData) {
        setStep(Step.error)
        return
      }
      try {
        const inputs = await getSealHubValidatorInputs(
          signatureData,
          getMessage(),
          new AlchemyProvider('goerli', env.VITE_ALCHEMY_KEY)
        )
        const proof = await snarkjs.groth16.fullProve(
          inputs,
          '/NullifierCreator.wasm',
          '/NullifierCreator_final.zkey'
        )
        // Proof:
        //   {
        //     "proof": {
        //         "pi_a": [
        //             "13541247944574745837868314136253945230129375627573736642345051466959842601061",
        //             "3588149924236996797503708002256605763337276068528050848888072819304817687339",
        //             "1"
        //         ],
        //         "pi_b": [
        //             [
        //                 "19883355938065097053964661316346448763027368280670040341962896212349060368271",
        //                 "10713585228785001441206714591981378860450768221664841618412581272805710395175"
        //             ],
        //             [
        //                 "11972044746202682585064583620652507442622231786501473104038139224507458887252",
        //                 "5679184047081825787551941111220465546469612120177194289047377528490743216712"
        //             ],
        //             [
        //                 "1",
        //                 "0"
        //             ]
        //         ],
        //         "pi_c": [
        //             "4537811364823272105530426961838425872763410312483499906183411799653562375712",
        //             "11338596102929199422174554879682317856625804503776499592452258244335560283508",
        //             "1"
        //         ],
        //         "protocol": "groth16",
        //         "curve": "bn128"
        //     },
        //     "publicSignals": [
        //         "1606557549283573144709933128830539461483138555532643293876135124027209928089",
        //         "16830880825080895546328487425414699910730890478699539177647338495355167294806"
        //     ]
        // }
        setStep(Step.minting)
      } catch (error) {
        console.error(error)
        setStep(Step.error)
      }
    }

    async function mint() {
      // TODO: mint
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
          setStep(Step.checkingBalance)
        } else {
          setStep(Step.commitmentNotRegistered)
        }
        break
      case Step.checkingBalance:
        setGlobalLoading(true)
        void checkBalance()
        break
      case Step.zk:
        setGlobalLoading(true)
        void generateZKProof()
        break
      case Step.minting:
        setGlobalLoading(true)
        void mint()
        break
      case Step.commitmentNotRegistered:
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
    address,
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
          </a>{' '}
          and then refresh this page.
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

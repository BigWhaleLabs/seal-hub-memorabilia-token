import {
  AlchemyProvider,
  JsonRpcSigner,
  Web3Provider,
} from '@ethersproject/providers'
import {
  getCommitmentFromSignature,
  getMessage,
  getSealHubValidatorInputs,
  isCommitmentRegistered,
} from '@big-whale-labs/seal-hub-kit'
import { useAccount, useSignMessage, useWalletClient } from 'wagmi'
import { useEffect, useState } from 'preact/hooks'
import Proof from 'models/Proof'
import ProofResult from 'models/ProofResult'
import env from 'helpers/env'
import makeTransaction from 'helpers/makeTransaction'
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
  const { data: walletClient } = useWalletClient()
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
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
  const [proof, setProof] = useState<Proof | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  // Account hooks
  useEffect(() => {
    // If address changes, reset everything
    setStep(Step.empty)
  }, [address])
  useEffect(() => {
    if (!walletClient) {
      return
    }
    const provider = new Web3Provider(walletClient.transport, 'any')
    setSigner(provider.getSigner())
  }, [walletClient])
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
      const balance = await tokenContract.balanceOf(address, 0)
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
        const proof = (await snarkjs.groth16.fullProve(
          inputs,
          '/NullifierCreator.wasm',
          '/NullifierCreator_final.zkey'
        )) as ProofResult
        setProof(makeTransaction(proof))
        setStep(Step.minting)
      } catch (error) {
        console.error(error)
        setStep(Step.error)
      }
    }

    async function mint() {
      if (!proof || !signer) {
        setStep(Step.error)
        return
      }
      try {
        const tx = await tokenContract
          .connect(signer)
          .mint(proof._pA, proof._pB, proof._pC, proof._pubSignals)
        await tx.wait()
        setTxHash(tx.hash)
        setStep(Step.minted)
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
      case Step.minted:
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
    proof,
    signer,
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
        disabled={
          globalLoading ||
          step === Step.minted ||
          step === Step.commitmentNotRegistered
        }
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
      {step === Step.minted && (
        <p>
          Congratulations! You've minted the token!
          {txHash && (
            <>
              {' '}
              <a
                href={`https://goerli.etherscan.io/tx/${txHash}`}
                target="_blank"
              >
                View the transaction on Etherscan
              </a>
              .
            </>
          )}
        </p>
      )}
    </>
  )
}

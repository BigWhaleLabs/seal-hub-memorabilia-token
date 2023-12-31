import { cleanEnv, str } from 'envalid'

export default cleanEnv(import.meta.env, {
  VITE_ALCHEMY_KEY: str(),
  VITE_WALLETCONNECT_PROJECT_ID: str(),
  VITE_TOKEN_ADDRESS: str(),
})

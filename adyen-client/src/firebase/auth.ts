import {
  SAMLAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./config";

// TODO: Replace with your SAML provider ID from Firebase Console > Authentication > Sign-in method
// Format is always "saml.<your-provider-id>"
const SAML_PROVIDER_ID = "saml.REPLACE_WITH_PROVIDER_ID";

const provider = new SAMLAuthProvider(SAML_PROVIDER_ID);

export async function signInWithSAML() {
  await signInWithRedirect(auth, provider);
}

// Call on app load to handle the redirect callback from the IdP
export async function handleRedirectResult() {
  const result = await getRedirectResult(auth);
  return result;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

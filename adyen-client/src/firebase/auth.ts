import {
  SAMLAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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

export async function handleRedirectResult() {
  return getRedirectResult(auth);
}

export async function signInWithEmail(email: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}

export async function registerWithEmail(email: string, password: string): Promise<string> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user.getIdToken();
}

export async function signOut() {
  await firebaseSignOut(auth);
}

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if all necessary keys are present
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app;
let auth;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Configure French language for reCAPTCHA and SMS
    auth.languageCode = "fr";
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

export { auth };

/**
 * Creates a RecaptchaVerifier instance for Firebase Phone Auth
 * @param {string} elementId - The ID of the HTML element to render the reCAPTCHA in
 * @returns {RecaptchaVerifier|null}
 */
export const createRecaptchaVerifier = (elementId) => {
  if (!isFirebaseConfigured || !auth) return null;
  try {
    return new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
      "expired-callback": () => {
        // Response expired. Ask user to solve reCAPTCHA again.
      }
    });
  } catch (error) {
    console.error("Error creating RecaptchaVerifier:", error);
    return null;
  }
};

/**
 * Sends a real SMS verification code using Firebase Phone Auth
 * @param {string} phoneNumber - The formatted international phone number (e.g. +212612345678)
 * @param {RecaptchaVerifier} appVerifier - The RecaptchaVerifier instance
 * @returns {Promise<ConfirmationResult|null>}
 */
export const sendVerificationSMS = async (phoneNumber, appVerifier) => {
  if (!isFirebaseConfigured || !auth) {
    console.log("Firebase is not configured. Falling back to Demo Mode.");
    return null;
  }
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  } catch (error) {
    console.error("Error in signInWithPhoneNumber:", error);
    throw error;
  }
};

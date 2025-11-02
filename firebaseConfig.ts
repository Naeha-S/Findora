// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// ==========================================================================================
// IMPORTANT: Environment Variables
// ==========================================================================================
// In a production app, you should store these values in environment variables
// to avoid committing them directly into your source code.
// For example, in a Create React App or Vite project, you would use:
//
// const firebaseConfig = {
//   apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
//   authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
//   ...
// };
//
// This makes your configuration more secure and portable across different environments.
// ==========================================================================================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOtxvCNCMUwGZp0TU6Kgdy4AfsZwlnhQ8",
  authDomain: "airadar-95005.firebaseapp.com",
  projectId: "airadar-95005",
  storageBucket: "airadar-95005.firebasestorage.app",
  messagingSenderId: "908342689643",
  appId: "1:908342689643:web:d654a26ba63464172e962e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// You can export the initialized app instance to use in other parts of your application
// For example, to get the Firestore instance: getFirestore(app)
export default app;
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Add the Firestore import
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  // Your existing config values
  apiKey: "YOUR_API_KEY",
  // ...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Export the database instance
export const db = getFirestore(app);
// js/auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginBtn = document.getElementById("login-btn");

if (loginBtn) {
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to admin page (same directory level)
      window.location.href = "/admin.html";
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}

import { db } from "./firebase-config.js";
import { collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadProjects() {
  const projectsContainer = document.getElementById("projects-container"); // Make sure this empty div exists in index.html!
  
  // Query the database, ordering by newest first
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  let html = "";

  // Loop through every project in the database
  querySnapshot.forEach((doc) => {
    const project = doc.data();
    
    // Build the HTML for each card dynamically
    html += `
      
        ${project.title}
        ${project.description}
        ${project.techStack}
        ${project.link ? `View Project →` : ''}
      
    `;
  });

  // Inject the HTML into the page
  projectsContainer.innerHTML = html;
}

// Run the function as soon as the page loads
loadProjects();
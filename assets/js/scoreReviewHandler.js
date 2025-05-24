/**
 * TES SDM - Main Script
 *
 * This file contains all JavaScript functionality for the TES SDM application
 * including user management, result display, and UI interactions.
 */

// ===== USER MANAGEMENT FUNCTIONS =====

/**
 * Generates a random numeric ID of specified length
 * @param {number} length - Length of ID to generate (default: 10)
 * @return {string} Random numeric ID
 */
function generateRandomNumericID(length = 10) {
  const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

/**
 * Gets existing user ID from localStorage or creates a new one
 * @return {string} User ID
 */
function getOrCreateUserID() {
  let userID = localStorage.getItem("userID");
  if (!userID) {
    userID = generateRandomNumericID();
    localStorage.setItem("userID", userID);
  }
  return userID;
}

// ===== DATA & RESULTS MANAGEMENT =====

// Database for result conclusions
let conclusionDatabase = { tinggi: [], rendah: [] };

/**
 * Loads conclusion data from JSON file or uses defaults
 */
async function loadConclusionData() {
  try {
    const response = await fetch("/data/judge.json");
    conclusionDatabase = await response.json();
  } catch {
    conclusionDatabase = {
      tinggi: ["🧠 SDM Tinggi! Hebat!"],
      rendah: ["😅 SDM Rendah. Ayo semangat belajar!"],
    };
  }
}

/**
 * Gets a random conclusion based on judgment type
 * @param {string} judgmentType - Type of judgment ("tinggi" or "rendah")
 * @return {string} Random conclusion text
 */
function getRandomConclusion(judgmentType) {
  const list = conclusionDatabase[judgmentType] || [];
  const index = Math.floor(Math.random() * list.length);
  return list[index] || "Semangat!";
}

/**
 * Displays test results in the UI
 */
function displayResults() {
  const correct = parseInt(localStorage.getItem("correctScore"));
  const total = parseInt(localStorage.getItem("totalQuest"));

  if (isNaN(correct) || isNaN(total)) {
    // Show 'no data' message and hide results section
    document.getElementById("resultSection").classList.add("d-none");
    document.getElementById("noDataSection").classList.remove("d-none");
    return;
  }

  // Make sure results section is visible and 'no data' message is hidden
  document.getElementById("resultSection").classList.remove("d-none");
  document.getElementById("noDataSection").classList.add("d-none");

  const score = Math.round((correct / total) * 100);
  const judgmentType = score >= 70 ? "tinggi" : "rendah";

  document.getElementById(
    "userScore"
  ).innerText = `${correct} / ${total} benar (${score} Poin)`;
  document.getElementById("userTitle").innerText =
    judgmentType === "tinggi" ? "SDM TINGGI" : "SDM RENDAH";
  document.getElementById("judgmentResult").innerText =
    getRandomConclusion(judgmentType);
}

/**
 * Displays detailed review of all answers
 */
function displayAnswerReview() {
  const answers = JSON.parse(localStorage.getItem("userAnswers") || "[]");
  const container = document.getElementById("reviewSection");
  container.innerHTML = "";

  answers.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `bg-haze mb-4 p-3 border rounded ${
      item.benar ? "border-success" : "border-danger"
    }`;

    const choiceList = item.pilihan
      .map((p, i) => {
        const label = String.fromCharCode(65 + i); // A, B, C, D...
        const isUser = i === item.jawabanUser;
        const isCorrect = p.isCorrect;
        let style = "";
        if (isCorrect) style = "text-success fw-bold";
        if (isUser && !isCorrect) style = "text-danger fw-bold";
        if (isUser && isCorrect) style = "text-success fw-bold";
        return `<div class="${style}">${label}. ${p.text}</div>`;
      })
      .join("");

    div.innerHTML = `
      <p><strong>${index + 1}. ${item.pertanyaan}</strong></p>
      ${choiceList}
      <p class="mt-2">Jawaban kamu: <strong>${
        item.jawabanUser >= 0
          ? String.fromCharCode(65 + item.jawabanUser)
          : "Tidak dijawab"
      }</strong></p>
      <p>Status: <span class="${item.benar ? "text-success" : "text-danger"}">${
      item.benar
        ? 'Benar <i class="fas fa-check-circle fs-5"></i>'
        : 'Salah <i class="fas fa-times-circle fs-5"></i>'
    }</span></p>
    `;

    container.appendChild(div);
  });
}

/**
 * Checks for data availability and shows appropriate UI elements
 */
function checkDataAvailability() {
  const correct = parseInt(localStorage.getItem("correctScore"));
  const total = parseInt(localStorage.getItem("totalQuest"));

  if (isNaN(correct) || isNaN(total)) {
    // Show 'no data' message
    document.getElementById("resultSection").classList.add("d-none");
    document.getElementById("noDataSection").classList.remove("d-none");
  } else {
    // Show results section
    document.getElementById("resultSection").classList.remove("d-none");
    document.getElementById("noDataSection").classList.add("d-none");
  }
}

/**
 * Manual trigger to display results and review
 */
function displayResultsManually() {
  displayResults();
  displayAnswerReview();
}

/**
 * Clears all test data and redirects to home page
 */
function retryTest() {
  localStorage.clear();
  const notification = document.getElementById("resetNotification");
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 3000);
  setTimeout(() => (window.location.href = "/index.html"), 1500);
}

// ===== EVENT HANDLERS & INITIALIZATION =====

/**
 * Initialize the application when DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Set up user ID
  const userIDElement = document.getElementById("userID");
  const userID = getOrCreateUserID();
  if (userIDElement) {
    userIDElement.textContent = userID;
  }

  // Load conclusion data
  await loadConclusionData();

  // Check data availability and display appropriate UI
  checkDataAvailability();

  // If data is available, display results and answer review
  if (!document.getElementById("resultSection").classList.contains("d-none")) {
    displayResults();
    displayAnswerReview();
  }

  // Set up review toggle button
  document.getElementById("btnReview")?.addEventListener("click", function () {
    const review = document.getElementById("reviewSection");
    review.classList.toggle("d-none");
    if (review.classList.contains("d-none")) {
      this.innerHTML = '<i class="fas fa-eye"></i> Tampilkan Review';
    } else {
      this.innerHTML = '<i class="fas fa-eye-slash"></i> Sembunyikan Review';
    }
  });

  // Set up screenshot button
  // ===== SCREENSHOT HANYA HASIL TES SDM =====
  function takeScreenshot() {
    const btnScreenshot = document.getElementById("btnScreenshot");
    const resultSection = document.getElementById("resultSection");

    // Check if result section exists
    if (!resultSection) {
      alert("Tidak ada hasil untuk di-screenshot");
      return;
    }

    // Simple loading state
    btnScreenshot.innerHTML = '<i class="fas fa-camera"></i> Mengambil...';
    btnScreenshot.disabled = true;

    // Screenshot only the result section
    html2canvas(resultSection, {
      backgroundColor: "#bbc0c9",
      scale: 1,
    })
      .then(function (canvas) {
        // Create download
        const link = document.createElement("a");
        link.download = "tes-sdm.png";
        link.href = canvas.toDataURL("image/png");
        link.click();

        // Restore button
        btnScreenshot.innerHTML = '<i class="fas fa-camera"></i> Screenshot';
        btnScreenshot.disabled = false;
      })
      .catch(function (error) {
        console.error("Screenshot gagal:", error);
        alert("Screenshot gagal diambil");

        // Restore button
        btnScreenshot.innerHTML = '<i class="fas fa-camera"></i> Screenshot';
        btnScreenshot.disabled = false;
      });
  }

  // Replace the old screenshot event listener with this:
  document
    .getElementById("btnScreenshot")
    ?.addEventListener("click", takeScreenshot);
});

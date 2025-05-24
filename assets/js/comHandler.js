import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDOLwJFprT8sFQiKcq48ALITq3i2YtDmCY",
  authDomain: "public-comment-tes-sdm.firebaseapp.com",
  projectId: "public-comment-tes-sdm",
  storageBucket: "public-comment-tes-sdm.appspot.com",
  messagingSenderId: "870779947081",
  appId: "1:870779947081:web:66ac46c2e8e29c2a925798",
  databaseURL:
    "https://public-comment-tes-sdm-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const comForm = document.getElementById("comForm");
const comList = document.getElementById("comList");
const spamNotice = document.getElementById("spamNotice");
const inputNotice = document.getElementById("inputNotice");

let lastSubmit = 0;

comForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const now = Date.now();
  if (now - lastSubmit < 10000) {
    spamNotice.style.display = "block";
    inputNotice.style.display = "none";
    return;
  }

  const name = document.getElementById("nameNotice").value.trim();
  const fill = document.getElementById("comNotice").value.trim();
  const regexValid = /^[a-zA-Z0-9\s]+$/;

  if (!regexValid.test(name) || !regexValid.test(fill)) {
    inputNotice.style.display = "block";
    spamNotice.style.display = "none";
    return;
  }

  if (name && fill) {
    const comRef = ref(db, "comment");
    push(comRef, {
      name: name,
      fill: fill,
      time: Date.now(),
    });

    comForm.reset();
    lastSubmit = now;
    spamNotice.style.display = "none";
    inputNotice.style.display = "none";
  }
});

// #########################################################

const comRef = ref(db, "comment");

onChildAdded(comRef, (snapshot) => {
  const data = snapshot.val();
  const date = new Date(data.time).toLocaleDateString();

  const card = document.createElement("div");
  card.className = "col";
  card.innerHTML = `
    <div class=" card shadow-sm border-0 bg-haze" data-aos="fade" data-aos-delay="400">
      <div class="card-body">
        <div class="d-flex justify-content-between">
          <h5 class="card-title fw-medium">${data.name}</h5>
          <h6 class="card-subtitle mb-2 text-muted small">${date}</h6>
        </div>
        <p class="card-text fs-6">${data.fill}</p>
      </div>
    </div>
  `;
  comList.prepend(card);
});

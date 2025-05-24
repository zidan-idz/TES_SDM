/**
 * Aplikasi Quiz/Tes Dengan Timer
 *
 * Script ini menangani fungsionalitas tes dengan batasan waktu, termasuk:
 * - Timer dan manajemen waktu
 * - Penyimpanan state dan jawaban di localStorage
 * - Navigasi antar pertanyaan
 * - Pengacakan soal dan pilihan jawaban
 * - Penghitungan skor dan penampilan hasil
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // INISIALISASI VARIABEL & ELEMEN DOM
  // ==========================================

  // Mendapatkan elemen-elemen DOM yang dibutuhkan
  const container = document.getElementById("quizContainer");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const progressBar = document.getElementById("progressBar");
  const timerDisplay = document.getElementById("timer");
  const timeoutModal = document.getElementById("timeout-modal");
  const showResults = document.getElementById("showResults");

  // Reset tampilan modal timeout jika ada
  if (timeoutModal) {
    timeoutModal.style.display = "none";
    // Pastikan scrolling diaktifkan saat halaman dimuat
    document.body.classList.remove("no-scroll");
  }

  // Tambahkan style untuk class no-scroll jika belum ada
  const addNoScrollStyle = () => {
    if (!document.getElementById("no-scroll-style")) {
      const style = document.createElement("style");
      style.id = "no-scroll-style";
      style.innerHTML = `
    .no-scroll {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
    }
  `;
      document.head.appendChild(style);
    }
  };

  // Tambahkan style untuk menonaktifkan scroll
  addNoScrollStyle();

  // Konfigurasi tes
  const totalTime = 120; // Total waktu pengerjaan tes dalam detik
  const maxQuestions = 10; // Jumlah maksimal pertanyaan yang ditampilkan

  // Inisialisasi variabel state
  let currentQuestion = 0; // Index pertanyaan saat ini
  let selectedQuestions = []; // Array untuk menyimpan soal-soal yang dipilih
  let answers = []; // Array untuk menyimpan jawaban pengguna
  let timeLeft = totalTime; // Sisa waktu pengerjaan tes
  let timerInterval; // Interval untuk fungsi timer
  let startTime; // Waktu mulai tes

  // ==========================================
  // FUNGSI UTILITAS
  // ==========================================

  /**
   * Mengacak urutan elemen dalam sebuah array.
   * @param {Array} array - Array yang akan diacak.
   * @returns {Array} - Array baru dengan urutan elemen yang diacak.
   */
  const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];

    const newArray = [...array]; // Membuat salinan array agar tidak memodifikasi yang asli
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  /**
   * Format waktu menjadi format MM:SS.
   * @param {number} seconds - Jumlah detik.
   * @returns {string} - Waktu yang diformat.
   */
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ==========================================
  // MANAJEMEN STATE & PENYIMPANAN
  // ==========================================

  /**
   * Menyimpan state tes saat ini ke localStorage.
   * Ini termasuk sisa waktu, jawaban, pertanyaan saat ini, waktu mulai, dan soal yang dipilih.
   */
  const saveTestState = () => {
    try {
      localStorage.setItem("timeLeft", timeLeft);
      localStorage.setItem("answers", JSON.stringify(answers));
      localStorage.setItem("currentQuestion", currentQuestion);
      localStorage.setItem("startTime", startTime);
      localStorage.setItem(
        "selectedQuestions",
        JSON.stringify(selectedQuestions)
      );
    } catch (error) {
      console.error("Gagal menyimpan state tes:", error);
    }
  };

  /**
   * Memulihkan state tes dari localStorage jika tersedia.
   * Jika tidak ada data tersimpan, nilai default akan digunakan.
   * @returns {boolean} - True jika state berhasil dipulihkan, false jika tidak ada data tersimpan.
   */
  const restoreTestState = () => {
    try {
      const storedTimeLeft = localStorage.getItem("timeLeft");
      const storedAnswers = localStorage.getItem("answers");
      const storedCurrentQuestion = localStorage.getItem("currentQuestion");
      const storedStartTime = localStorage.getItem("startTime");
      const storedSelectedQuestions = localStorage.getItem("selectedQuestions");

      // Jika tidak ada data tersimpan, gunakan nilai default
      if (!storedTimeLeft || !storedStartTime) {
        // Mulai tes baru
        startTime = Date.now();
        localStorage.setItem("startTime", startTime);
        return false;
      }

      // Pulihkan data tersimpan
      timeLeft = parseInt(storedTimeLeft);
      answers = storedAnswers ? JSON.parse(storedAnswers) : [];
      currentQuestion = storedCurrentQuestion
        ? parseInt(storedCurrentQuestion)
        : 0;
      startTime = parseInt(storedStartTime);
      selectedQuestions = storedSelectedQuestions
        ? JSON.parse(storedSelectedQuestions)
        : [];

      return true;
    } catch (error) {
      console.error("Gagal memulihkan state tes:", error);
      return false;
    }
  };

  /**
   * Membersihkan data tes yang tersimpan di localStorage.
   * Ini berguna untuk memulai tes dari awal.
   */
  const clearTesData = () => {
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("currentQuestion");
    localStorage.removeItem("startTime");
    localStorage.removeItem("correctScore");
    localStorage.removeItem("totalQuest");
    localStorage.removeItem("userAnswers");
    localStorage.removeItem("quizFinished"); // Hapus flag tes selesai
    localStorage.removeItem("answers");
    localStorage.removeItem("selectedQuestions");
  };

  /**
   * Memeriksa apakah tes baru dapat dimulai.
   * @returns {boolean} - True jika tes baru dapat dimulai, false jika tidak.
   */
  const canStartNewTest = () => {
    // Jika tes sudah selesai sebelumnya, pengguna harus melihat hasil
    if (localStorage.getItem("quizFinished") === "true") {
      return false;
    }

    // Jika ada tes yang sedang berlangsung, pengguna harus melanjutkannya
    const storedTimeLeft = localStorage.getItem("timeLeft");
    const storedStartTime = localStorage.getItem("startTime");

    if (storedTimeLeft && storedStartTime) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(storedStartTime)) / 1000
      );
      const remainingTime = Math.max(0, totalTime - elapsed);

      // Jika waktu tersisa kurang dari atau sama dengan 0, anggap tes sudah selesai
      if (remainingTime <= 0) {
        localStorage.setItem("quizFinished", "true");
        localStorage.setItem("timeLeft", "0");
        return false;
      }

      return true; // Masih ada waktu tersisa, lanjutkan tes
    }

    return true; // Tidak ada tes yang sedang berlangsung
  };

  // ==========================================
  // MANAJEMEN TIMER
  // ==========================================

  /**
   * Memperbarui tampilan timer pada halaman.
   */
  const updateTimerDisplay = () => {
    timerDisplay.innerText = `Waktu: ${formatTime(timeLeft)}`;
  };

  /**
   * Memulai timer tes.
   * Fungsi ini memulihkan state yang tersimpan, memperbarui tampilan timer setiap detik,
   * dan menampilkan modal timeout jika waktu habis.
   */
  const startTimer = () => {
    // Periksa apakah tes sudah selesai sebelumnya
    const quizFinished = localStorage.getItem("quizFinished") === "true";

    // Jika tes sudah selesai, langsung tampilkan modal timeout
    if (quizFinished) {
      timeLeft = 0;
      updateTimerDisplay();
      showTimeoutModal();
      return;
    }

    // Mulai timer baru jika tidak ada state yang tersimpan
    if (!restoreTestState()) {
      timeLeft = totalTime;
      startTime = Date.now();
      localStorage.setItem("startTime", startTime);
    } else {
      // Jika memulihkan state, hitung ulang timeLeft berdasarkan waktu yang telah berlalu
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeLeft = Math.max(0, totalTime - elapsed);

      // Jika waktu sudah habis, langsung tampilkan modal timeout
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerDisplay();
        showTimeoutModal();
        return;
      }
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timeLeft = Math.max(0, totalTime - elapsed);

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timeLeft = 0;
        localStorage.setItem("timeLeft", "0");
        localStorage.setItem("quizFinished", "true"); // Tandai bahwa tes sudah selesai
        updateTimerDisplay();
        showTimeoutModal();
      } else {
        updateTimerDisplay();
        saveTestState();
      }
    }, 1000);
  };

  // ==========================================
  // TAMPILAN & UI
  // ==========================================

  /**
   * Menampilkan modal timeout ketika waktu pengerjaan tes habis dan menonaktifkan scrolling.
   * @param {boolean} isCompleted - True jika tes diselesaikan oleh pengguna, false jika waktu habis.
   */
  const showTimeoutModal = (isCompleted = false) => {
    const messageElement = document.getElementById("timeout-message");

    if (isCompleted) {
      messageElement.innerText = "Anda telah menyelesaikan semua pertanyaan.";
    } else {
      messageElement.innerText = "Waktu untuk mengerjakan tes telah berakhir.";
    }

    // Tampilkan modal
    timeoutModal.style.display = "flex";

    // Nonaktifkan scrolling pada halaman
    document.body.classList.add("no-scroll");
  };

  /**
   * Menonaktifkan modal timeout dan mengaktifkan kembali scrolling.
   */
  const hideTimeoutModal = () => {
    if (timeoutModal) {
      timeoutModal.style.display = "none";

      // Aktifkan kembali scrolling
      document.body.classList.remove("no-scroll");
    }
  };

  /**
   * Membuat elemen div untuk setiap opsi jawaban.
   * @param {object} option - Objek yang berisi teks opsi dan status kebenaran.
   * @param {number} index - Index opsi saat ini.
   * @param {number} questionIndex - Index pertanyaan saat ini.
   * @returns {HTMLDivElement} - Elemen div yang berisi radio button dan label opsi.
   */
  const createOptionElement = (option, index, questionIndex) => {
    const div = document.createElement("div");
    div.classList.add("form-check");

    const input = document.createElement("input");
    input.classList.add("form-check-input");
    input.type = "radio";
    input.name = "answer";
    input.value = index;
    input.id = `opt${index}`;

    if (answers[questionIndex] === index) {
      input.checked = true;
    }

    const label = document.createElement("label");
    label.classList.add("form-check-label");
    label.htmlFor = `opt${index}`;
    label.innerText = `${String.fromCharCode(65 + index)}. ${option.text}`;

    div.appendChild(input);
    div.appendChild(label);
    return div;
  };

  /**
   * Merender pertanyaan saat ini ke dalam container.
   * Ini termasuk menampilkan teks pertanyaan, opsi jawaban, dan memperbarui progress bar.
   */
  const renderQuestion = () => {
    // Update informasi soal ke-X
    const questionInfo = document.getElementById("questionInfo");
    if (questionInfo && selectedQuestions.length > 0) {
      questionInfo.innerText = `SOAL KE ${currentQuestion + 1}/${
        selectedQuestions.length
      }`;
    }

    // Validasi bahwa ada pertanyaan untuk ditampilkan
    if (
      !selectedQuestions ||
      selectedQuestions.length === 0 ||
      currentQuestion >= selectedQuestions.length
    ) {
      container.innerHTML =
        '<p class="text-danger">Tidak ada pertanyaan yang tersedia</p>';
      return;
    }

    const q = selectedQuestions[currentQuestion];
    const percent = Math.floor(
      (currentQuestion / selectedQuestions.length) * 100
    );

    // Jika opsi jawaban belum diacak untuk pertanyaan ini, acak sekarang
    if (!q.shuffledPilihan && q.pilihan && Array.isArray(q.pilihan)) {
      q.shuffledPilihan = shuffleArray(
        q.pilihan.map((text, i) => ({
          text,
          isCorrect: i === q.jawaban,
        }))
      );
    }

    // Tampilkan pertanyaan
    container.innerHTML = `
  <div class="question-box active">
    <p class="fs-5 fw-semibold">${
      q.pertanyaan || "Pertanyaan tidak tersedia"
    }</p>
  </div>
`;

    // Pastikan pilihan tersedia sebelum mencoba merender
    if (q.shuffledPilihan && Array.isArray(q.shuffledPilihan)) {
      const questionBox = container.querySelector(".question-box");
      q.shuffledPilihan.forEach((option, index) => {
        questionBox.appendChild(
          createOptionElement(option, index, currentQuestion)
        );
      });
    }

    // Perbarui progress bar
    progressBar.style.width = `${percent}%`;
    progressBar.innerText = `${percent}%`;

    // Perbarui status tombol navigasi
    btnPrev.disabled = currentQuestion === 0;
    btnNext.innerText =
      currentQuestion === selectedQuestions.length - 1
        ? "Selesai"
        : "Selanjutnya";
  };

  // ==========================================
  // PENANGANAN SOAL & JAWABAN
  // ==========================================

  /**
   * Memuat data pertanyaan dari file JSON atau localStorage.
   */
  const loadQuestions = async () => {
    try {
      // Periksa apakah tes sudah selesai
      if (localStorage.getItem("quizFinished") === "true") {
        timeLeft = 0;
        updateTimerDisplay();
        showTimeoutModal();
        return;
      }

      const savedQuestions = localStorage.getItem("selectedQuestions");
      const savedAnswers = localStorage.getItem("answers");

      if (savedQuestions) {
        selectedQuestions = JSON.parse(savedQuestions);

        if (
          !selectedQuestions ||
          !Array.isArray(selectedQuestions) ||
          selectedQuestions.length === 0
        ) {
          throw new Error("Data soal tersimpan tidak valid");
        }

        // Pulihkan jawaban jika ada
        if (savedAnswers) {
          answers = JSON.parse(savedAnswers);
        } else {
          answers = new Array(selectedQuestions.length).fill(-1);
          localStorage.setItem("answers", JSON.stringify(answers));
        }
      } else {
        const response = await fetch("/data/main.json");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error("Format data soal tidak valid");
        }

        // Acak soal, lalu ambil jumlah yang ditentukan
        const shuffled = shuffleArray(data);
        selectedQuestions = shuffled.slice(0, maxQuestions);

        localStorage.setItem(
          "selectedQuestions",
          JSON.stringify(selectedQuestions)
        );
        localStorage.setItem("startTime", Date.now());

        // Inisialisasi array jawaban kosong
        answers = new Array(selectedQuestions.length).fill(-1);
        localStorage.setItem("answers", JSON.stringify(answers));
      }

      renderQuestion();
      startTimer();
    } catch (err) {
      container.innerHTML = `
    <div class="alert alert-danger">
      <p class='mb-0'>Gagal memuat pertanyaan: ${err.message}</p>
      <p class='mb-0 mt-2'>Silakan muat ulang halaman atau hubungi administrator.</p>
    </div>`;
      console.error("Error loading questions:", err);
    }
  };

  /**
   * Menghitung skor dan mengarahkan pengguna ke halaman hasil.
   */
  const goToHasil = () => {
    // Pastikan semua pertanyaan memiliki jawaban
    while (answers.length < selectedQuestions.length) {
      answers.push(-1); // Jawaban yang tidak dipilih diberi nilai -1
    }

    const userAnswers = selectedQuestions.map((q, i) => {
      const pilihan = q.shuffledPilihan || [];
      const selectedIndex = answers[i];
      const isCorrect =
        selectedIndex >= 0 ? pilihan[selectedIndex]?.isCorrect || false : false;
      const correctIndex = pilihan.findIndex((p) => p && p.isCorrect);

      return {
        nomor: i + 1,
        pertanyaan: q.pertanyaan,
        pilihan: pilihan.map((p) => ({
          text: p.text,
          isCorrect: p.isCorrect,
        })),
        jawabanUser: selectedIndex,
        jawabanBenar: correctIndex,
        benar: isCorrect,
      };
    });

    const correctScore = userAnswers.filter((h) => h.benar).length;
    const timestamp = new Date().toISOString();

    const hasilTes = {
      id: Date.now(), // ID unik
      waktu: timestamp,
      correctScore,
      totalQuest: selectedQuestions.length,
      jawaban: userAnswers,
    };

    // Ambil riwayat sebelumnya (jika ada)
    const riwayatTes = JSON.parse(localStorage.getItem("riwayatTes")) || [];

    // Tambahkan hasil baru ke dalam array
    riwayatTes.push(hasilTes);

    // Simpan ke localStorage
    localStorage.setItem("riwayatTes", JSON.stringify(riwayatTes));

    // Simpan juga hasil terakhir (opsional untuk result.html)
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
    localStorage.setItem("correctScore", correctScore);
    localStorage.setItem("totalQuest", selectedQuestions.length);

    // Bersihkan data tes aktif
    clearInterval(timerInterval);

    // Arahkan ke halaman hasil
    window.location.href = "result.html";
  };

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Menangani klik tombol "Selanjutnya".
   */
  const handleNext = () => {
    const selected = document.querySelector('input[name="answer"]:checked');
    answers[currentQuestion] = selected ? parseInt(selected.value) : -1; // Gunakan -1 untuk tidak menjawab
    saveTestState();

    const lastQuestion = currentQuestion === selectedQuestions.length - 1;

    if (lastQuestion) {
      // Jika ini pertanyaan terakhir, tandai tes sebagai selesai dan hentikan timer
      localStorage.setItem("quizFinished", "true");
      localStorage.setItem("timeLeft", "0"); // Set waktu menjadi 0
      clearInterval(timerInterval);
      timeLeft = 0;
      updateTimerDisplay();
      // Tampilkan modal dengan pesan selesai
      showTimeoutModal(true);
      // Tunggu sejenak agar pengguna melihat pesan
      setTimeout(goToHasil, 500);
    } else {
      // Pindah ke pertanyaan berikutnya
      currentQuestion++;
      renderQuestion();
    }
  };

  /**
   * Menangani klik tombol "Sebelumnya".
   */
  const handlePrev = () => {
    if (currentQuestion > 0) {
      // Simpan jawaban saat ini sebelum pindah
      const selected = document.querySelector('input[name="answer"]:checked');
      answers[currentQuestion] = selected ? parseInt(selected.value) : -1;
      saveTestState();

      // Pindah ke pertanyaan sebelumnya
      currentQuestion--;
      renderQuestion();
    }
  };

  // ==========================================
  // SETUP EVENT LISTENERS
  // ==========================================

  // Menambahkan event listener ke tombol navigasi
  btnNext.addEventListener("click", handleNext);
  btnPrev.addEventListener("click", handlePrev);

  // Menambahkan event listener ke tombol "Lihat Hasil" pada modal timeout
  if (showResults) {
    showResults.addEventListener("click", () => {
      goToHasil();
      // Aktifkan kembali scrolling ketika user melihat hasil
      document.body.classList.remove("no-scroll");
    });
  }

  // Event listener untuk tombol close pada modal (jika ada)
  const closeModalBtn = document.querySelector("#timeout-modal .close-btn");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", hideTimeoutModal);
  }

  // Tambahkan event listener untuk mencegah meninggalkan halaman
  window.addEventListener("beforeunload", (e) => {
    // Simpan state terakhir sebelum pengguna meninggalkan halaman
    saveTestState();

    // Jika tes masih berjalan, tampilkan peringatan
    if (timeLeft > 0) {
      e.preventDefault();
      e.returnValue =
        "Tes sedang berlangsung. Yakin ingin meninggalkan halaman?";
      return e.returnValue;
    }
  });

  // ==========================================
  // INISIALISASI APLIKASI
  // ==========================================

  // Periksa status tes saat halaman dimuat
  const tesStatus = localStorage.getItem("quizFinished");

  // Jika tes sudah selesai, tampilkan modal dan jangan muat pertanyaan
  if (tesStatus === "true") {
    timeLeft = 0;
    updateTimerDisplay();
    showTimeoutModal();

    // Tambahkan listener untuk ESC key untuk menutup modal (aksesibilitas)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && timeoutModal.style.display === "flex") {
        hideTimeoutModal();
      }
    });
  } else {
    // Memuat pertanyaan jika tes belum selesai
    loadQuestions();
  }

  // Tambahkan listener untuk klik di luar modal untuk menutup modal (opsional)
  window.addEventListener("click", (e) => {
    if (e.target === timeoutModal) {
      // Jika tes selesai, jangan izinkan menutup modal dengan klik luar
      // Hanya izinkan pergi ke halaman hasil
      if (localStorage.getItem("quizFinished") === "true") {
        goToHasil();
      } else {
        hideTimeoutModal();
      }
    }
  });
});

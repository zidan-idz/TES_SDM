// Inisialisasi AOS (Animation On Scroll)
AOS.init({
  duration: 1000,
  once: true,
  easing: "ease-in-out",
  offset: 50,
});

/**
 * Fungsi animasi angka naik
 * @param {HTMLElement} element - Elemen DOM target
 * @param {number} finalValue - Angka tujuan akhir
 * @param {number} duration - Durasi animasi dalam ms
 * @param {boolean} isPercentage - Jika true, tambahkan simbol %
 */
function animateCounter(
  element,
  finalValue,
  duration = 2000,
  isPercentage = false
) {
  const startValue = 0;
  let currentValue = startValue;
  const increment = finalValue / (duration / 16);

  // Bersihkan animasi sebelumnya
  if (element.dataset.animationInterval) {
    clearInterval(parseInt(element.dataset.animationInterval));
  }

  const timer = setInterval(() => {
    currentValue += increment;
    if (currentValue >= finalValue) {
      currentValue = finalValue;
      clearInterval(timer);
    }

    element.textContent = Math.floor(currentValue) + (isPercentage ? "%" : "");
  }, 16);

  // Simpan ID interval agar bisa dihentikan jika perlu
  element.dataset.animationInterval = timer.toString();
}

// Fungsi untuk memulai animasi statistik
function startStatisticsAnimation() {
  animateCounter(document.getElementById("totalCount"), 817, 2500);
  animateCounter(document.getElementById("sdmTinggiCount"), 62, 2500, true);
  animateCounter(document.getElementById("sdmRendahCount"), 38, 2500, true);
}

// Intersection Observer untuk memantau apakah statistik terlihat di layar
const statsSection = document.getElementById("statsSc");
let animationPlayed = false; // Mencegah animasi berulang

if (statsSection) {
  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animationPlayed) {
          startStatisticsAnimation();
          animationPlayed = true; // Cegah animasi ulang
          observerInstance.unobserve(entry.target); // Stop observing
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(statsSection);
}

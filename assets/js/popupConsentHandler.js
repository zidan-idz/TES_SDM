const checkboxes = document.querySelectorAll(".terms");
const btnStart = document.getElementById("startNow");

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
    btnStart.disabled = !allChecked;
  });
});

const allCheckboxes = document.querySelectorAll(".terms");
const start = document.getElementById("startNow");
const checkAll = document.getElementById("acceptAll");

function validate() {
  const semuaDiceklis = [...allCheckboxes].every((cb) => cb.checked);
  start.disabled = !semuaDiceklis;
}

allCheckboxes.forEach((cb) => {
  cb.addEventListener("change", () => {
    validate();
    if (!cb.checked) checkAll.checked = false;
  });
});

checkAll.addEventListener("change", () => {
  allCheckboxes.forEach((cb) => (cb.checked = checkAll.checked));
  validate();
});

validate();

// #########################################################

window.onload = function () {
  const NoticeMSG = document.getElementById("ImportantNotice");

  if (!NoticeMSG) return; // ⛔ Hindari error jika elemen tidak ditemukan

  const lastShown = localStorage.getItem("NtcLastShown");
  const now = Date.now();
  const timerShow = 1 * 60 * 1000; // 1 menit dalam milidetik

  if (!lastShown || now - lastShown > timerShow) {
    NoticeMSG.style.display = "flex";
    document.body.classList.add("noscroll");
    localStorage.setItem("NtcLastShown", now);
  } else {
    NoticeMSG.style.display = "none";
  }

  window.understand = function () {
    NoticeMSG.style.display = "none";
    document.body.classList.remove("noscroll");
  };
};

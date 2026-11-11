
/* MediCare+ Application JavaScript
   Medicine reminders, water tracker, BMI, daily report,
   exercise tips, JSON/AJAX, localStorage and theme.
*/

"use strict";

const STORAGE_KEYS = {
  medicines: "medicare_medicines",
  water: "medicare_water",
  waterGoal: "medicare_water_goal",
  exercise: "medicare_exercise",
  bmi: "medicare_bmi",
  theme: "medicare_theme",
  reminderLog: "medicare_reminder_log"
};

let medicines = loadJSON(STORAGE_KEYS.medicines, []);
let waterCount = Number(localStorage.getItem(STORAGE_KEYS.water) || 0);
let waterGoal = Number(localStorage.getItem(STORAGE_KEYS.waterGoal) || 8);
let exerciseMinutes = Number(localStorage.getItem(STORAGE_KEYS.exercise) || 0);
let bmiValue = Number(localStorage.getItem(STORAGE_KEYS.bmi) || 0);
let articles = [];
let exercises = [];

const $ = (id) => document.getElementById(id);

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error("Storage read error:", error);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function showToast(message) {
  $("toastMessage").textContent = message;
  const toast = bootstrap.Toast.getOrCreateInstance($("appToast"));
  toast.show();
}

function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

/* ---------- MEDICINE CLASS ---------- */

class Medicine {
  constructor(name, dose, time, startDate, endDate, notes) {
    this.id = Date.now() + Math.floor(Math.random() * 1000);
    this.name = name.trim();
    this.dose = dose.trim();
    this.time = time;
    this.startDate = startDate;
    this.endDate = endDate;
    this.notes = notes.trim();
  }

  isActiveToday() {
    const today = new Date().toISOString().slice(0, 10);
    return today >= this.startDate && today <= this.endDate;
  }
}

function renderMedicines(searchTerm = "") {
  const list = $("medicineList");
  const filtered = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  $("medicineCount").textContent = medicines.length;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="col-12 text-muted text-center py-4">
      ${medicines.length ? "No matching medicine found." : "No medicines added yet."}
    </div>`;
    updateDashboard();
    return;
  }

  list.innerHTML = filtered.map((medicine) => {
    const active = isMedicineActive(medicine);

    return `
      <div class="col-md-6">
        <article class="medicine-item">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h5 class="mb-1">${escapeHTML(medicine.name)}</h5>
              <span class="badge ${active ? "text-bg-success" : "text-bg-secondary"}">
                ${active ? "Active today" : "Outside date range"}
              </span>
            </div>
            <button class="btn btn-sm btn-outline-danger delete-medicine"
                    data-id="${medicine.id}" type="button" aria-label="Delete medicine">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <p class="medicine-time mt-3 mb-1">
            <i class="bi bi-clock"></i> ${escapeHTML(medicine.time)}
          </p>
          <p class="mb-1"><strong>Dose:</strong> ${escapeHTML(medicine.dose)}</p>
          <p class="small text-muted mb-1">
            ${formatDate(medicine.startDate)} → ${formatDate(medicine.endDate)}
          </p>
          ${medicine.notes ? `<p class="small mb-0">${escapeHTML(medicine.notes)}</p>` : ""}
        </article>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".delete-medicine").forEach((button) => {
    button.addEventListener("click", function () {
      const id = Number(this.dataset.id);
      medicines = medicines.filter((item) => Number(item.id) !== id);
      saveJSON(STORAGE_KEYS.medicines, medicines);
      renderMedicines($("medicineSearch").value);
      showToast("Medicine deleted.");
    });
  });

  updateDashboard();
}

function isMedicineActive(medicine) {
  const today = new Date().toISOString().slice(0, 10);
  return today >= medicine.startDate && today <= medicine.endDate;
}

$("medicineForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const form = this;

  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    showToast("Please complete the required medicine fields.");
    return;
  }

  const start = $("startDate").value;
  const end = $("endDate").value;

  if (end < start) {
    $("endDate").setCustomValidity("End date cannot be before start date.");
    form.classList.add("was-validated");
    showToast("End date must be on or after the start date.");
    return;
  }

  $("endDate").setCustomValidity("");

  const medicine = new Medicine(
    $("medicineName").value,
    $("dose").value,
    $("medicineTime").value,
    start,
    end,
    $("doctor").value
  );

  medicines.push(medicine);
  saveJSON(STORAGE_KEYS.medicines, medicines);

  form.reset();
  form.classList.remove("was-validated");
  renderMedicines($("medicineSearch").value);
  showToast(`${medicine.name} was saved.`);
});

$("startDate").addEventListener("change", () => {
  $("endDate").min = $("startDate").value;
});

$("medicineSearch").addEventListener("input", function () {
  renderMedicines(this.value);
});

$("clearMedicines").addEventListener("click", () => {
  if (medicines.length === 0) {
    showToast("There are no medicines to clear.");
    return;
  }

  if (window.confirm("Clear all saved medicines?")) {
    medicines = [];
    saveJSON(STORAGE_KEYS.medicines, medicines);
    renderMedicines();
    showToast("All medicines cleared.");
  }
});

/* ---------- WATER TRACKER ---------- */

function updateWater() {
  $("waterCount").textContent = waterCount;
  $("waterGoalText").textContent = waterGoal;
  $("waterGoal").value = waterGoal;

  const percentage = Math.min(100, Math.round((waterCount / waterGoal) * 100));

  $("waterProgress").style.width = `${percentage}%`;
  $("waterProgress").setAttribute("aria-valuenow", percentage);

  $("waterStat").textContent = waterCount;
  updateDashboard();
}

$("addWater").addEventListener("click", () => {
  waterCount += 1;
  localStorage.setItem(STORAGE_KEYS.water, String(waterCount));
  updateWater();
  showToast("Water intake updated.");
});

$("removeWater").addEventListener("click", () => {
  waterCount = Math.max(0, waterCount - 1);
  localStorage.setItem(STORAGE_KEYS.water, String(waterCount));
  updateWater();
});

$("saveWaterGoal").addEventListener("click", () => {
  const newGoal = Number($("waterGoal").value);

  if (!Number.isFinite(newGoal) || newGoal < 1 || newGoal > 30) {
    showToast("Choose a goal between 1 and 30 glasses.");
    return;
  }

  waterGoal = Math.round(newGoal);
  localStorage.setItem(STORAGE_KEYS.waterGoal, String(waterGoal));
  updateWater();
  showToast("Water goal saved.");
});

/* ---------- BMI CALCULATOR ---------- */

$("bmiForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const form = this;
  const height = Number($("height").value);
  const weight = Number($("weight").value);

  if (!form.checkValidity() || height < 50 || height > 250 ||
      weight < 10 || weight > 300) {
    form.classList.add("was-validated");
    showToast("Enter valid height and weight values.");
    return;
  }

  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);

  bmiValue = Number(bmi.toFixed(1));
  localStorage.setItem(STORAGE_KEYS.bmi, String(bmiValue));

  let category = "Healthy range";

  if (bmi < 18.5) {
    category = "Below the general healthy range";
  } else if (bmi >= 25 && bmi < 30) {
    category = "Above the general healthy range";
  } else if (bmi >= 30) {
    category = "High BMI range";
  }

  $("bmiResult").innerHTML = `
    <div class="bmi-number">${bmiValue}</div>
    <h3>${category}</h3>
    <p class="mb-0">BMI is a screening measure, not a diagnosis.</p>
  `;

  form.classList.remove("was-validated");
  updateDashboard();
  showToast("BMI calculated.");
});

/* ---------- DAILY HEALTH REPORT ---------- */

$("saveExercise").addEventListener("click", () => {
  const value = Number($("exerciseMinutes").value);

  if (!Number.isFinite(value) || value < 0 || value > 600) {
    showToast("Exercise minutes must be between 0 and 600.");
    return;
  }

  exerciseMinutes = Math.round(value);
  localStorage.setItem(STORAGE_KEYS.exercise, String(exerciseMinutes));
  updateDashboard();
  showToast("Exercise minutes saved.");
});

function calculateHealthScore() {
  const medicineScore = medicines.length > 0 ? 25 : 0;
  const waterScore = Math.min(25, Math.round((waterCount / waterGoal) * 25));
  const exerciseScore = Math.min(25, Math.round((exerciseMinutes / 30) * 25));
  const bmiScore = bmiValue > 0 ? 25 : 0;

  return Math.min(100, medicineScore + waterScore + exerciseScore + bmiScore);
}

function updateDashboard() {
  const score = calculateHealthScore();

  $("reportMedicine").textContent = medicines.length;
  $("reportWater").textContent = `${waterCount} / ${waterGoal}`;
  $("reportExercise").textContent = `${exerciseMinutes} min`;
  $("reportBMI").textContent = bmiValue > 0 ? bmiValue : "--";

  $("twScore").textContent = `${score}%`;
  $("twProgress").style.width = `${score}%`;

  $("exerciseStat").textContent = exerciseMinutes;
  $("scoreStat").textContent = `${score}%`;

  $("heroProgress").style.width = `${score}%`;
  $("heroProgress").textContent = `${score}%`;

  $("heroProgressText").textContent =
    score >= 75 ? "Great consistency today!" :
    score >= 40 ? "Good start — keep going." :
    "Add a few activities to build your report.";
}

/* ---------- JSON AND AJAX ---------- */

async function loadHealthData() {
  try {
    const [articleResponse, exerciseResponse] = await Promise.all([
      fetch("json/health.json"),
      fetch("json/exercises.json")
    ]);

    if (!articleResponse.ok || !exerciseResponse.ok) {
      throw new Error("Could not load JSON data.");
    }

    articles = await articleResponse.json();
    exercises = await exerciseResponse.json();

    renderArticles(articles);
    renderExercises(exercises);

  } catch (error) {
    console.error(error);

    $("articleList").innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning">
          JSON data could not be loaded. Run the project using VS Code Live Server.
        </div>
      </div>`;

    $("exerciseCards").innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning">
          Exercise data could not be loaded. Run the project using VS Code Live Server.
        </div>
      </div>`;
  }
}

function renderExercises(data) {
  $("exerciseCards").innerHTML = data.map((item) => `
    <div class="col-md-6 col-lg-4">
      <article class="card app-card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <h4>${escapeHTML(item.title)}</h4>
            <span class="badge text-bg-info">${escapeHTML(item.level)}</span>
          </div>
          <p class="text-muted">${escapeHTML(item.description)}</p>
          <div class="progress mb-3">
            <div class="progress-bar" style="width:${Number(item.minutes)}%">
              ${Number(item.minutes)} min
            </div>
          </div>
          <p class="small mb-0"><strong>Tip:</strong> ${escapeHTML(item.tip)}</p>
        </div>
      </article>
    </div>
  `).join("");
}

function renderArticles(data) {
  const indicators = $("carouselIndicators");
  const slides = $("articleSlides");

  indicators.innerHTML = data.map((_, index) => `
    <button type="button" data-bs-target="#articleCarousel"
      data-bs-slide-to="${index}"
      class="${index === 0 ? "active" : ""}"
      aria-label="Slide ${index + 1}"></button>
  `).join("");

  slides.innerHTML = data.map((article, index) => `
    <div class="carousel-item ${index === 0 ? "active" : ""}">
      <div class="p-5 rounded-4 article-slide">
        <span class="badge text-bg-primary">${escapeHTML(article.category)}</span>
        <h3 class="mt-3">${escapeHTML(article.title)}</h3>
        <p class="lead mb-0">${escapeHTML(article.description)}</p>
      </div>
    </div>
  `).join("");

  renderArticleList(data);
}

function renderArticleList(data) {
  $("articleList").innerHTML = data.map((article) => `
    <div class="col-md-6">
      <article class="border rounded-4 p-4 h-100">
        <span class="badge text-bg-secondary">${escapeHTML(article.category)}</span>
        <h5 class="mt-2">${escapeHTML(article.title)}</h5>
        <p class="mb-0 text-muted">${escapeHTML(article.description)}</p>
      </article>
    </div>
  `).join("");
}

$("articleSearch").addEventListener("input", function () {
  const term = this.value.toLowerCase();

  const filtered = articles.filter((article) =>
    `${article.title} ${article.category} ${article.description}`
      .toLowerCase().includes(term)
  );

  renderArticleList(filtered);
});

/* ---------- LIGHT AND DARK THEME ---------- */

function applyTheme() {
  const dark = localStorage.getItem(STORAGE_KEYS.theme) === "dark";

  document.body.classList.toggle("dark-mode", dark);

  $("themeBtn").innerHTML = dark
    ? '<i class="bi bi-sun-fill"></i>'
    : '<i class="bi bi-moon-stars-fill"></i>';
}

$("themeBtn").addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark-mode");

  localStorage.setItem(STORAGE_KEYS.theme, dark ? "dark" : "light");
  applyTheme();
});

/* ---------- CONTACT FORM VALIDATION ---------- */

$("contactForm").addEventListener("submit", function (event) {
  event.preventDefault();

  if (!this.checkValidity()) {
    this.classList.add("was-validated");
    showToast("Please complete the feedback form.");
    return;
  }

  this.reset();
  this.classList.remove("was-validated");

  showToast("Thank you! Your feedback was recorded for this demo.");
});

/* ---------- MEDICINE REMINDER TIMER ---------- */

function checkMedicineReminders() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const today = now.toISOString().slice(0, 10);
  const reminderLog = loadJSON(STORAGE_KEYS.reminderLog, []);

  medicines.forEach((medicine) => {
    const active = today >= medicine.startDate && today <= medicine.endDate;
    const reminderKey = `${today}_${medicine.id}_${medicine.time}`;

    if (active && medicine.time === currentTime &&
        !reminderLog.includes(reminderKey)) {

      reminderLog.push(reminderKey);
      saveJSON(STORAGE_KEYS.reminderLog, reminderLog);

      $("medicineModalBody").innerHTML = `
        <div class="text-center">
          <i class="bi bi-bell-fill text-warning fs-1"></i>
          <h4 class="mt-3">Medicine Reminder</h4>
          <p>It is time to check your schedule for
            <strong>${escapeHTML(medicine.name)}</strong>.
          </p>
          <p class="mb-0">Dose: ${escapeHTML(medicine.dose)}</p>
        </div>
      `;

      const modal = bootstrap.Modal.getOrCreateInstance(
        $("medicineInfoModal")
      );

      modal.show();
    }
  });
}

/* ---------- STARTUP ---------- */

document.addEventListener("DOMContentLoaded", () => {
  $("currentYear").textContent = new Date().getFullYear();

  applyTheme();

  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
    new bootstrap.Tooltip(element);
  });

  renderMedicines();
  updateWater();

  $("exerciseMinutes").value = exerciseMinutes;

  if (bmiValue > 0) {
    $("bmiResult").innerHTML = `
      <div class="bmi-number">${bmiValue}</div>
      <h3>Saved BMI result</h3>
      <p class="mb-0">Recalculate whenever you want an updated result.</p>
    `;
  }

  loadHealthData();

  checkMedicineReminders();
  setInterval(checkMedicineReminders, 30000);
});

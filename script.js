/* =========================
   GLOBAL STATE
========================= */

let appData = JSON.parse(localStorage.getItem("trainingApp")) || {
  plans: [],
  activePlanId: null
};

let activeDayIndex = 0;

function saveData() {
  localStorage.setItem("trainingApp", JSON.stringify(appData));
}

/* =========================
   NAVIGATION
========================= */

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const el = document.getElementById(page + "-page");
  if (el) el.style.display = "flex";
}

function goHome() {
  appData.activePlanId = null;
  saveData();
  renderPlanList();
  showPage("home");
}

/* =========================
   HOME / PLAN LIST
========================= */

function renderPlanList() {
  const list = document.getElementById("plan-list");
  if (!list) return;
  list.innerHTML = "";

  appData.plans.forEach(plan => {
    const card = document.createElement("div");
    card.className = "plan-card";
    card.innerHTML = `
      <strong>${plan.name}</strong><br>
      ${plan.days.length} Trainingstage
    `;
    card.onclick = () => openPlan(plan.id);
    list.appendChild(card);
  });
}

/* =========================
   PLAN ERSTELLEN (MODAL)
========================= */

function openFrequencyModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "flex";
  modal.innerHTML = `
    <div class="glass">
      <h4>Wie oft möchtest du trainieren?</h4>
      ${[1,2,3,4,5,6,7].map(n => `
        <button class="btn btn-outline-light w-100 mt-2"
          onclick="createPlan(${n})">
          ${n}x pro Woche
        </button>
      `).join("")}
      <button class="btn btn-outline-secondary w-100 mt-3"
        onclick="closeModal()">Abbrechen</button>
    </div>
  `;
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  modal.innerHTML = "";
}

function createPlan(dayCount) {
  const plan = {
    id: Date.now(),
    name: "Mein Trainingsplan",
    days: Array.from({ length: dayCount }, (_, i) => ({
      name: "Tag " + (i + 1),
      exercises: []
    }))
  };

  appData.plans.push(plan);
  appData.activePlanId = plan.id;
  activeDayIndex = 0;

  saveData();
  closeModal();
  renderPlan();
  showPage("plan");
}

/* =========================
   PLAN ÖFFNEN
========================= */

function openPlan(id) {
  appData.activePlanId = id;
  activeDayIndex = 0;
  saveData();
  renderPlan();
  showPage("plan");
}

function getActivePlan() {
  return appData.plans.find(p => p.id === appData.activePlanId);
}

/* =========================
   PLAN RENDER
========================= */

function renderPlan() {
  const plan = getActivePlan();
  if (!plan) return;

  document.getElementById("plan-title").innerText = plan.name;

  const tabs = document.getElementById("day-tabs");
  tabs.innerHTML = "";

  plan.days.forEach((day, i) => {
    const tab = document.createElement("div");
    tab.className = "day-tab" + (i === activeDayIndex ? " active" : "");
    tab.innerText = day.name;
    tab.onclick = () => {
      activeDayIndex = i;
      renderPlan();
    };
    tabs.appendChild(tab);
  });

  renderExercises();
}

/* =========================
   EXERCISES
========================= */

function renderExercises() {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  const container = document.getElementById("exercise-cards");
  container.innerHTML = "";

  day.exercises.forEach((ex, exIndex) => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    /* HEADER */
    const header = document.createElement("div");
    header.className = "exercise-header clickable";
    header.innerHTML = `<strong>${ex.name}</strong>`;
    card.appendChild(header);

    /* BODY */
    const body = document.createElement("div");
    body.style.display = ex.expanded ? "block" : "none";

    ex.sets.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "set-row";

      const w = document.createElement("input");
      w.type = "number";
      w.placeholder = "Gewicht";
      w.value = s.weight ?? "";
      w.oninput = () => {
        s.weight = w.value;
        saveData();
      };

      const r = document.createElement("input");
      r.type = "number";
      r.placeholder = "Wdh";
      r.value = s.reps ?? "";
      r.oninput = () => {
        s.reps = r.value;
        saveData();
      };

      row.appendChild(w);
      row.appendChild(r);
      body.appendChild(row);
    });

    const addSetBtn = document.createElement("button");
    addSetBtn.className = "btn btn-outline-light w-100 mt-2";
    addSetBtn.innerText = "Satz hinzufügen";
    addSetBtn.onclick = () => {
      ex.sets.push({
        weight: ex.lastWeight || "",
        reps: ex.lastReps || ""
      });
      ex.expanded = true;
      saveData();
      renderExercises();
    };

    const finishBtn = document.createElement("button");
    finishBtn.className = "btn btn-success w-100 mt-2";
    finishBtn.innerText = "Übung abschließen";
    finishBtn.onclick = () => finishExercise(ex);

    body.appendChild(addSetBtn);
    body.appendChild(finishBtn);

    /* HISTORY */
    if (ex.history?.length) {
      const hist = document.createElement("div");
      hist.className = "history";
      hist.innerHTML = ex.history
        .slice()
        .reverse()
        .map(h => `
          <div>
            <strong>${h.date}</strong><br>
            ${h.sets.map(s => `${s.weight}kg × ${s.reps}`).join("<br>")}
          </div>
        `)
        .join("<hr>");
      body.appendChild(hist);
    }

    card.appendChild(body);

    header.onclick = (e) => {
      ex.expanded = !ex.expanded;
      saveData();
      renderExercises();
    };

    container.appendChild(card);
  });

  const add = document.createElement("div");
  add.className = "empty-card";
  add.innerText = "+ Übung hinzufügen";
  add.onclick = addExercise;
  container.appendChild(add);
}

function addExercise() {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  const name = prompt("Übungsname:");
  if (!name) return;

  day.exercises.push({
    name,
    sets: [{ weight: "", reps: "" }],
    history: [],
    expanded: true,
    lastWeight: "",
    lastReps: ""
  });

  saveData();
  renderExercises();
}

/* =========================
   FINISH EXERCISE (HISTORY)
========================= */

function finishExercise(ex) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString();

  if (!ex.history) ex.history = [];

  const entry = {
    key: todayKey,
    date: todayLabel,
    sets: ex.sets.map(s => ({
      weight: s.weight,
      reps: s.reps
    }))
  };

  const existing = ex.history.find(h => h.key === todayKey);

  if (existing) {
    existing.sets = entry.sets;
  } else {
    ex.history.push(entry);
  }

  ex.lastWeight = ex.sets.at(-1)?.weight || "";
  ex.lastReps = ex.sets.at(-1)?.reps || "";

  ex.expanded = false;
  saveData();
  renderExercises();
}

/* =========================
   INIT
========================= */

renderPlanList();
showPage("home");

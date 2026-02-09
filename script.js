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
  const el = document.getElementById(page);
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
    card.className = "plan-card d-flex justify-content-between align-items-center";

    const info = document.createElement("div");
    info.innerHTML = `<strong>${plan.name}</strong><br>${plan.days.length} Trainingstage`;
    info.style.cursor = "pointer";
    info.onclick = () => openPlan(plan.id);

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.gap = "8px";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-warning btn-sm";
    editBtn.innerText = "Bearbeiten";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editPlan(plan.id);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.innerText = "Löschen";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deletePlan(plan.id);
    };

    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);

    card.appendChild(info);
    card.appendChild(buttons);

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
          onclick="openNameModal(${n})">
          ${n}x pro Woche
        </button>
      `).join("")}
      <button class="btn btn-outline-secondary w-100 mt-3"
        onclick="closeModal()">Abbrechen</button>
    </div>
  `;
}

function openNameModal(dayCount) {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <div class="glass">
      <h4>Wie soll dein Trainingsplan heißen?</h4>
      <input type="text" id="plan-name-input" class="form-control mt-2" placeholder="Planname">
      <button class="btn btn-success w-100 mt-3" onclick="createPlanWithName(${dayCount})">Erstellen</button>
      <button class="btn btn-outline-secondary w-100 mt-2" onclick="closeModal()">Abbrechen</button>
    </div>
  `;
}

function createPlanWithName(dayCount) {
  const nameInput = document.getElementById("plan-name-input");
  const planName = nameInput.value.trim() || "Mein Trainingsplan";

  const plan = {
    id: Date.now(),
    name: planName,
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
  showPage("training");
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
  modal.innerHTML = "";
}

/* =========================
   PLAN BEARBEITEN / LÖSCHEN
========================= */

function editPlan(id) {
  const plan = appData.plans.find(p => p.id === id);
  if (!plan) return;

  const newName = prompt("Neuer Planname:", plan.name);
  if (!newName) return;

  plan.name = newName.trim() || plan.name;
  saveData();
  renderPlanList();
}

function deletePlan(id) {
  if (!confirm("Willst du diesen Plan wirklich löschen?")) return;

  appData.plans = appData.plans.filter(p => p.id !== id);
  if (appData.activePlanId === id) appData.activePlanId = null;

  saveData();
  renderPlanList();
}

/* =========================
   PLAN ÖFFNEN
========================= */

function openPlan(id) {
  appData.activePlanId = id;
  activeDayIndex = 0;

  const plan = getActivePlan();
  if (plan) {
    plan.days.forEach(day => {
      day.exercises.forEach(ex => {
        ex.expanded = false;
      });
    });
  }

  saveData();
  renderPlan();
  showPage("training");
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

    const header = document.createElement("div");
    header.className = "d-flex justify-content-between align-items-center exercise-header";
    header.style.cursor = "pointer";

    header.onclick = (e) => {
      if (e.target.tagName !== "BUTTON" && e.target.tagName !== "INPUT") {
        ex.expanded = !ex.expanded;
        saveData();
        renderExercises();
      }
    };

    const nameDiv = document.createElement("div");
    nameDiv.innerHTML = `<strong>${ex.name}</strong>`;

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "5px";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-warning btn-sm";
    editBtn.innerText = "Bearbeiten";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      editExercise(exIndex);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm";
    deleteBtn.innerText = "Löschen";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteExercise(exIndex);
    };

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);

    header.appendChild(nameDiv);
    header.appendChild(btnContainer);
    card.appendChild(header);

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

    if (ex.history?.length) {
      const hist = document.createElement("div");
      hist.className = "history";

      const todayKey = new Date().toISOString().slice(0, 10);

      hist.innerHTML = ex.history
        .slice()
        .reverse()
        .map(h => {
          let html = `<div><strong>${h.date}</strong><br>${h.sets.map(s => `${s.weight}kg × ${s.reps}`).join("<br>")}</div>`;

          if (h.key === todayKey) {
            html += `<button class="btn btn-sm btn-warning mt-1" onclick="editTodayHistory(${day.exercises.indexOf(ex)})">Bearbeiten</button>`;
          }

          return html;
        })
        .join("<hr>");

      body.appendChild(hist);
    }

    card.appendChild(body);
    container.appendChild(card);
  });

  const add = document.createElement("div");
  add.className = "empty-card";
  add.innerText = "+ Übung hinzufügen";
  add.onclick = addExercise;
  container.appendChild(add);

  enableExerciseDrag();
}

/* =========================
   ÜBUNG BEARBEITEN / LÖSCHEN
========================= */

function editExercise(index) {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  const ex = day.exercises[index];
  const newName = prompt("Neuer Übungsname:", ex.name);
  if (!newName) return;
  ex.name = newName.trim() || ex.name;
  saveData();
  renderExercises();
}

function deleteExercise(index) {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  if (!confirm(`Willst du die Übung "${day.exercises[index].name}" wirklich löschen?`)) return;

  day.exercises.splice(index, 1);
  saveData();
  renderExercises();
}

/* =========================
   ÜBUNG HINZUFÜGEN / ABSCHLIESSEN
========================= */

function addExercise() {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  const name = prompt("Übungsname:");
  if (!name) return;

  day.exercises.push({
    name,
    sets: [{ weight: "", reps: "" }],
    history: [],
    expanded: false,
    lastWeight: "",
    lastReps: ""
  });

  saveData();
  renderExercises();
}

function finishExercise(ex) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString();

  if (!ex.history) ex.history = [];

  const entry = {
    key: todayKey,
    date: todayLabel,
    sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
  };

  const existing = ex.history.find(h => h.key === todayKey);

  if (existing) {
    existing.sets = entry.sets;
  } else {
    ex.history.push(entry);
  }

  const lastSet = ex.sets.at(-1);
  if (lastSet) {
    ex.lastWeight = lastSet.weight;
    ex.lastReps = lastSet.reps;
  }

  ex.expanded = false;
  saveData();
  renderExercises();
}

/* =========================
   HISTORY BEARBEITEN (HEUTIGER TAG)
========================= */

function editTodayHistory(exIndex) {
  const plan = getActivePlan();
  const day = plan.days[activeDayIndex];
  const ex = day.exercises[exIndex];
  const todayKey = new Date().toISOString().slice(0, 10);

  const todayEntry = ex.history.find(h => h.key === todayKey);
  if (!todayEntry) return;

  todayEntry.sets.forEach((s, i) => {
    const newWeight = prompt(`Satz ${i + 1} - Gewicht:`, s.weight);
    if (newWeight !== null) s.weight = newWeight;

    const newReps = prompt(`Satz ${i + 1} - Wiederholungen:`, s.reps);
    if (newReps !== null) s.reps = newReps;
  });

  const lastSet = todayEntry.sets.at(-1);
  if (lastSet) {
    ex.lastWeight = lastSet.weight;
    ex.lastReps = lastSet.reps;
  }

  saveData();
  renderExercises();
}

/* =========================
   DRAG & DROP
========================= */

function enableExerciseDrag() {
  const container = document.getElementById("exercise-cards");
  if (!container) return;

  Sortable.create(container, {
    animation: 150,
    ghostClass: "drag-ghost",
    chosenClass: "drag-chosen",
    dragClass: "drag-dragging",
    touchStartThreshold: 5, // verbessert Touch-Sensibilität
    filter: ".empty-card, button, input",
    preventOnFilter: false,
    onMove: (evt) => {
      return !evt.related.classList.contains("empty-card");
    },
    onEnd: (evt) => {
      const plan = getActivePlan();
      const day = plan.days[activeDayIndex];
      const moved = day.exercises.splice(evt.oldIndex, 1)[0];
      day.exercises.splice(evt.newIndex, 0, moved);
      saveData();
    }
  });
}

/* =========================
   INIT
========================= */

renderPlanList();
showPage("home");

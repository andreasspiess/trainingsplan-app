let plans = JSON.parse(localStorage.getItem("plans") || "[]");
let activePlan = null;
let activeDay = 0; // Index des aktuell ausgewählten Tages

function save() { localStorage.setItem("plans", JSON.stringify(plans)); }

/* ---------- HOME ---------- */
function renderPlans() {
  const list = document.getElementById("plan-list");
  list.innerHTML = "";

  plans.forEach((p,i)=>{
    const card = document.createElement("div");
    card.className = "plan-card";

    // Karte komplett klickbar → Plan starten
    card.onclick = (e)=>{
      if(e.target.classList.contains("btn-danger")) return; // Klick auf Löschen ignorieren
      startTraining(i);
    };

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${p.name}</strong>
        <button class="btn btn-danger btn-sm">Löschen</button>
      </div>
    `;

    // Löschen-Button
    const delBtn = card.querySelector(".btn-danger");
    delBtn.onclick = (e)=>{
      e.stopPropagation();
      if(confirm("Plan löschen?")){
        plans.splice(i,1);
        save();
        renderPlans();
      }
    };

    list.appendChild(card);
  });
}


function goHome(){
  document.getElementById("training").style.display="none";
  document.getElementById("home").style.display="flex";
}

/* ---------- TRAINING ---------- */
function startTraining(i){
  activePlan = i;
  activeDay = 0;
  const plan = plans[i];
  document.getElementById("home").style.display="none";
  document.getElementById("training").style.display="flex";
  document.getElementById("training-title").innerText = plan.name;
  renderDayTabs();
  renderExercises();
}

function renderDayTabs(){
  const tabs = document.getElementById("day-tabs");
  tabs.innerHTML="";
  const days = plans[activePlan].days;
  days.forEach((d,index)=>{
    const tab = document.createElement("div");
    tab.className="day-tab";
    if(index===activeDay) tab.classList.add("active");
    tab.innerText = d.name;
    tab.onclick = ()=>{ activeDay=index; renderDayTabs(); renderExercises(); };
    tabs.appendChild(tab);
  });
}

function renderExercises(){
  const container = document.getElementById("exercise-list");
  container.innerHTML="";
  const exercises = plans[activePlan].days[activeDay].exercises;

  exercises.forEach(ex => renderExercise(ex, container));

  // Übung hinzufügen
  const add = document.createElement("div");
  add.className = "empty-card";
  add.innerHTML = "<h4>+ Übung hinzufügen</h4>";
  add.onclick = ()=>{
    const name = prompt("Name der Übung:");
    if(name){
      exercises.push({name, sets:[], history:[]});
      save(); renderExercises();
    }
  };
  container.appendChild(add);
}

/* ---------- ÜBUNG ---------- */
function renderExercise(ex, container, expandedDefault=false) {
  const card = document.createElement("div");
  card.className = "exercise-card";

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span>${ex.name || "Neue Übung"}</span>
      <button class="btn btn-sm btn-outline-light edit-name">✎</button>
    </div>
    <div class="exercise-body" style="display:${expandedDefault ? "block" : "none"}; margin-top:10px;">
      <div class="sets"></div>
      <button class="btn btn-outline-light btn-sm mt-2">Satz hinzufügen</button>
      <button class="btn btn-success btn-sm mt-2">Übung abschließen</button>
      <div class="history"></div>
    </div>
  `;

  const body = card.querySelector(".exercise-body");
  const editBtn = card.querySelector(".edit-name");
  const headerText = card.querySelector("span");
  const setsDiv = body.querySelector(".sets");

// Nur Header klickbar zum Auf-/Zuklappen
const header = card.querySelector("div"); // das obere div, das den Namen + Button enthält
header.onclick = (e)=>{
  if(e.target.tagName === "BUTTON") return; // Klick auf Button ignorieren
  ex.expanded = !ex.expanded;
  body.style.display = ex.expanded ? "block" : "none";
};


  // Name bearbeiten
  editBtn.onclick = (e)=>{
    e.stopPropagation();
    const newName = prompt("Übungsname bearbeiten:", ex.name);
    if(newName){
      ex.name = newName;
      headerText.innerText = ex.name;
      save();
    }
  };

  // Sätze rendern
  setsDiv.innerHTML = "";
  ex.sets.forEach((s,i)=>{
    const row = document.createElement("div");
    row.className = "set-row";
    row.innerHTML = `
      <input type="number" placeholder="kg" value="${s.weight||''}">
      <input type="number" placeholder="Wdh" value="${s.reps||''}">
    `;
    setsDiv.appendChild(row);
  });

  // Satz hinzufügen
  body.querySelector(".btn-outline-light").onclick = (e)=>{
    e.stopPropagation();
    ex.sets.push({weight:"", reps:""});
    const row = document.createElement("div");
    row.className="set-row";
    row.innerHTML = `<input type="number" placeholder="kg" value="">
                     <input type="number" placeholder="Wdh" value="">`;
    setsDiv.appendChild(row);
    ex.expanded = true; // bleibt aufgeklappt
    save();
  };

  // Übung abschließen
  body.querySelector(".btn-success").onclick = (e)=>{
    e.stopPropagation();
    setsDiv.querySelectorAll(".set-row").forEach((r,i)=>{
      const inputs = r.querySelectorAll("input");
      ex.sets[i].weight = inputs[0].value;
      ex.sets[i].reps = inputs[1].value;
    });
    ex.history = ex.history || [];
    ex.history.unshift({
      date: new Date().toLocaleDateString(),
      sets: ex.sets.map(s=>({...s}))
    });

    ex.expanded = true; // Karte bleibt aufgeklappt, damit man direkt weiterarbeiten kann
    save();
    renderExercises();
  };

  // Historie
  const hist = body.querySelector(".history");
  if(ex.history?.length){
    const h = ex.history[0];
    hist.innerHTML = `<strong>${h.date}</strong><br>` +
      h.sets.map(s=>`${s.weight}kg × ${s.reps}`).join("<br>");
  }

  container.appendChild(card);
}




/* ---------- PLAN ERSTELLEN ---------- */
function openFrequencyModal(){
  const modal = document.getElementById("modal");
  modal.style.display="flex";
  modal.innerHTML = `
    <div class="glass">
      <h4>Wie oft willst du trainieren?</h4>
      ${[1,2,3,4,5,6,7].map(n=>`
        <button class="btn btn-outline-light w-100 mt-2" onclick="createPlan(${n})">
          ${n}x pro Woche
        </button>
      `).join("")}
    </div>
  `;
}

function createPlan(days){
  const name = prompt("Name des Trainingsplans:");
  plans.push({
    name: name||"Trainingsplan",
    days: Array.from({length:days}, (_,i)=>({name:`Tag ${i+1}`, exercises:[]})),
  });
  save();
  document.getElementById("modal").style.display="none";
  renderPlans();
}

renderPlans();

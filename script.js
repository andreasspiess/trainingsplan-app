let OKUK = {
  Oberkörper: { A:[], B:[] },
  Unterkörper: { A:[], B:[] }
};
let currentBody = "Oberkörper";
let currentDay = "A";
let currentExerciseIndex = null;

// Lade von LocalStorage
window.onload = () => {
  const stored = localStorage.getItem("OKUK");
  if(stored) OKUK = JSON.parse(stored);
  renderDayTabs();
  renderExercises();
};

// Wechsel Ober-/Unterkörper
function switchBody(body){
  currentBody=body;
  document.querySelectorAll(".body-tab").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");
  renderDayTabs();
  renderExercises();
}

// Day Tabs
function renderDayTabs(){
  const container=document.getElementById("day-tabs");
  container.innerHTML="";
  ["A","B"].forEach(d=>{
    const btn=document.createElement("div"); btn.className="day-tab"; btn.innerText=d;
    if(d===currentDay) btn.classList.add("active");
    btn.onclick=()=>{ currentDay=d; renderDayTabs(); renderExercises(); };
    container.appendChild(btn);
  });
}

// Übungen anzeigen
function renderExercises(){
  const container=document.getElementById("exercise-cards"); container.innerHTML="";
  const exercises = OKUK[currentBody][currentDay];
  exercises.forEach((ex,i)=>{
    const card=document.createElement("div"); card.className="card"; card.innerText=ex.name;
    card.onclick=()=>openExerciseDetail(i);
    container.appendChild(card);
  });
  const addBtn=document.createElement("div"); addBtn.className="add-exercise-card"; addBtn.innerText="+ Neue Übung";
  addBtn.onclick=()=>{
    const n=prompt("Übungsname:"); if(!n) return;
    exercises.push({name:n, sets:[], history:[]});
    saveData(); renderExercises();
  };
  container.appendChild(addBtn);
}

// Übungsdetail
function openExerciseDetail(index){
  currentExerciseIndex=index;
  const ex=OKUK[currentBody][currentDay][index];
  document.getElementById("exercise-name").innerText = ex.name;
  document.getElementById("exercise-detail").style.display="block";
  document.getElementById("exercise-cards").style.display="none";
  renderExerciseSets();
  renderExerciseHistory();
}

function renderExerciseSets(){
  const container=document.getElementById("exercise-sets"); container.innerHTML="";
  const ex = OKUK[currentBody][currentDay][currentExerciseIndex];
  ex.sets.forEach((s,i)=>{
    const row=document.createElement("div"); row.className="input-group-row";
    const w=document.createElement("input"); w.type="number"; w.value=s.weight; w.placeholder="kg";
    const r=document.createElement("input"); r.type="number"; r.value=s.reps; r.placeholder="Wdh";
    row.appendChild(w); row.appendChild(r);

    const done=document.createElement("div"); done.className="set-done-icon"; done.innerText="✔";
    if(s.done) done.classList.add("done");
    done.onclick=()=>{
      s.done=!s.done;
      if(s.done){
        ex.history.push({weight: w.value, reps:r.value, date:new Date().toLocaleDateString()});
      }
      saveData();
      renderExerciseSets();
      renderExerciseHistory();
    };

    row.appendChild(done);
    container.appendChild(row);
  });

  // Neue Satz hinzufügen
  const add=document.createElement("button"); add.className="btn btn-outline-light mt-2"; add.innerText="+ Satz hinzufügen";
  add.onclick=()=>{ ex.sets.push({weight:0,reps:0,done:false}); saveData(); renderExerciseSets(); };
  container.appendChild(add);
}

// Historie
function renderExerciseHistory(){
  const container=document.getElementById("exercise-history"); container.innerHTML="";
  const ex = OKUK[currentBody][currentDay][currentExerciseIndex];
  ex.history.forEach(h=>{
    const row=document.createElement("div"); row.className="history-card";
    row.innerText = `${h.date}: ${h.weight}kg x ${h.reps} Wdh`;
    container.appendChild(row);
  });
}

function backToExercises(){
  document.getElementById("exercise-detail").style.display="none";
  document.getElementById("exercise-cards").style.display="block";
}

function saveData(){ localStorage.setItem("OKUK", JSON.stringify(OKUK)); }

let OKUK = {
  Oberkörper: { A:[], B:[] },
  Unterkörper: { A:[], B:[] }
};

let currentBody = "Oberkörper";
let currentDay = "A";
let currentExerciseIndex = null;

window.onload = () => {
  const stored = localStorage.getItem("OKUK");
  if(stored) OKUK = JSON.parse(stored);
  updateNavbar();
  renderDayTabs();
  renderExercises();
  document.getElementById("back-button").onclick = backToExercises;
};

function updateNavbar(){
  document.getElementById("navbar-ok").classList.toggle("active", currentBody==="Oberkörper");
  document.getElementById("navbar-uk").classList.toggle("active", currentBody==="Unterkörper");
}

function switchBodyNav(body){
  currentBody=body;
  updateNavbar();
  renderDayTabs();
  renderExercises();
}

function renderDayTabs(){
  const container=document.getElementById("day-tabs");
  container.innerHTML="";
  ["A","B"].forEach(d=>{
    const btn=document.createElement("div"); 
    btn.className="day-tab"; 
    btn.innerText=`${currentBody} ${d}`;
    if(d===currentDay) btn.classList.add("active");
    btn.onclick=()=>{ currentDay=d; renderDayTabs(); renderExercises(); };
    container.appendChild(btn);
  });
}

function renderExercises(){
  const container=document.getElementById("exercise-cards"); 
  container.innerHTML="";
  const exercises = OKUK[currentBody][currentDay];

  exercises.forEach((ex,i)=>{
    const card=document.createElement("div"); 
    card.className="card-exercise";

    const nameDiv=document.createElement("div");
    nameDiv.className="exercise-name";
    nameDiv.innerText=ex.name;
    card.appendChild(nameDiv);

    const btnContainer=document.createElement("div");
    btnContainer.className="exercise-buttons";

    const editBtn=document.createElement("button");
    editBtn.className="btn btn-sm btn-outline-light";
    editBtn.innerText="Bearbeiten";
    editBtn.onclick=(e)=>{
      e.stopPropagation();
      const newName=prompt("Neuer Übungsname:",ex.name);
      if(newName){ ex.name=newName; saveData(); renderExercises(); }
    };
    btnContainer.appendChild(editBtn);

    const delBtn=document.createElement("button");
    delBtn.className="btn btn-sm btn-outline-danger";
    delBtn.innerText="Löschen";
    delBtn.onclick=(e)=>{
      e.stopPropagation();
      if(confirm(`Übung "${ex.name}" wirklich löschen?`)){
        exercises.splice(i,1);
        saveData();
        renderExercises();
      }
    };
    btnContainer.appendChild(delBtn);

    card.appendChild(btnContainer);

    card.onclick = (e)=>{
      if(e.target.tagName!=="BUTTON" && !e.target.classList.contains("set-done-icon")){
        openExerciseDetail(i);
      }
    };

    container.appendChild(card);
  });

  const addBtn=document.createElement("div"); 
  addBtn.className="card-exercise"; 
  addBtn.innerText="+ Neue Übung";
  addBtn.style.justifyContent="center";
  addBtn.onclick=()=>{
    const n=prompt("Übungsname:"); 
    if(!n) return;
    exercises.push({name:n, sets:[], history:[]});
    saveData(); renderExercises();
  };
  container.appendChild(addBtn);
}

function openExerciseDetail(index){
  currentExerciseIndex=index;
  const ex=OKUK[currentBody][currentDay][index];
  document.getElementById("exercise-name").innerText=ex.name;
  document.getElementById("exercise-detail").style.display="block";
  document.getElementById("exercise-cards").style.display="block";
  renderExerciseSets();
  renderExerciseHistory();
}

function renderExerciseSets(){
  const container = document.getElementById("exercise-sets"); 
  container.innerHTML = "";
  const ex = OKUK[currentBody][currentDay][currentExerciseIndex];

  ex.sets.forEach((s,i)=>{
    const row = document.createElement("div"); 
    row.className = "input-group-row";

    const last = ex.history.length ? ex.history[ex.history.length-1] : {weight:0,reps:0};
    
    // Satznummer
    const num = document.createElement("div");
    num.style.width = "60px";
    num.innerText = `${i+1}. Satz`;
    row.appendChild(num);

    const w = document.createElement("input"); 
    w.type = "number"; 
    w.value = s.weight || last.weight; 
    w.placeholder = "kg";
    row.appendChild(w);

    const r = document.createElement("input"); 
    r.type = "number"; 
    r.value = s.reps || last.reps; 
    r.placeholder = "Wdh";
    row.appendChild(r);

    // Satz erledigt Button
    const done = document.createElement("div"); 
    done.className = "set-done-icon"; 
    done.innerText = "✔";
    if(s.done) done.classList.add("done");
    done.onclick = (e)=>{
      e.stopPropagation();
      s.done = !s.done;
      if(s.done){
        ex.history.push({weight:w.value, reps:r.value, date:new Date().toLocaleDateString()});
      }
      saveData();
      renderExerciseSets();
      renderExerciseHistory();
    };
    row.appendChild(done);

    // Satz löschen Button
    const del = document.createElement("div");
    del.className = "set-done-icon";
    del.innerText = "✖";
    del.style.backgroundColor = "#dc3545";
    del.onclick = (e)=>{
      e.stopPropagation();
      if(confirm("Satz wirklich löschen?")){
        ex.sets.splice(i,1);
        saveData();
        renderExerciseSets();
      }
    };
    row.appendChild(del);

    container.appendChild(row);
  });

  // Satz hinzufügen
  const add = document.createElement("button"); 
  add.className = "btn btn-outline-light mt-2"; 
  add.innerText = "+ Satz hinzufügen";
  add.onclick = ()=>{
    ex.sets.push({weight:0, reps:0, done:false}); 
    saveData(); 
    renderExerciseSets();
  };
  container.appendChild(add);
}


function renderExerciseHistory(){
  const container=document.getElementById("exercise-history"); 
  container.innerHTML="";
  const ex = OKUK[currentBody][currentDay][currentExerciseIndex];
  ex.history.forEach(h=>{
    const row=document.createElement("div"); row.className="history-card";
    row.innerText = `${h.date}: ${h.weight}kg x ${h.reps} Wdh`;
    container.appendChild(row);
  });
}

function backToExercises(){
  document.getElementById("exercise-detail").style.display = "none";
  document.getElementById("exercise-cards").style.display = "block";
}

function saveData(){ localStorage.setItem("OKUK", JSON.stringify(OKUK)); }

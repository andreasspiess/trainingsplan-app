let currentDay = "upper", currentLower = "A", currentExerciseIndex = null;
let exercisesData = {upper: [], lower: {A: [], B: []}};

// Laden beim Start
window.onload = () => {
    let saved = localStorage.getItem("trainingData");
    if (saved) exercisesData = JSON.parse(saved);
    renderMain();
};

// === Main Rendering ===
function renderMain() {
    document.getElementById("main-view").style.display = "block";
    document.getElementById("detail-view").style.display = "none";
    currentDay === "upper" ? (document.getElementById("lower-options").style.display = "none", renderUpperExercises())
                            : (document.getElementById("lower-options").style.display = "flex", renderLowerExercises());
}

function renderUpperExercises() {
    let container = document.getElementById("exercise-cards"); container.innerHTML = "";
    exercisesData.upper.forEach((ex, i) => container.appendChild(createExerciseCard(ex.name, i, "upper")));
    addExerciseButton(container);
    document.getElementById("training-title").innerText = "Oberkörper Training";
}

function renderLowerExercises() {
    let container = document.getElementById("exercise-cards"); container.innerHTML = "";
    exercisesData.lower[currentLower].forEach((ex, i) => container.appendChild(createExerciseCard(ex.name, i, "lower")));
    addExerciseButton(container);
    document.getElementById("training-title").innerText = "Unterkörper Training (" + (currentLower === "A" ? "Vorderseite" : "Rückseite") + ")";
}

function createExerciseCard(name, index, type) {
    let card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<div class="card-body">
        <h5 class="card-title">${name}</h5>
        <button class="btn btn-outline-light me-2" onclick="editExercise(${index},'${type}');event.stopPropagation()">✏️</button>
        <button class="btn btn-outline-danger" onclick="deleteExercise(${index},'${type}');event.stopPropagation()">🗑️</button>
    </div>`;
    card.onclick = () => openExerciseDetail(index);
    return card;
}

function addExerciseButton(container) {
    let addBtn = document.createElement("div");
    addBtn.className = "btn add-exercise-card";
    addBtn.innerText = "+ Neue Übung";
    addBtn.onclick = () => addExercise();
    container.appendChild(addBtn);
}

function switchDay(day) { currentDay = day; renderMain(); }
function switchLowerDay(letter) { currentLower = letter; renderLowerExercises(); }

// === Übung hinzufügen/löschen ===
function addExercise() {
    let name = prompt("Name der neuen Übung:"); if (!name) return;
    let target = currentDay === "upper" ? exercisesData.upper : exercisesData.lower[currentLower];
    target.push({name: name, sets: [{weight: 0, reps: 0, done: false, history: []}]});
    saveProgress(); renderCardsOnly();
    let container = document.getElementById("exercise-cards"); let lastCard = container.lastElementChild;
    if (lastCard) { lastCard.classList.add("pop"); setTimeout(() => { lastCard.classList.remove("pop"); }, 300);}
}

function editExercise(i,type) { let name = prompt("Neuer Name:"); if(!name) return; 
    let target = type==="upper"?exercisesData.upper:exercisesData.lower[currentLower]; target[i].name=name; saveProgress(); renderCardsOnly(); }

function deleteExercise(i, type) {
    let target = type === "upper" ? exercisesData.upper : exercisesData.lower[currentLower];
    let container = document.getElementById("exercise-cards"); let card = container.children[i];
    if (card) {
        card.classList.add("deleting");
        setTimeout(() => { target.splice(i, 1); saveProgress(); renderCardsOnly(); }, 300);
    } else {
        target.splice(i, 1); saveProgress(); renderCardsOnly();
    }
}

function renderCardsOnly() { currentDay === "upper" ? renderUpperExercises() : renderLowerExercises(); }

// === Detail View ===
function openExerciseDetail(i) {
    currentExerciseIndex = i;
    document.getElementById("main-view").style.display = "none";
    document.getElementById("detail-view").style.display = "block";
    let ex = currentDay === "upper" ? exercisesData.upper[i] : exercisesData.lower[currentLower][i];
    document.getElementById("exercise-name").innerText = ex.name;

    let setsContainer = document.getElementById("exercise-sets"); setsContainer.innerHTML = "";
    ex.sets.forEach((s, idx) => {
        let row = document.createElement("div"); row.className = "input-group-row" + (s.done ? " done" : "");
        row.innerHTML = `<input type="number" value="${s.weight}" placeholder="Gewicht">kg
            <input type="number" value="${s.reps}" placeholder="Wdh">
            <div class="set-done-icon ${s.done?'done':''}" onclick="toggleDone(${idx})">✔</div>
            <div class="set-delete-icon" onclick="deleteSet(${idx});event.stopPropagation()">✖</div>`;
        setsContainer.appendChild(row);
    });

    let addSetBtn = document.createElement("button"); addSetBtn.innerText = "+ Satz hinzufügen";
    addSetBtn.className = "btn btn-sm btn-outline-light mt-2";
    addSetBtn.onclick = () => { ex.sets.push({weight:0,reps:0,done:false,history:[]}); saveProgress(); openExerciseDetail(currentExerciseIndex); };
    setsContainer.appendChild(addSetBtn);

    renderHistory();
}

// === Satz Aktionen ===
function toggleDone(idx){
    let ex = currentDay === "upper" ? exercisesData.upper[currentExerciseIndex] : exercisesData.lower[currentLower][currentExerciseIndex];

    // Aktuelle Werte aus Input-Feld holen
    let row = document.querySelectorAll("#exercise-sets .input-group-row")[idx];
    let inputs = row.querySelectorAll("input");
    let weight = parseInt(inputs[0].value) || 0;
    let reps = parseInt(inputs[1].value) || 0;

    ex.sets[idx].weight = weight;
    ex.sets[idx].reps = reps;

    ex.sets[idx].done = !ex.sets[idx].done;

    if(ex.sets[idx].done){
        ex.sets[idx].history.push({weight: weight, reps: reps, date: new Date().toLocaleDateString()});
    }

    saveProgress();
    openExerciseDetail(currentExerciseIndex);
}

function deleteSet(idx){
    let ex = currentDay === "upper" ? exercisesData.upper[currentExerciseIndex] : exercisesData.lower[currentLower][currentExerciseIndex];
    let rows = document.querySelectorAll("#exercise-sets .input-group-row");
    if(rows[idx]){
        rows[idx].classList.add("deleting");
        setTimeout(()=>{ ex.sets.splice(idx,1); saveProgress(); openExerciseDetail(currentExerciseIndex); },300);
    } else { ex.sets.splice(idx,1); saveProgress(); openExerciseDetail(currentExerciseIndex);}
}

function renderHistory(){
    let ex = currentDay === "upper" ? exercisesData.upper[currentExerciseIndex] : exercisesData.lower[currentLower][currentExerciseIndex];
    let histContainer = document.getElementById("exercise-history"); histContainer.innerHTML="";
    ex.sets.forEach(s => {
        s.history.forEach(h => {
            let div = document.createElement("div"); div.className = "history-card";
            div.innerHTML = `<span class="hist-date">${h.date}</span><span class="hist-data">${h.weight}kg x ${h.reps}</span>`;
            histContainer.appendChild(div);
        });
    });
}

function backToMain(){ renderMain(); }
function saveProgress(){ localStorage.setItem("trainingData", JSON.stringify(exercisesData)); }

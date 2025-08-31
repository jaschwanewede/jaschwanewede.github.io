// ===== State =====
const playerSequence = [];
const defenseSequence = [];
let currentShotType = null;
const offenseLog = document.getElementById("offenseLog");
const defenseLog = document.getElementById("defenseLog");

// (These may be null depending on your HTML; not required below but kept for compatibility)
const playerGrid = document.getElementById("playerGrid");
const defenseGrid = document.getElementById("defenseGrid");

let lastCornerType = null;          // "offense" or "defense"
let pendingCornerType = null;       // (kept for compatibility)
let pendingPlayObject = null;       // (kept for compatibility)


//edit based on existing plays
let knownPlays = {
  "I→L→SS1": "Straight Flick",
  "I→SS2→A": "Slip Left Flick",
  "I→L→A→B": "Pass & Pop",
  "I→SS1→SS2→A": "Back Door Feed",
  "I→B→SS1": "Decoy Reverse",
  "I→SS2→L→SS1": "Loop Slip Flick",
  "I→A→B→R": "Right Option Switch"
};

const offensePositions = ["I", "L", "SS1", "A", "SS2", "B", "R"];
const defensePositions = ["LB", "L", "GK", "F", "P"];

let offensiveCorners = [];
let defensiveCorners = [];
let goals = [];
let currentDefense = null;          // which defender (text) is selected
let currentSequenceKey = null;      // cached offense sequence at result time
let currentPlayName = null;         // cached play name at result time
let currentOffenseResult = null;    // "shot" | "blocked" | "intercepted"

let currentDefenseResult = null;   // "shot" | "blocked" | "intercepted"
let currentDefenseSequenceKey = null;
let currentDefensePlayName = null;
let currentDefenseShotType = null;


function selectShotType(button, type, isOther = false) {
  // Figure out which screen we're in
  let shotScreen, textElementId, isOffense;
  if (document.getElementById("ShotScreenOffense").classList.contains("active")) {
    shotScreen = document.getElementById("ShotScreenOffense");
    textElementId = "currentShotTextOffense";
    isOffense = true;
  } else if (document.getElementById("ShotScreenDefense").classList.contains("active")) {
    shotScreen = document.getElementById("ShotScreenDefense");
    textElementId = "currentShotTextDefense";
    isOffense = false;
  } else {
    return; // not on a shot screen
  }

  // Look for currently selected button within this screen only
  const currentSelected = shotScreen.querySelector('.shot-type.selected');

  // If clicking the same button again → deselect and reset
  if (currentSelected === button && !isOther) {
    button.classList.remove('selected');
    if (isOffense) {
      currentShotType = null;
    } else {
      currentDefenseShotType = null;
    }
    document.getElementById(textElementId).textContent = "Current Shot: None";
    return;
  }

  // Clear highlights only in the active screen
  shotScreen.querySelectorAll('.shot-type').forEach(btn => btn.classList.remove('selected'));

  let selectedText = type;

  if (isOther) {
    const customType = prompt("Enter custom shot type:");
    if (!customType) {
      if (isOffense) {
        currentShotType = null;
      } else {
        currentDefenseShotType = null;
      }
      document.getElementById(textElementId).textContent = "Current Shot: None";
      return;
    }
    selectedText = customType;
    if (isOffense) {
      currentShotType = customType;
    } else {
      currentDefenseShotType = customType;
    }
    button.classList.add('selected'); // keep highlight on "Other"
  } else {
    if (isOffense) {
      currentShotType = type;
    } else {
      currentDefenseShotType = type;
    }
    button.classList.add('selected'); // highlight clicked button
  }

  // Update the correct "Current Shot" text
  document.getElementById(textElementId).textContent = "Current Shot: " + selectedText;
}


// ===== Utilities =====
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (!el) {
    console.error(`showScreen: #${id} not found in DOM`);
    return;
  }
  el.classList.add("active");
}

function showShotScreenOffense() {
  // Require at least 2 passes before a shot
  const sequenceKey = playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) {
    alert("Select at least two offense players before logging a shot.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return; // user cancelled

  currentSequenceKey = sequenceKey;
  currentPlayName = playName;

  // Reset state for offense shot
  currentShotType = null;
  document.getElementById("currentShotTextOffense").textContent = "Current Shot: None";

  // Clear highlights only inside the offense shot screen
  document.querySelectorAll("#ShotScreenOffense .shot-type").forEach(btn => btn.classList.remove("selected"));

  // Show the offense shot screen
  showScreen("ShotScreenOffense");
}


function showShotScreenDefense() {
  // Require at least 2 passes before a shot
  const sequenceKey = defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) {
    alert("Select at least two opponent players before logging a shot.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return; // user cancelled

  currentDefenseSequenceKey = sequenceKey;
  currentDefensePlayName = playName;

  // Reset state for defense shot
  currentDefenseShotType = null;
  document.getElementById("currentShotTextDefense").textContent = "Current Shot: None";

  // Clear highlights only inside the defense shot screen
  document.querySelectorAll("#ShotScreenDefense .shot-type").forEach(btn => btn.classList.remove("selected"));

  // Show the defense shot screen
  showScreen("ShotScreenDefense");
}


function updateOffenseLog() {
  if (offenseLog) offenseLog.textContent = "Play: " + playerSequence.join(" -> ");
}

function updateDefenseLog() {
  if (defenseLog) defenseLog.textContent = "Play: " + defenseSequence.join(" -> ");
}

function namePlayIfUnknown(sequenceKey, mapRef, promptLabel) {
  if (mapRef[sequenceKey]) return mapRef[sequenceKey];
  const name = prompt(`New ${promptLabel} play detected:\n${sequenceKey}\n\nEnter a name for this play:`);
  if (!name) return null; // user cancelled
  mapRef[sequenceKey] = name.trim();
  return mapRef[sequenceKey];
}

// ===== Game init / navigation =====
function startGame() {
  const home = document.getElementById("homeTeam").value;
  const away = document.getElementById("awayTeam").value;
  const date = document.getElementById("gameDate").value;

  if (!home || !away || !date) {
    alert("Please fill out all fields.");
    return;
  }
  showScreen("mainMenu");
}

function endGame() {
  showScreen("endGameScreen");
}

function showGoalScreenOffense() {
  if (!currentShotType) {
    alert("Please select a shot type before recording a goal.");
    return;
  }
  currentOffenseResult = "goal";
  showScreen('goalDetailsOffense');
}

function showGoalScreenDefense() {
  if (!currentDefenseShotType) {
    alert("Please select a shot type before recording a goal.");
    return;
  }
  currentDefenseResult = "goal";
  showScreen('goalDetailsDefense');
}

function showBlockedScreenOffense() {
  if (!currentShotType) {
    alert("Please select a shot type before recording a blocked shot.");
    return;
  }
  showBlockedOffense();
}

function showBlockedScreenDefense() {
  if (!currentDefenseShotType) {
    alert("Please select a shot type before recording a blocked shot.");
    return;
  }
  showBlockedDefense();
}


function backToMenu() {
  showScreen("mainMenu");
}

// ===== Offense =====
function startOffense() {
  playerSequence.length = 0;
  playerSequence.push("I"); // injector starts
  updateOffenseLog();

  // Build offense row
  const offenseRow = document.getElementById("offenseRowOffense");
  if (offenseRow) {
    offenseRow.innerHTML = "";
    offensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "offense", "offense");
      offenseRow.appendChild(div);
    });
  }

  showScreen("offenseScreen");
}

function showBlockedOffense() {
  currentOffenseResult = "blocked";

  const sequenceKey = playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) {
    alert("Select at least two offense players before logging a result.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return;

  currentSequenceKey = sequenceKey;
  currentPlayName = playName;

  // Build defender row
  const defenseRow = document.getElementById("blockedRowOffense");
  if (defenseRow) {
    defenseRow.innerHTML = "";
    defensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "defense", "offense");
      defenseRow.appendChild(div);
    });
  }

  // clear any previous defense highlight
  document.querySelectorAll("#blockedRowOffense .player").forEach(b => b.classList.remove("selected-defense"));
  currentDefense = null;

  showScreen("BlockedScreenOffense");
}

function showBlockedDefense() {
  currentDefenseResult = "blocked";

  const sequenceKey = defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) {
    alert("Select at least two opponent offense players before logging a result.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return;

  // Build defender row (our players stopping the shot)
  const defenseRow = document.getElementById("blockedRowDefense");
  if (defenseRow) {
    defenseRow.innerHTML = "";
    defensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "defense", "defense");
      defenseRow.appendChild(div);
    });
  }

  // clear any previous defense highlight
  document.querySelectorAll("#blockedRowDefense .player").forEach(b =>
    b.classList.remove("selected-defense")
  );
  currentDefense = null;

  showScreen("BlockedScreenDefense");
}


function showInterceptedOffense() {
  currentOffenseResult = "intercepted";

  const sequenceKey = playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) {
    alert("Select at least two offense players before logging a result.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return;

  currentSequenceKey = sequenceKey;
  currentPlayName = playName;

  // Build defender row
  const defenseRow = document.getElementById("interceptedRowOffense");
  if (defenseRow) {
    defenseRow.innerHTML = "";
    defensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "defense", "offense");
      defenseRow.appendChild(div);
    });
  }

  // clear any previous defense highlight
  document.querySelectorAll("#interceptedRowOffense .player").forEach(b => b.classList.remove("selected-defense"));
  currentDefense = null;

  showScreen("InterceptedScreenOffense");
}

function showInterceptedDefense() {
  currentDefenseResult = "intercepted";

  const sequenceKey = defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) {
    alert("Select at least two opponent players before logging a result.");
    return;
  }

  const playName = namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return;

  currentDefenseSequenceKey = sequenceKey;
  currentDefensePlayName = playName;

  // Build our defense row (to pick the interceptor)
  const defenseRow = document.getElementById("interceptedRowDefense");
  if (defenseRow) {
    defenseRow.innerHTML = "";
    defensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "defense", "defense");
      defenseRow.appendChild(div);
    });
  }

  // clear any previous defense highlight
  document.querySelectorAll("#interceptedRowDefense .player").forEach(b => b.classList.remove("selected-defense"));
  currentDefense = null;

  showScreen("InterceptedScreenDefense");
}




function undoLastOffense() {
  if (playerSequence.length > 1) {
    playerSequence.pop();
    updateOffenseLog();
  }
}

function undoLastDefense() {
  if (defenseSequence.length > 1) {
    defenseSequence.pop();
    updateDefenseLog();
  }
}

// --- Start Defense Corner ---
function startDefense() {
  defenseSequence.length = 0;
  defenseSequence.push("I"); // opponent injector starts
  updateDefenseLog();

  // Opponent offense row
  const offenseRow = document.getElementById("offenseRowDefense");
  if (offenseRow) {
    offenseRow.innerHTML = "";
    offensePositions.forEach(pos => {
      const div = document.createElement("div");
      div.className = "player";
      div.textContent = pos;
      div.onclick = () => selectPlayer(pos, "offense", "defense");
      offenseRow.appendChild(div);
    });
  }

  showScreen("defenseScreen");
}

function selectPlayer(position, side, screenType = "offense") {
  // ----- OUR OFFENSIVE CORNER -----
  if (screenType === "offense") {
    if (side === "offense") {
      // Build only the offense sequence
      playerSequence.push(position);
      updateOffenseLog();
      return;
    }

    if (side === "defense") {
      // Clicking a defender on Blocked/Intercepted screens -> just select
      const defenseButtons = document.querySelectorAll(
        "#interceptedRowOffense .player, #blockedRowOffense .player"
      );
      let clickedBtn = null;
      defenseButtons.forEach(btn => {
        if (btn.textContent === position) clickedBtn = btn;
      });
      if (!clickedBtn) return;

      const isSame = currentDefense === position;
      defenseButtons.forEach(btn => btn.classList.remove("selected-defense"));
      currentDefense = isSame ? null : position;
      if (!isSame) clickedBtn.classList.add("selected-defense");
      return;
    }
  }

  // ----- OPPONENT'S OFFENSIVE CORNER (our defense) -----
  if (screenType === "defense") {
    if (side === "offense") {
      defenseSequence.push(position);
      updateDefenseLog();
      return;
    }

    if (side === "defense") {
      const defenseButtons = document.querySelectorAll(
        "#interceptedRowDefense .player, #blockedRowDefense .player"
      );
      let clickedBtn = null;
      defenseButtons.forEach(btn => {
        if (btn.textContent === position) clickedBtn = btn;
      });
      if (!clickedBtn) return;

      const isSame = currentDefense === position;
      defenseButtons.forEach(btn => btn.classList.remove("selected-defense"));
      currentDefense = isSame ? null : position;
      if (!isSame) clickedBtn.classList.add("selected-defense");
      return;
    }
  }
}



function endOffenseCorner(isRecorner = false) {
  const sequenceKey = currentSequenceKey || playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) { alert("No sequence recorded yet."); return; }
  const playName = currentPlayName || namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return;

  const shooter = playerSequence[playerSequence.length - 1] || "Unknown";

  if ((currentOffenseResult === "blocked" || currentOffenseResult === "intercepted") && !currentDefense) {
    alert("Please select a defender before ending the corner.");
    return;
  }
  if ((currentOffenseResult === "shot" || currentOffenseResult === "blocked" || currentOffenseResult === "goal") && !currentShotType) {
    alert("Please select a shot type before ending the corner.");
    return;
  }

  const stopper = (currentOffenseResult === "blocked" || currentOffenseResult === "intercepted") ? currentDefense : "None";
  const shotType = (currentOffenseResult === "shot" || currentOffenseResult === "blocked" || currentOffenseResult === "goal")
    ? (currentShotType || "Unknown") : null;

  // Normalize result
  let result = "No Shot";
  if (currentOffenseResult === "goal") result = "Goal";
  else if (currentOffenseResult === "blocked") result = "Blocked";
  else if (currentOffenseResult === "intercepted") result = "Intercepted";
  else if (currentOffenseResult === "shot") result = "Shot";

  offensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter,
    stopper,
    shotType,
    isRecorner: !!isRecorner,
    result
  });

  lastCornerType = "offense";

  // Reset state
  currentOffenseResult = null;
  currentShotType = "";
  currentDefense = null;
  currentSequenceKey = null;
  currentPlayName = null;
  playerSequence.length = 0;
  playerSequence.push("I");
  updateOffenseLog();

  if (isRecorner) {
    alert(`Recorner logged: ${playName}`);
    startOffense();
  } else {
    alert(`Corner logged: ${playName}`);
    showScreen("mainMenu");
  }
}

function endDefenseCorner(isRecorner = false) {
  const sequenceKey = currentDefenseSequenceKey || defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) { alert("No opponent sequence recorded yet."); return; }

  let playName = currentDefensePlayName || namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return;
  currentDefensePlayName = playName;
  currentDefenseSequenceKey = sequenceKey;

  const shooter = defenseSequence[defenseSequence.length - 1] || "Unknown";

  if ((currentDefenseResult === "blocked" || currentDefenseResult === "intercepted") && !currentDefense) {
    alert("Please select our defender before ending the corner."); return;
  }
  if ((currentDefenseResult === "shot" || currentDefenseResult === "blocked" || currentDefenseResult === "goal") && !currentDefenseShotType) {
    alert("Please select a shot type before ending the corner."); return;
  }

  const stopper = (currentDefenseResult === "blocked" || currentDefenseResult === "intercepted") ? currentDefense : "None";
  const shotType = (currentDefenseResult === "shot" || currentDefenseResult === "blocked" || currentDefenseResult === "goal")
    ? (currentDefenseShotType || "Unknown") : null;

  let result = "No Shot";
  if (currentDefenseResult === "goal") result = "Goal";
  else if (currentDefenseResult === "blocked") result = "Blocked";
  else if (currentDefenseResult === "intercepted") result = "Intercepted";
  else if (currentDefenseResult === "shot") result = "Shot";

  defensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter,
    stopper,
    shotType,
    isRecorner: !!isRecorner,
    result
  });

  lastCornerType = "defense";

  // Reset state
  currentDefenseResult = null;
  currentDefenseShotType = "";
  currentDefense = null;
  currentDefenseSequenceKey = null;
  currentDefensePlayName = null;
  defenseSequence.length = 0;
  defenseSequence.push("I");
  updateDefenseLog();

  if (isRecorner) {
    alert(`Opponent recorner logged: ${playName}`);
    startDefense();
  } else {
    alert(`Opponent corner logged: ${playName}`);
    showScreen("mainMenu");
  }
}




// --- Recorner for Offense ---
function offenseRecorner() {
  const sequenceKey = playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) {
    alert("No offensive sequence recorded to mark as recorner.");
    return;
  }

  let playName = namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return;

  offensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter: playerSequence[playerSequence.length - 1] || "Unknown",
    stopper: currentDefense || "Unknown",
    shotType: currentShotType || "Unknown",
    isRecorner: true
  });

  lastCornerType = "offense";
  alert(`Recorner logged: ${playName}`);

  // reset and return to offense screen for new corner
  playerSequence.length = 0;
  playerSequence.push("I");
  updateOffenseLog();
  showScreen("offenseScreen");
}


// --- Recorner for Defense ---
function defenseRecorner() {
  const sequenceKey = defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) {
    alert("No opponent sequence recorded to mark as recorner.");
    return;
  }

  let playName = namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return;

  defensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter: defenseSequence[defenseSequence.length - 1] || "Unknown",
    stopper: currentDefense || "Unknown",
    shotType: "Unknown",
    isRecorner: true
  });

  lastCornerType = "defense";
  alert(`Opponent recorner logged: ${playName}`);

  // reset and return to defense screen for new corner
  defenseSequence.length = 0;
  defenseSequence.push("I");
  updateDefenseLog();
  showScreen("defenseScreen");
}


// --- Helpers to show logs in <p> tags ---
function updateOffenseLogDisplay() {
  const logElement = document.getElementById("offenseLog");
  logElement.innerText = "Play: " + offenseLog.map(p => p.type).join(", ");
}

function updateDefenseLogDisplay() {
  const logElement = document.getElementById("defenseLog");
  logElement.innerText = "Play: " + defenseLog.map(p => p.type).join(", ");
}

function defenseRecorner() {
  endDefenseCorner(true);
}

function recordGoal() {
  // (Kept for compatibility if you still call it somewhere)
  const shooter = playerSequence[playerSequence.length - 1];
  if (!shooter) {
    alert("No shooter detected in play sequence.");
    return;
  }

  const scorer = prompt("Who scored the goal?", shooter);
  if (!scorer) return;

  const shotType = prompt("Enter shot type (Flick, Hit, Sweep, etc.):");
  if (!shotType) return;

  const quarter = prompt("Enter quarter (1-4):");
  if (!quarter || isNaN(quarter) || quarter < 1 || quarter > 4) return;

  const goalTime = prompt("Enter time of goal (MM:SS):");
  if (!goalTime) return;

  offensiveCorners.push({
    sequence: playerSequence.join("→"),
    playName: knownPlays[playerSequence.join("→")] || "Unnamed Play",
    shooter,
    scorer,
    shotType,
    quarter,
    goalTime,
    result: "Goal"
  });

  alert(`${scorer} scored with a ${shotType} in Q${quarter} at ${goalTime}.`);
  lastCornerType = "offense";
}

function submitGoalOffense() {
  const scorer = document.getElementById("scorerName").value;
  const quarter = document.getElementById("quarter").value;
  const time = document.getElementById("goalTime").value;
  if (!scorer || !quarter || !time) { alert("Please fill out all goal details."); return; }

  // Ensure we have sequence + play name
  const homeTeam = document.getElementById("homeTeam").value || "Home";
  const awayTeam = document.getElementById("awayTeam").value || "Away";
  const sequenceKey = currentSequenceKey || playerSequence.join("→");
  if (!sequenceKey || playerSequence.length < 2) { alert("No sequence recorded yet."); return; }
  const playName = currentPlayName || namePlayIfUnknown(sequenceKey, knownPlays, "offensive");
  if (!playName) return;

  const shooter = playerSequence[playerSequence.length - 1] || "Unknown";

  // 1) Corner row with result=Goal
  offensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter,
    stopper: "None",
    shotType: currentShotType || "Unknown",
    isRecorner: false,
    result: "Goal"
  });

  // 2) Goals sheet row
  goals.push({
    team: homeTeam,
    opponent: awayTeam,
    scorer,
    quarter,
    time,
    playName,
    sequence: sequenceKey,
    shotType: currentShotType || "Unknown",
    shooter
  });

  // Reset UI/state
  lastCornerType = null;
  currentOffenseResult = null;
  currentShotType = "";
  currentSequenceKey = null;
  currentPlayName = null;
  playerSequence.length = 0;
  playerSequence.push("I");
  updateOffenseLog();

  backToMenu();
}

function submitGoalDefense() {
  const scorer = document.getElementById("scorerNameDefense").value;
  const quarter = document.getElementById("quarterDefense").value;
  const time = document.getElementById("goalTimeDefense").value;
  if (!scorer || !quarter || !time) { alert("Please fill out all goal details for defense."); return; }

  const homeTeam = document.getElementById("homeTeam").value || "Home";
  const awayTeam = document.getElementById("awayTeam").value || "Away";

  const sequenceKey = currentDefenseSequenceKey || defenseSequence.join("→");
  if (!sequenceKey || defenseSequence.length < 2) { alert("No opponent sequence recorded yet."); return; }
  const playName = currentDefensePlayName || namePlayIfUnknown(sequenceKey, knownPlays, "opponent");
  if (!playName) return;

  const shooter = defenseSequence[defenseSequence.length - 1] || "Unknown";

  // 1) Corner row with result=Goal
  defensiveCorners.push({
    sequence: sequenceKey,
    playName,
    shooter,
    stopper: "None",
    shotType: currentDefenseShotType || "Unknown",
    isRecorner: false,
    result: "Goal"
  });

  // 2) Goals sheet row
  goals.push({
    team: awayTeam,          // opponent scored
    opponent: homeTeam,
    scorer,
    quarter,
    time,
    playName,
    sequence: sequenceKey,
    shotType: currentDefenseShotType || "Unknown",
    shooter
  });

  // Reset
  lastCornerType = null;
  currentDefenseResult = null;
  currentDefenseShotType = "";
  currentDefenseSequenceKey = null;
  currentDefensePlayName = null;
  defenseSequence.length = 0;
  defenseSequence.push("I");
  updateDefenseLog();

  backToMenu();
}



function confirmEnd() {
  const homeTeam = document.getElementById("homeTeam").value || "Home";
  const awayTeam = document.getElementById("awayTeam").value || "Away";
  const date = document.getElementById("gameDate").value || "YYYY-MM-DD";

  const headers = [
    "offense team",
    "defense team",
    "play name",
    "play string",
    "play result",
    "shooter",
    "shot type",
    "stopper",
    "recorner"
  ];

  // Offense sheet
  let offenseSheet = [headers];
  offensiveCorners.forEach(c => {
    offenseSheet.push([
      homeTeam,
      awayTeam,
      c.playName || "",
      c.sequence || "",
      c.result || "",
      c.shooter || "",
      c.shotType || "",
      c.stopper || "",
      c.isRecorner ? "true" : "false"
    ]);
  });

  // Defense sheet
  let defenseSheet = [headers];
  defensiveCorners.forEach(c => {
    defenseSheet.push([
      awayTeam,
      homeTeam,
      c.playName || "",
      c.sequence || "",
      c.result || "",
      c.shooter || "",
      c.shotType || "",
      c.stopper || "",
      c.isRecorner ? "true" : "false"
    ]);
  });

  // Goals sheet
  const goalHeaders = [
    "team scored",
    "opponent",
    "scorer",
    "quarter",
    "time",
    "play name",
    "play string",
    "shot type",
    "shooter"
  ];
  let goalsSheet = [goalHeaders];
  goals.forEach(g => {
    goalsSheet.push([
      g.team || "",
      g.opponent || "",
      g.scorer || "",
      g.quarter || "",
      g.time || "",
      g.playName || "",
      g.sequence || "",
      g.shotType || "",
      g.shooter || ""
    ]);
  });

  // Totals
  function countGoals(arr) {
    return arr.filter(x => (x.result || "").toLowerCase() === "goal").length;
  }
  const totalOffenseCorners = offensiveCorners.length;
  const totalDefenseCorners = defensiveCorners.length;
  const totalOffenseGoals = countGoals(offensiveCorners);
  const totalDefenseGoals = countGoals(defensiveCorners);
  const offenseGoalPct = totalOffenseCorners ? (100 * totalOffenseGoals / totalOffenseCorners).toFixed(1) + "%" : "0%";
  const defenseGoalPct = totalDefenseCorners ? (100 * totalDefenseGoals / totalDefenseCorners).toFixed(1) + "%" : "0%";
  const totalCorners = totalOffenseCorners + totalDefenseCorners;
  const totalGoals = totalOffenseGoals + totalDefenseGoals;

  function topN(array, key, n = 5) {
    const freq = {};
    array.forEach(item => {
      const val = item[key] || "Unknown";
      freq[val] = (freq[val] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => `${name}: ${count}`);
  }

  let totalsSheet = [
    ["total corners", totalCorners],
    ["total goals", totalGoals],
    ["total offense corners", totalOffenseCorners],
    ["offense goal %", offenseGoalPct],
    ["total defense corners", totalDefenseCorners],
    ["defense goal %", defenseGoalPct],
    [],
    ["top 5 plays offense"].concat(topN(offensiveCorners, "playName", 5)),
    ["top 5 plays defense"].concat(topN(defensiveCorners, "playName", 5)),
    ["top 5 shooters offense"].concat(topN(offensiveCorners, "shooter", 5)),
    ["top 5 shooters defense"].concat(topN(defensiveCorners, "shooter", 5))
  ];

  // Build workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(offenseSheet), "Offense");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(defenseSheet), "Defense");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(goalsSheet),   "Goals");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(totalsSheet),  "Totals");

  const safeHome = homeTeam.replace(/\s+/g, "_");
  const safeAway = awayTeam.replace(/\s+/g, "_");
  const filename = `${date}_${safeAway}@${safeHome}.xlsx`;

  XLSX.writeFile(wb, filename);
  alert(`Game Ended. Scouting Excel file downloaded as ${filename}.`);
  location.reload();
}




function openLiveStats() {
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Live Stats</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          h2 { color: #b00; }
        </style>
      </head>
      <body>
        <h2>Live Stats</h2>
        <p><strong>Offensive Corners Taken:</strong> ${offensiveCorners.length}</p>
        <p><strong>Plays Run:</strong> ${[...new Set(offensiveCorners.map(c => c.playName))].join(", ")}</p>
        <p><strong>Opponent Plays Seen:</strong> ${[...new Set(defensiveCorners.map(d => d.playName))].join(", ")}</p>
        <p><strong>Goals Logged:</strong> ${goals.length}</p>
      </body>
    </html>
  `);
}

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const stage = document.querySelector(".stage");
const startScreen = document.querySelector("#startScreen");
const finalScreen = document.querySelector("#finalScreen");
const startBtn = document.querySelector("#startBtn");
const replayBtn = document.querySelector("#replayBtn");
const chaosFill = document.querySelector("#chaosFill");
const chaosValue = document.querySelector("#chaosValue");
const stepDots = [...document.querySelectorAll(".steps span")];
const taskItems = [...document.querySelectorAll("#taskList li")];
const dialogueKicker = document.querySelector("#dialogueKicker");
const dialogueTitle = document.querySelector("#dialogueTitle");
const dialogueText = document.querySelector("#dialogueText");
const actionButton = document.querySelector('[data-control="action"]');

const VIEW_W = 1280;
const VIEW_H = 720;
const WORLD_W = 1850;
const FLOOR_Y = 565;

const input = {
  left: false,
  right: false,
};

const tasks = [
  {
    id: "door",
    x: 155,
    name: "Kapı",
    title: "Kapımı kimse açmıyor.",
    near: "Anahtar avucumda. İçeriden gelen bir 'hoş geldin' sesi yok.",
    after:
      "Kapıyı kendim açıyorum. Kilit dönüyor, ama evin sessizliği daha ağır açılıyor. Keşke annem yanımda olsaydı.",
    chaos: 22,
  },
  {
    id: "kitchen",
    x: 575,
    name: "Mutfak",
    title: "Yemek sıcak değil, telaş sıcak.",
    near: "Ocak yanıyor, tencere bekliyor. Nasıl bu kadar zor olabilir?",
    after:
      "Tencere taşıyor, tost yanıyor, masa soğuk kalıyor. Bir tabak yemeğin aslında ne kadar sevgi taşıdığını anlıyorum.",
    chaos: 25,
  },
  {
    id: "laundry",
    x: 1010,
    name: "Çamaşır",
    title: "Makine bile benden emin değil.",
    near: "Düğmeler yanıp sönüyor. Beyazlar ve renkliler birbirine bakıyor.",
    after:
      "Beyazlar renklilere karışıyor, deterjan köpük olup kaçıyor. Keşke annem bir kere 'şunu böyle yap' dese.",
    chaos: 25,
  },
  {
    id: "room",
    x: 1450,
    name: "Oda",
    title: "Dağınıklık susmuyor.",
    near: "Yatak, kitaplar ve sandalyedeki kıyafetler sanki bana kızgın.",
    after:
      "Oda toparlanmıyor, aksine her şey biraz daha dağılıyor. Birinin 'hadi toparla' deyişini bile özlüyorum.",
    chaos: 28,
  },
];

const state = {
  mode: "start",
  x: 85,
  y: FLOOR_Y,
  dir: 1,
  camera: 0,
  chaos: 0,
  time: 0,
  runTime: 0,
  glitch: 0,
  messageHold: 0,
  lastPanelKey: "",
  endingTimer: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, amount) {
  const ah = parseInt(a.replace("#", ""), 16);
  const bh = parseInt(b.replace("#", ""), 16);
  const ar = (ah >> 16) & 255;
  const ag = (ah >> 8) & 255;
  const ab = ah & 255;
  const br = (bh >> 16) & 255;
  const bg = (bh >> 8) & 255;
  const bb = bh & 255;
  const rr = Math.round(ar + (br - ar) * amount);
  const rg = Math.round(ag + (bg - ag) * amount);
  const rb = Math.round(ab + (bb - ab) * amount);
  return `rgb(${rr}, ${rg}, ${rb})`;
}

function setPanel(kicker, title, text, hold = 0, key = `${kicker}:${title}`) {
  if (state.lastPanelKey === key && hold === 0) return;
  dialogueKicker.textContent = kicker;
  dialogueTitle.textContent = title;
  dialogueText.textContent = text;
  state.messageHold = hold;
  state.lastPanelKey = key;
}

function resetGame() {
  tasks.forEach((task) => {
    task.done = false;
  });
  Object.assign(state, {
    mode: "play",
    x: 85,
    y: FLOOR_Y,
    dir: 1,
    camera: 0,
    chaos: 0,
    time: 0,
    runTime: 0,
    glitch: 0,
    messageHold: 0,
    lastPanelKey: "",
    endingTimer: 0,
  });
  updateHud();
  setPanel(
    "Ev",
    "Eve geldim.",
    "Anahtar cebimde ama evin içindeki sessizlik kapının arkasında bekliyor.",
    2,
    "intro",
  );
}

function startGame() {
  startScreen.classList.add("hidden");
  finalScreen.classList.add("hidden");
  resetGame();
  canvas.focus();
}

function showFinal() {
  state.mode = "final";
  finalScreen.classList.remove("hidden");
}

function updateHud() {
  const rounded = Math.round(state.chaos);
  chaosFill.style.width = `${rounded}%`;
  chaosValue.textContent = `${rounded}%`;
  tasks.forEach((task, index) => {
    stepDots[index].classList.toggle("done", Boolean(task.done));
    taskItems[index]?.classList.toggle("done", Boolean(task.done));
  });
}

function nearbyTask(range = 86, includeDone = false) {
  let found = null;
  let best = Infinity;

  for (const task of tasks) {
    if (task.done && !includeDone) continue;
    const distance = Math.abs(state.x - task.x);
    if (distance < range && distance < best) {
      found = task;
      best = distance;
    }
  }

  return found;
}

function pulseGlitch() {
  state.glitch = 0.42;
  stage.classList.remove("glitch");
  window.setTimeout(() => stage.classList.add("glitch"), 0);
  window.setTimeout(() => stage.classList.remove("glitch"), 380);
}

function doAction() {
  if (state.mode !== "play") return;
  const task = nearbyTask();

  if (!task) {
    setPanel(
      "Ev",
      "Elim havada kalıyor.",
      "Yapacak bir şey bulamıyorum. Sessizlik yine benden hızlı davranıyor.",
      1.8,
      "empty-action",
    );
    return;
  }

  task.done = true;
  state.chaos = clamp(state.chaos + task.chaos, 0, 100);
  setPanel(task.name, task.title, task.after, 3.8, `done:${task.id}`);
  pulseGlitch();
  updateHud();

  if (tasks.every((item) => item.done)) {
    state.mode = "ending";
    state.endingTimer = 2.4;
    window.setTimeout(() => {
      setPanel(
        "Kalbim",
        "Bunu böyle bırakmak istemiyorum.",
        "Çünkü bu evin ışığı, düzeni ve sıcaklığı bir kişide toplanıyor.",
        2.4,
        "ending",
      );
    }, 520);
  }
}

function handleKeyDown(event) {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    input.left = true;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    input.right = true;
  }
  if (event.code === "Space") {
    doAction();
  }
  if (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.code === "Space"
  ) {
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    input.left = false;
  }
  if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    input.right = false;
  }
}

function setupMobileControls() {
  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;

    const setControl = (active) => {
      button.classList.toggle("active", active);
      if (control === "left") input.left = active;
      if (control === "right") input.right = active;
      if (control === "action" && active) {
        doAction();
        window.setTimeout(() => button.classList.remove("active"), 160);
      }
    };

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setControl(true);
    });
    button.addEventListener("pointerup", () => setControl(false));
    button.addEventListener("pointercancel", () => setControl(false));
    button.addEventListener("pointerleave", () => setControl(false));
    button.addEventListener("lostpointercapture", () => setControl(false));
  });
}

function stopMovement() {
  input.left = false;
  input.right = false;
  document.querySelectorAll("[data-control]").forEach((button) => {
    button.classList.remove("active");
  });
}

function update(dt) {
  state.time += dt;

  if (state.mode === "play" || state.mode === "ending") {
    const direction = Number(input.right) - Number(input.left);
    const speed = direction === 0 ? 0 : 330;

    state.x = clamp(state.x + direction * speed * dt, 55, WORLD_W - 65);
    state.runTime = direction === 0 ? 0 : state.runTime + dt;
    if (direction !== 0) state.dir = direction;

    const targetCamera = clamp(state.x - VIEW_W * 0.44, 0, WORLD_W - VIEW_W);
    state.camera += (targetCamera - state.camera) * Math.min(1, dt * 6);

    state.glitch = Math.max(0, state.glitch - dt);

    if (state.mode === "ending") {
      state.endingTimer -= dt;
      if (state.endingTimer <= 0) showFinal();
    }

    updateDialogue(dt);
  }
}

function updateDialogue(dt) {
  if (state.messageHold > 0) {
    state.messageHold -= dt;
    return;
  }

  const task = nearbyTask(112);
  if (task) {
    actionButton?.classList.add("active");
    setPanel(task.name, task.title, task.near, 0, `near:${task.id}`);
    return;
  }

  actionButton?.classList.remove("active");

  const completeCount = tasks.filter((taskItem) => taskItem.done).length;
  if (completeCount === 0) {
    setPanel(
      "Ev",
      "Evin içinde yürüyorum.",
      "Her oda aynı duruyor, ama sıcaklığı sanki biri yanında götürmüş.",
      0,
      "walk-0",
    );
  } else if (completeCount < tasks.length) {
    setPanel(
      "Ev",
      "Bir şeyler eksik kalıyor.",
      "Ben denedikçe ev biraz daha dağılıyor. İçimden hep aynı cümle geçiyor.",
      0,
      "walk-mid",
    );
  }
}

function worldX(x) {
  return Math.round(x - state.camera);
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();

  if (state.glitch > 0) {
    const shake = state.glitch * 13;
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  drawBackground();
  drawTaskEffects();
  drawObjects();
  drawPlayer();
  drawPrompts();
  drawForeground();

  if (state.glitch > 0) drawGlitch();

  ctx.restore();
}

function drawBackground() {
  const chaos = state.chaos / 100;
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, mix("#22333b", "#101010", chaos));
  sky.addColorStop(1, mix("#415a54", "#1b171d", chaos));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const rooms = [
    { x: 0, w: 420, color: "#eee7d8", label: "ANTRE" },
    { x: 420, w: 430, color: "#f4eadf", label: "MUTFAK" },
    { x: 850, w: 420, color: "#e9e3d7", label: "BANYO" },
    { x: 1270, w: 580, color: "#f7efe2", label: "ODA" },
  ];

  for (const room of rooms) {
    const x = worldX(room.x);
    ctx.fillStyle = mix(room.color, "#242126", chaos * 0.82);
    ctx.fillRect(x, 70, room.w, FLOOR_Y - 70);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + chaos * 0.17})`;
    ctx.fillRect(x, 70, room.w, 18);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 - chaos * 0.12})`;
    ctx.font = "800 18px Inter, sans-serif";
    ctx.fillText(room.label, x + 24, 114);

    ctx.strokeStyle = `rgba(20, 20, 20, ${0.22 + chaos * 0.28})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }

  drawWindows(chaos);
  drawDecor(chaos);

  ctx.fillStyle = mix("#706f5f", "#2a2928", chaos * 0.75);
  ctx.fillRect(0, FLOOR_Y, VIEW_W, VIEW_H - FLOOR_Y);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 - chaos * 0.04})`;
  ctx.lineWidth = 2;
  for (let line = -80; line < WORLD_W; line += 58) {
    const x = worldX(line);
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_Y);
    ctx.lineTo(x + 105, VIEW_H);
    ctx.stroke();
  }
}

function drawWindows(chaos) {
  const windows = [
    { x: 270, y: 155 },
    { x: 708, y: 142 },
    { x: 1180, y: 165 },
    { x: 1640, y: 145 },
  ];

  for (const windowItem of windows) {
    const x = worldX(windowItem.x);
    ctx.fillStyle = mix("#a8dadc", "#343236", chaos);
    ctx.fillRect(x, windowItem.y, 112, 90);
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 5;
    ctx.strokeRect(x, windowItem.y, 112, 90);
    ctx.beginPath();
    ctx.moveTo(x + 56, windowItem.y);
    ctx.lineTo(x + 56, windowItem.y + 90);
    ctx.moveTo(x, windowItem.y + 45);
    ctx.lineTo(x + 112, windowItem.y + 45);
    ctx.stroke();
  }
}

function drawDecor(chaos) {
  drawFullLengthMirror(1128, 300, chaos);
  drawVavPainting(1528, 174, chaos);
}

function drawFullLengthMirror(x, y, chaos) {
  const sx = worldX(x);
  ctx.fillStyle = mix("#6d513f", "#302a27", chaos * 0.7);
  roundRect(sx, y, 74, 224, 8);
  ctx.fill();
  const mirror = ctx.createLinearGradient(sx + 10, y + 12, sx + 64, y + 210);
  mirror.addColorStop(0, mix("#dfeff0", "#4f5658", chaos));
  mirror.addColorStop(1, mix("#9ec5c9", "#24282b", chaos));
  ctx.fillStyle = mirror;
  roundRect(sx + 10, y + 12, 54, 200, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + 20, y + 42);
  ctx.lineTo(sx + 50, y + 22);
  ctx.moveTo(sx + 20, y + 76);
  ctx.lineTo(sx + 55, y + 48);
  ctx.stroke();
}

function drawVavPainting(x, y, chaos) {
  const sx = worldX(x);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(sx + 10, y + 10, 112, 145);
  ctx.fillStyle = mix("#efe2b9", "#3c3429", chaos * 0.7);
  roundRect(sx, y, 112, 145, 4);
  ctx.fill();
  ctx.strokeStyle = mix("#b7a26d", "#2a2420", chaos * 0.6);
  ctx.lineWidth = 5;
  ctx.stroke();

  const vav = ctx.createLinearGradient(sx + 28, y + 25, sx + 82, y + 124);
  vav.addColorStop(0, "#d8232a");
  vav.addColorStop(0.48, "#5a1b12");
  vav.addColorStop(1, "#d1a236");
  ctx.fillStyle = vav;
  ctx.font = "900 120px Georgia, serif";
  ctx.fillText("و", sx + 14, y + 112);
}

function drawObjects() {
  drawDoor(tasks[0]);
  drawKitchen(tasks[1]);
  drawLaundry(tasks[2]);
  drawRoom(tasks[3]);
}

function drawDoor(task) {
  const x = worldX(92);
  ctx.fillStyle = task.done ? "#332820" : "#65432e";
  ctx.fillRect(x, 230, 126, 335);
  ctx.fillStyle = task.done ? "rgba(0,0,0,0.5)" : "#8d6042";
  ctx.fillRect(x + 18, 253, 90, 287);
  ctx.fillStyle = "rgba(42, 25, 15, 0.62)";
  roundRect(x + 25, 270, 76, 26, 6);
  ctx.fill();
  ctx.fillStyle = "#f4d35e";
  ctx.font = "900 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Yusuf ♥ Rukiye", x + 63, 287, 68);
  ctx.textAlign = "start";
  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.arc(x + 96, 398, 8, 0, Math.PI * 2);
  ctx.fill();
  if (task.done) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + 102, 242, 34, 323);
  }
}

function drawKitchen(task) {
  const x = worldX(500);
  ctx.fillStyle = "#6c5a45";
  ctx.fillRect(x - 72, 426, 306, 139);
  ctx.fillStyle = "#eadfce";
  ctx.fillRect(x - 52, 386, 118, 80);
  ctx.fillRect(x + 92, 386, 118, 80);
  ctx.fillStyle = "#2b2f31";
  ctx.fillRect(x - 64, 396, 290, 30);
  ctx.fillStyle = "#111416";
  ctx.fillRect(x - 42, 406, 72, 12);
  ctx.fillRect(x + 48, 406, 72, 12);
  ctx.fillRect(x + 136, 406, 72, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x - 6, 412, 22, 0, Math.PI * 2);
  ctx.arc(x + 84, 412, 22, 0, Math.PI * 2);
  ctx.arc(x + 172, 412, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ded0ba";
  ctx.fillRect(x - 82, 356, 326, 18);
  drawPlateAndBowl(x - 12, 343);
  drawPot(x + 82, 395, task.done);
}

function drawPlateAndBowl(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 16, 48, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 88, y + 18, 38, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7f3ea";
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 8, 50, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cfc2ae";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 8, 34, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#d8efe8";
  ctx.beginPath();
  ctx.ellipse(x + 88, y + 10, 38, 17, 0, 0, Math.PI);
  ctx.lineTo(x + 50, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8fb9ad";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(x + 88, y + 10, 38, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#c48b68";
  ctx.beginPath();
  ctx.ellipse(x + 88, y + 9, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPot(x, y, burned) {
  ctx.fillStyle = "#36454f";
  ctx.fillRect(x - 40, y - 22, 80, 34);
  ctx.fillStyle = "#25313a";
  ctx.fillRect(x - 34, y - 35, 68, 14);
  ctx.fillStyle = "#f4d35e";
  ctx.fillRect(x - 50, y - 16, 10, 8);
  ctx.fillRect(x + 40, y - 16, 10, 8);

  if (burned) {
    ctx.strokeStyle = "rgba(40, 40, 40, 0.78)";
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 28 + i * 18, y - 45);
      ctx.bezierCurveTo(
        x - 40 + i * 16,
        y - 78,
        x + 4 + i * 12,
        y - 88,
        x - 12 + i * 18,
        y - 124,
      );
      ctx.stroke();
    }
  }
}

function drawLaundry(task) {
  const x = worldX(940);
  ctx.fillStyle = "#283f54";
  ctx.fillRect(x, 348, 190, 217);
  ctx.fillStyle = "#f6fff8";
  ctx.fillRect(x + 18, 368, 154, 174);
  ctx.fillStyle = "#2a9d8f";
  ctx.beginPath();
  ctx.arc(x + 95, 462, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b3b42";
  ctx.beginPath();
  ctx.arc(x + 95, 462, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4d35e";
  ctx.fillRect(x + 28, 382, 42, 12);
  ctx.fillStyle = "#e85d75";
  ctx.beginPath();
  ctx.arc(x + 142, 388, 9, 0, Math.PI * 2);
  ctx.fill();

  if (task.done) {
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.arc(
        x + 6 + i * 15,
        542 + Math.sin(state.time * 5 + i) * 8,
        12,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
}

function drawRoom(task) {
  const x = worldX(1330);
  ctx.fillStyle = "#7a6754";
  ctx.fillRect(x + 4, 428, 248, 96);
  ctx.fillStyle = "#f7fff7";
  roundRect(x + 28, 382, 82, 42, 10);
  ctx.fill();
  ctx.fillStyle = "#e3d4bd";
  ctx.fillRect(x + 20, 397, 214, 64);
  ctx.fillStyle = "rgba(255,255,255,0.46)";
  ctx.fillRect(x + 34, 405, 84, 16);
  ctx.fillStyle = "#b98073";
  ctx.fillRect(x + 16, 461, 226, 40);

  ctx.fillStyle = "#5b4938";
  ctx.fillRect(x + 286, 360, 132, 205);
  ctx.fillStyle = task.done ? "#2f2924" : "#76624c";
  ctx.fillRect(x + 301, 382, 48, 170);
  ctx.fillStyle = "#806b52";
  ctx.fillRect(x + 355, 382, 48, 170);
  ctx.strokeStyle = "rgba(35,25,18,0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 301, 382, 48, 170);
  ctx.strokeRect(x + 355, 382, 48, 170);
  ctx.fillStyle = "#d8c7af";
  ctx.fillRect(x + 302, 485, 100, 24);
  ctx.fillStyle = task.done ? "#3d332b" : "#c0aa8c";
  ctx.fillRect(x + 302, 512, 100, 26);
  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.arc(x + 352, 466, 5, 0, Math.PI * 2);
  ctx.arc(x + 356, 525, 4, 0, Math.PI * 2);
  ctx.fill();

  if (task.done) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(x + 344, FLOOR_Y - 4, 112, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(216,199,175,0.7)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + 322, 398);
    ctx.lineTo(x + 327, 512);
    ctx.moveTo(x + 338, 406);
    ctx.lineTo(x + 332, 512);
    ctx.stroke();
    drawTShirt(x + 300, FLOOR_Y - 30, "#e85d75", -0.08);
    drawPants(x + 374, FLOOR_Y - 28, "#2a9d8f", 0.08);
    drawSockPair(x + 446, FLOOR_Y - 28, "#f4d35e", -0.12);
    drawBook(x + 218, FLOOR_Y - 14, "#7bd88f", 0.06);
    drawBook(x + 262, FLOOR_Y - 13, "#b98073", -0.04);
    drawTiltedChair(x + 178, FLOOR_Y - 28);
    drawFallenHanger(x + 330, FLOOR_Y - 58);
  }
}

function drawTShirt(x, y, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-38, -8);
  ctx.lineTo(-18, -26);
  ctx.lineTo(-8, -16);
  ctx.lineTo(8, -16);
  ctx.lineTo(18, -26);
  ctx.lineTo(38, -8);
  ctx.lineTo(24, 8);
  ctx.lineTo(16, 2);
  ctx.lineTo(16, 30);
  ctx.lineTo(-16, 30);
  ctx.lineTo(-16, 2);
  ctx.lineTo(-24, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(20,20,20,0.28)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawPants(x, y, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundRect(-26, -30, 52, 22, 6);
  ctx.fill();
  ctx.fillRect(-24, -10, 20, 44);
  ctx.fillRect(6, -10, 20, 44);
  ctx.strokeStyle = "rgba(20,20,20,0.28)";
  ctx.lineWidth = 4;
  ctx.strokeRect(-24, -10, 20, 44);
  ctx.strokeRect(6, -10, 20, 44);
  ctx.restore();
}

function drawSockPair(x, y, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundRect(-26, -6, 44, 16, 7);
  ctx.fill();
  roundRect(2, 6, 18, 34, 7);
  ctx.fill();
  ctx.fillStyle = "#f7fff7";
  ctx.fillRect(-18, -6, 10, 16);
  ctx.fillRect(3, 11, 16, 8);
  ctx.restore();
}

function drawBook(x, y, color, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  roundRect(-32, -12, 64, 24, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.56)";
  ctx.fillRect(-24, -5, 38, 4);
  ctx.fillStyle = "rgba(20,20,20,0.2)";
  ctx.fillRect(20, -12, 6, 24);
  ctx.restore();
}

function drawTiltedChair(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.42);
  ctx.strokeStyle = "rgba(20,20,20,0.7)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.strokeRect(-24, -40, 48, 44);
  ctx.beginPath();
  ctx.moveTo(-18, 4);
  ctx.lineTo(-38, 54);
  ctx.moveTo(18, 4);
  ctx.lineTo(38, 54);
  ctx.moveTo(-18, -40);
  ctx.lineTo(-28, -74);
  ctx.moveTo(18, -40);
  ctx.lineTo(30, -72);
  ctx.stroke();
  ctx.fillStyle = "#f4d35e";
  ctx.fillRect(-20, -36, 40, 30);
  ctx.restore();
}

function drawFallenHanger(x, y) {
  ctx.strokeStyle = "rgba(20,20,20,0.54)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 36, y + 22);
  ctx.lineTo(x, y - 10);
  ctx.lineTo(x + 38, y + 20);
  ctx.moveTo(x, y - 10);
  ctx.quadraticCurveTo(x + 6, y - 34, x - 10, y - 32);
  ctx.stroke();
}

function drawTaskEffects() {
  if (tasks[0].done) drawDust(208, 542, 6);
  if (tasks[1].done) {
    drawScribble(665, 520, "#1a1a1a");
    drawFlame(620, 535);
  }
  if (tasks[2].done) drawSocks(1110, 560);
}

function drawDust(x, y, count) {
  ctx.fillStyle = "rgba(30, 30, 30, 0.32)";
  for (let i = 0; i < count; i += 1) {
    ctx.beginPath();
    ctx.arc(
      worldX(x + i * 16),
      y + Math.sin(state.time * 2 + i) * 5,
      10 + i,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawScribble(x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const px = worldX(x + i * 14);
    const py = y + Math.sin(i * 1.7 + state.time) * 18;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawFlame(x, y) {
  const sx = worldX(x);
  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.moveTo(sx, y);
  ctx.bezierCurveTo(sx - 28, y - 45, sx + 18, y - 58, sx + 4, y - 96);
  ctx.bezierCurveTo(sx + 52, y - 48, sx + 24, y - 28, sx, y);
  ctx.fill();
  ctx.fillStyle = "#e85d75";
  ctx.beginPath();
  ctx.moveTo(sx + 7, y);
  ctx.bezierCurveTo(sx - 10, y - 30, sx + 18, y - 42, sx + 12, y - 65);
  ctx.bezierCurveTo(sx + 40, y - 34, sx + 25, y - 18, sx + 7, y);
  ctx.fill();
}

function drawSocks(x, y) {
  const pairs = [
    ["#e85d75", -42, 0],
    ["#f4d35e", 0, 18],
    ["#7bd88f", 50, -8],
  ];
  for (const [color, offsetX, offsetY] of pairs) {
    ctx.fillStyle = color;
    ctx.fillRect(worldX(x + offsetX), y + offsetY, 40, 16);
    ctx.fillRect(worldX(x + offsetX + 25), y + offsetY + 9, 15, 26);
  }
}

function drawPlayer() {
  const x = worldX(state.x);
  const y = state.y;
  const walk = Math.sin(state.runTime * 12) * 9;
  const sway = Math.sin(state.runTime * 12) * 0.06;
  const chaos = state.chaos / 100;

  ctx.fillStyle = "rgba(0,0,0,0.27)";
  ctx.beginPath();
  ctx.ellipse(x, y + 15, 45, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(state.dir, 1);
  ctx.rotate(sway);

  ctx.strokeStyle = "#12171c";
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-15, -24);
  ctx.lineTo(-25 + walk * 0.5, 8);
  ctx.moveTo(15, -24);
  ctx.lineTo(25 - walk * 0.5, 8);
  ctx.stroke();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(-28 + walk * 0.5, 18, 18, 8, -0.18, 0, Math.PI * 2);
  ctx.ellipse(28 - walk * 0.5, 18, 18, 8, 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mix("#202832", "#303238", chaos * 0.7);
  roundRect(-36, -107, 72, 90, 13);
  ctx.fill();

  ctx.fillStyle = "#f7f3ea";
  ctx.beginPath();
  ctx.moveTo(-14, -102);
  ctx.lineTo(14, -102);
  ctx.lineTo(8, -62);
  ctx.lineTo(0, -52);
  ctx.lineTo(-8, -62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#151a20";
  ctx.beginPath();
  ctx.moveTo(-32, -101);
  ctx.lineTo(-4, -76);
  ctx.lineTo(-16, -62);
  ctx.lineTo(-36, -84);
  ctx.closePath();
  ctx.moveTo(32, -101);
  ctx.lineTo(4, -76);
  ctx.lineTo(16, -62);
  ctx.lineTo(36, -84);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#232b35";
  ctx.fillRect(-28, -18, 24, 42);
  ctx.fillRect(4, -18, 24, 42);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(0, -18);
  ctx.moveTo(-28, -18);
  ctx.lineTo(28, -18);
  ctx.stroke();

  ctx.fillStyle = "#10151b";
  ctx.beginPath();
  ctx.moveTo(-7, -101);
  ctx.lineTo(7, -101);
  ctx.lineTo(4, -80);
  ctx.lineTo(10, -56);
  ctx.lineTo(0, -47);
  ctx.lineTo(-10, -56);
  ctx.lineTo(-4, -80);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#171d24";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-36, -96);
  ctx.quadraticCurveTo(-62, -72, -54, -34 + walk * 0.18);
  ctx.moveTo(36, -96);
  ctx.quadraticCurveTo(62, -72, 54, -34 - walk * 0.18);
  ctx.stroke();

  drawHand(-54, -29 + walk * 0.18, -0.1);
  drawHand(54, -29 - walk * 0.18, 0.1);

  ctx.fillStyle = "#f0c7a5";
  ctx.beginPath();
  ctx.arc(0, -136, 31, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#161616";
  ctx.beginPath();
  ctx.ellipse(0, -159, 33, 16, 0, Math.PI, Math.PI * 2);
  ctx.rect(-29, -159, 58, 14);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.ellipse(-7, -155, 24, 7, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#161616";
  ctx.fillRect(-31, -146, 10, 14);
  ctx.fillRect(21, -146, 10, 14);

  ctx.strokeStyle = "#151515";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-18, -142);
  ctx.quadraticCurveTo(-10, -146, -3, -142);
  ctx.moveTo(6, -142);
  ctx.quadraticCurveTo(14, -146, 21, -142);
  ctx.stroke();

  ctx.fillStyle = "#151515";
  ctx.beginPath();
  ctx.arc(-10, -134, 3.2, 0, Math.PI * 2);
  ctx.arc(12, -134, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(90, 56, 42, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, -133);
  ctx.quadraticCurveTo(3, -128, -1, -126);
  ctx.stroke();

  ctx.strokeStyle = "#151515";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(2, -121, 11, 0.15, Math.PI - 0.08);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-25, -92);
  ctx.lineTo(-12, -72);
  ctx.moveTo(25, -92);
  ctx.lineTo(12, -72);
  ctx.stroke();

  ctx.restore();
}

function drawHand(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#f0c7a5";
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(0, -13, 10, -8);
  ctx.lineTo(13, 6);
  ctx.quadraticCurveTo(8, 14, -2, 13);
  ctx.quadraticCurveTo(-11, 12, -13, 5);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#f0c7a5";
  ctx.beginPath();
  ctx.moveTo(-8, 7);
  ctx.lineTo(-16, 17);
  ctx.moveTo(-2, 10);
  ctx.lineTo(-4, 22);
  ctx.moveTo(4, 9);
  ctx.lineTo(7, 20);
  ctx.moveTo(10, 5);
  ctx.lineTo(17, 14);
  ctx.stroke();
  ctx.strokeStyle = "rgba(87, 52, 38, 0.28)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-6, 6);
  ctx.lineTo(-12, 14);
  ctx.moveTo(0, 8);
  ctx.lineTo(-1, 17);
  ctx.moveTo(6, 7);
  ctx.lineTo(9, 15);
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawPrompts() {
  if (state.mode !== "play") return;
  const task = nearbyTask();
  if (!task) return;

  const x = worldX(task.x);
  const y = 292 + Math.sin(state.time * 5) * 6;
  ctx.strokeStyle = "rgba(244,211,94,0.82)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 45, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(10,16,19,0.84)";
  roundRect(x - 44, y - 12, 88, 34, 8);
  ctx.fill();
  ctx.fillStyle = "#f4d35e";
  ctx.font = "900 15px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPACE", x, y + 6);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function drawForeground() {
  const chaos = state.chaos / 100;
  ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + chaos * 0.28})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (chaos > 0.2) {
    ctx.strokeStyle = `rgba(232, 93, 117, ${chaos * 0.35})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      const x = ((i * 223 + state.time * 36) % VIEW_W) - 60;
      ctx.beginPath();
      ctx.moveTo(x, 75 + i * 54);
      ctx.lineTo(x + 72, 92 + i * 54);
      ctx.stroke();
    }
  }
}

function drawGlitch() {
  for (let i = 0; i < 16; i += 1) {
    const y = Math.random() * VIEW_H;
    const height = 4 + Math.random() * 18;
    const shift = (Math.random() - 0.5) * 34;
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(232,93,117,0.22)" : "rgba(42,157,143,0.22)";
    ctx.fillRect(shift, y, VIEW_W, height);
  }
}

function loop(now) {
  const seconds = now / 1000;
  const dt = Math.min(0.033, seconds - (loop.lastTime || seconds));
  loop.lastTime = seconds;
  update(dt);
  draw();
  window.requestAnimationFrame(loop);
}

startBtn.addEventListener("click", startGame);
replayBtn.addEventListener("click", startGame);
window.addEventListener("keydown", handleKeyDown, { passive: false });
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", stopMovement);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMovement();
});
setupMobileControls();
updateHud();
draw();
window.requestAnimationFrame(loop);

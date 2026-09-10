/* ============================================================
   Cronograma de Indicadores y Comisiones — multi-marca
   Persistencia local (localStorage) por marca + año + fecha
   ============================================================ */

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW = ["L","M","M","J","V","S","D"];

const BRANDS = {
  blackwell: { label:"Blackwell",  subtitle:"CALENDARIO — BLACKWELL",  hex:"#141522", soft:"#e8e8ee" },
  iempresa:  { label:"iEmpresa",   subtitle:"CALENDARIO — IEMPRESA",   hex:"#0f7a5c", soft:"#dff3ea" },
  itae:      { label:"ITAE",       subtitle:"CALENDARIO — ITAE",       hex:"#c2530c", soft:"#fbe7d8" },
};

const COLORS = [
  { key:"p1", hex:"#6a63f6" },
  { key:"p2", hex:"#1e88b5" },
  { key:"p3", hex:"#1f9d6e" },
  { key:"p4", hex:"#d98a1f" },
  { key:"p5", hex:"#d13f6a" },
  { key:"p6", hex:"#8a51c4" },
];

const STORAGE_KEY = "cronograma_multimarca_v1";

let state = {
  brand: "blackwell",
  year: 2026,
};

let activeCell = null; // { dateStr, brand }

/* ---------- storage helpers ---------- */
function loadData(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  }catch(e){ return {}; }
}
function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getEntry(brand, dateStr){
  const data = loadData();
  return (data[brand] && data[brand][dateStr]) || null;
}
function setEntry(brand, dateStr, entry){
  const data = loadData();
  if(!data[brand]) data[brand] = {};
  if(entry === null){
    delete data[brand][dateStr];
  } else {
    data[brand][dateStr] = entry;
  }
  saveData(data);
}

/* ---------- date helpers ---------- */
function pad(n){ return n.toString().padStart(2,"0"); }
function dateStr(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function jsDowToMonFirst(jsDow){ return jsDow === 0 ? 6 : jsDow - 1; } // convert Sun=0 to Mon-first index

function isoWeekInfo(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return weekNo;
}

function startOfWeek(date){
  const d = new Date(date);
  const dow = jsDowToMonFirst(d.getDay());
  d.setDate(d.getDate() - dow);
  return d;
}

/* ---------- rendering ---------- */
function applyBrandTheme(brandKey){
  const b = BRANDS[brandKey];
  document.documentElement.style.setProperty("--brand", b.hex);
  document.documentElement.style.setProperty("--brand-soft", b.soft);
  document.getElementById("brandSubtitle").textContent = b.subtitle;
  document.querySelectorAll(".brand-btn").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.brand === brandKey);
  });
}

function renderSidebarToday(){
  const today = new Date();
  const monthName = MESES[today.getMonth()];
  document.getElementById("currentMonthName").textContent = monthName;

  const weekNo = isoWeekInfo(today);
  document.getElementById("weekPill").textContent = `Semana ${weekNo}`;

  const start = startOfWeek(today);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d)=> `${d.getDate()} ${MESES[d.getMonth()].slice(0,4).toLowerCase()}`;
  document.getElementById("weekRange").textContent = `${fmt(start)} — ${fmt(end)}`;

  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const diaNombre = dias[today.getDay()];
  document.getElementById("helloCard").innerHTML =
    `👋 <b>¡Hola!</b><br>Hoy, ${diaNombre}, ${today.getDate()} de ${monthName.toLowerCase()}, estamos en la <b>Semana ${weekNo}</b> de ${monthName}.`;
}

function buildMonthCard(year, monthIndex){
  const card = document.createElement("div");
  card.className = "month-card";
  card.id = `month-${year}-${monthIndex}`;

  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() === monthIndex;
  if(isCurrent) card.classList.add("is-current");

  const head = document.createElement("div");
  head.className = "month-head";
  head.innerHTML = `<h3>${MESES[monthIndex]}</h3><span>${year}</span>`;
  card.appendChild(head);

  const dowRow = document.createElement("div");
  dowRow.className = "dow-row";
  DOW.forEach(d=>{
    const el = document.createElement("div");
    el.textContent = d;
    dowRow.appendChild(el);
  });
  card.appendChild(dowRow);

  const grid = document.createElement("div");
  grid.className = "day-grid";

  const firstDow = jsDowToMonFirst(new Date(year, monthIndex, 1).getDay());
  const totalDays = daysInMonth(year, monthIndex);

  for(let i=0;i<firstDow;i++){
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  for(let d=1; d<=totalDays; d++){
    const cellDateStr = dateStr(year, monthIndex, d);
    const cell = document.createElement("button");
    cell.className = "day-cell";
    cell.type = "button";

    const isToday = today.getFullYear()===year && today.getMonth()===monthIndex && today.getDate()===d;
    if(isToday) cell.classList.add("today");

    const numSpan = document.createElement("span");
    numSpan.className = "num";
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    applyEntryStyle(cell, cellDateStr);

    cell.title = cellDateStr;
    cell.addEventListener("click", ()=> openModal(cellDateStr));

    grid.appendChild(cell);
  }

  card.appendChild(grid);
  return card;
}

function applyEntryStyle(cell, cellDateStr){
  const entry = getEntry(state.brand, cellDateStr);
  cell.classList.remove("has-activity");
  if(entry){
    cell.style.background = entry.hex;
    cell.style.color = "#fff";
    cell.classList.add("has-activity");
    cell.title = `${cellDateStr}\n${entry.activity}`;
  } else {
    cell.style.background = "";
    cell.style.color = "";
    cell.title = cellDateStr;
  }
}

function renderYear(){
  document.getElementById("yearLabel").textContent = state.year;
  const grid = document.getElementById("monthsGrid");
  grid.innerHTML = "";
  for(let m=0;m<12;m++){
    grid.appendChild(buildMonthCard(state.year, m));
  }
}

function refreshAllCellStyles(){
  document.querySelectorAll(".day-cell:not(.empty)").forEach(cell=>{
    const ds = cell.title.split("\n")[0];
    applyEntryStyle(cell, ds);
  });
}

function populateMonthFilter(){
  const sel = document.getElementById("monthFilter");
  sel.innerHTML = `<option value="">Filtrar vista por mes</option>`;
  MESES.forEach((m,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    sel.appendChild(opt);
  });
}

/* ---------- modal ---------- */
function buildColorRow(selectedHex){
  const row = document.getElementById("colorRow");
  row.innerHTML = "";
  COLORS.forEach(c=>{
    const dot = document.createElement("div");
    dot.className = "color-opt" + (c.hex === selectedHex ? " selected" : "");
    dot.style.background = c.hex;
    dot.dataset.hex = c.hex;
    dot.addEventListener("click", ()=>{
      row.querySelectorAll(".color-opt").forEach(o=>o.classList.remove("selected"));
      dot.classList.add("selected");
    });
    row.appendChild(dot);
  });
}

function openModal(ds){
  activeCell = ds;
  const entry = getEntry(state.brand, ds);

  const [y,m,d] = ds.split("-").map(Number);
  const niceDate = `${d} de ${MESES[m-1]} de ${y}`;
  document.getElementById("modalDate").textContent = niceDate;

  document.getElementById("activityInput").value = entry ? entry.activity : "";
  document.getElementById("notesInput").value = entry ? (entry.notes || "") : "";
  buildColorRow(entry ? entry.hex : COLORS[0].hex);

  document.getElementById("deleteBtn").style.display = entry ? "inline-block" : "none";
  document.getElementById("overlay").classList.add("open");
  document.getElementById("activityInput").focus();
}

function closeModal(){
  document.getElementById("overlay").classList.remove("open");
  activeCell = null;
}

function saveModal(){
  const activity = document.getElementById("activityInput").value.trim();
  const notes = document.getElementById("notesInput").value.trim();
  const selectedDot = document.querySelector(".color-opt.selected");
  const hex = selectedDot ? selectedDot.dataset.hex : COLORS[0].hex;

  if(!activity){
    setEntry(state.brand, activeCell, null);
  } else {
    setEntry(state.brand, activeCell, { activity, notes, hex });
  }
  refreshAllCellStyles();
  closeModal();
}

function deleteModal(){
  setEntry(state.brand, activeCell, null);
  refreshAllCellStyles();
  closeModal();
}

/* ---------- events ---------- */
function initEvents(){
  document.getElementById("brandBar").addEventListener("click", (e)=>{
    const btn = e.target.closest(".brand-btn");
    if(!btn) return;
    state.brand = btn.dataset.brand;
    applyBrandTheme(state.brand);
    refreshAllCellStyles();
  });

  document.getElementById("prevYear").addEventListener("click", ()=>{
    state.year -= 1;
    renderYear();
  });
  document.getElementById("nextYear").addEventListener("click", ()=>{
    state.year += 1;
    renderYear();
  });

  document.getElementById("monthFilter").addEventListener("change", (e)=>{
    const idx = e.target.value;
    if(idx === "") return;
    const el = document.getElementById(`month-${state.year}-${idx}`);
    if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  document.getElementById("gotoToday").addEventListener("click", ()=>{
    const today = new Date();
    if(state.year !== today.getFullYear()){
      state.year = today.getFullYear();
      renderYear();
    }
    const el = document.getElementById(`month-${today.getFullYear()}-${today.getMonth()}`);
    if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  });

  document.getElementById("cancelBtn").addEventListener("click", closeModal);
  document.getElementById("saveBtn").addEventListener("click", saveModal);
  document.getElementById("deleteBtn").addEventListener("click", deleteModal);
  document.getElementById("overlay").addEventListener("click", (e)=>{
    if(e.target.id === "overlay") closeModal();
  });
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeModal();
  });
}

/* ---------- init ---------- */
function init(){
  const today = new Date();
  state.year = today.getFullYear();
  applyBrandTheme(state.brand);
  renderSidebarToday();
  populateMonthFilter();
  renderYear();
  initEvents();
}

document.addEventListener("DOMContentLoaded", init);

/* ================================================================
   Cronograma de Indicadores y Comisiones
   Vanilla JS, sin dependencias. Datos guardados en localStorage,
   separados por espacio de trabajo (Blackwell / iEmpresa / ITAE).
================================================================= */

const MONTH_NAMES = ["ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
  "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"];
const MONTH_NAMES_CAP = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["L","M","M","J","V","S","D"];

const WORKSPACES = {
  blackwell: { label: "Blackwell", color: "#2563EB", text: "#ffffff" }, // azul
  iempresa:  { label: "iEmpresa",  color: "#F97316", text: "#ffffff" }, // naranjado
  itae:      { label: "ITAE",      color: "#E9C46A", text: "#3a2f10" }, // amarillo crema
  otros:     { label: "Otros",     color: "#14B8A6", text: "#ffffff" }  // teal
};

const DEFAULT_CATEGORIES = [
  { id: "reporte",   name: "Reporte",   color: "#8B5CF6" },
  { id: "comite",    name: "Comité",    color: "#3B82F6" },
  { id: "cierre",    name: "Cierre",    color: "#10B981" },
  { id: "auditoria", name: "Auditoría", color: "#F59E0B" },
  { id: "comision",  name: "Comisión",  color: "#EF4444" },
  { id: "otro",      name: "Otro",      color: "#A855F7" }
];

const state = {
  workspace: "blackwell",
  year: 2026
};

/* ---------------- Persistencia ---------------- */
function storageKey(ws){ return `cronograma_${ws}_data`; }

function loadData(ws){
  const raw = localStorage.getItem(storageKey(ws));
  if(raw){
    try{ return JSON.parse(raw); }catch(e){ /* fall through */ }
  }
  return {
    categories: DEFAULT_CATEGORIES.map(c => ({...c})),
    ranges: []
  };
}

function saveData(ws, data){
  localStorage.setItem(storageKey(ws), JSON.stringify(data));
}

let data = loadData(state.workspace);

/* ---------------- Utilidades de fecha ---------------- */
function pad(n){ return String(n).padStart(2,"0"); }
function toISO(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function parseISO(s){
  const [y,m,d] = s.split("-").map(Number);
  return new Date(y, m-1, d);
}
function isoBetween(iso, startIso, endIso){
  return iso >= startIso && iso <= endIso;
}
function getISOWeek(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(),0,4));
  const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay()+6)%7)) / 7);
  return week;
}
function startOfWeek(date){
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}
function fmtShort(date){
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

const today = new Date();
const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

/* ================================================================
   RENDER: Sidebar
================================================================= */
function applyWorkspaceTheme(){
  const ws = WORKSPACES[state.workspace];
  document.documentElement.style.setProperty("--accent", ws.color);
  document.documentElement.style.setProperty("--accent-text", ws.text);
  document.querySelectorAll(".tab").forEach(btn => {
    const w = WORKSPACES[btn.dataset.tab];
    btn.style.setProperty("--tab-color", w.color);
    btn.style.setProperty("--tab-text", w.text);
  });
}

function renderSidebar(){
  applyWorkspaceTheme();
  document.getElementById("workspaceLabel").textContent = `Calendario — ${WORKSPACES[state.workspace].label}`;
  document.getElementById("yearLabel").textContent = state.year;
  document.getElementById("currentMonthName").textContent = MONTH_NAMES_CAP[today.getMonth()];

  const week = getISOWeek(today);
  document.getElementById("weekPill").textContent = `Semana ${week}`;
  const wStart = startOfWeek(today);
  const wEnd = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
  document.getElementById("weekRange").textContent = `${fmtShort(wStart)} – ${fmtShort(wEnd)}`;

  const weekdayLabel = today.toLocaleDateString("es-ES", { weekday: "long" });
  document.getElementById("todayText").innerHTML =
    `Hoy, ${weekdayLabel} ${today.getDate()} de ${MONTH_NAMES_CAP[today.getMonth()].toLowerCase()}, `+
    `estamos en la <strong>Semana ${week}</strong> de ${MONTH_NAMES_CAP[today.getMonth()]}.`;

  renderLegend();
  renderMonthSelect();
}

function renderLegend(){
  const list = document.getElementById("legendList");
  list.innerHTML = "";
  data.categories.forEach(cat => {
    const li = document.createElement("li");
    li.className = "legend-item";
    li.innerHTML = `
      <span class="legend-dot" style="background:${cat.color}"></span>
      <span>${cat.name}</span>
      <button data-id="${cat.id}" title="Eliminar etiqueta">✕</button>
    `;
    li.querySelector("button").addEventListener("click", () => deleteCategory(cat.id));
    list.appendChild(li);
  });
}

function renderMonthSelect(){
  const sel = document.getElementById("monthSelect");
  sel.innerHTML = "";
  MONTH_NAMES_CAP.forEach((name, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = name;
    if(state.year === today.getFullYear() && i === today.getMonth()) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ================================================================
   RENDER: Meses / días
================================================================= */
function rangesForDay(iso){
  return data.ranges.filter(r => isoBetween(iso, r.start, r.end));
}

function buildMonthCard(monthIndex){
  const card = document.createElement("div");
  card.className = "month-card";
  card.id = `month-${monthIndex}`;
  const isCurrent = state.year === today.getFullYear() && monthIndex === today.getMonth();
  if(isCurrent) card.classList.add("is-current");

  card.innerHTML = `
    <div class="month-head">
      <span class="month-name">${MONTH_NAMES[monthIndex]}</span>
      <span class="month-year">${state.year}</span>
    </div>
    <div class="weekday-row">${WEEKDAYS.map(w=>`<span>${w}</span>`).join("")}</div>
    <div class="day-grid"></div>
  `;

  const grid = card.querySelector(".day-grid");
  const firstDay = new Date(state.year, monthIndex, 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(state.year, monthIndex + 1, 0).getDate();

  for(let i = 0; i < offset; i++){
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  for(let d = 1; d <= daysInMonth; d++){
    const iso = toISO(state.year, monthIndex, d);
    const cell = document.createElement("button");
    cell.className = "day-cell";
    cell.textContent = d;
    cell.dataset.iso = iso;

    const hits = rangesForDay(iso);
    if(iso === todayISO){
      cell.classList.add("today");
    } else if(hits.length){
      cell.classList.add("painted");
      if(hits.length === 1){
        const cat = data.categories.find(c => c.id === hits[0].categoryId);
        cell.style.background = cat ? cat.color : "#999";
      } else {
        const colors = hits.map(h => {
          const c = data.categories.find(c => c.id === h.categoryId);
          return c ? c.color : "#999";
        });
        const step = 100 / colors.length;
        const stops = colors.map((c,i)=>`${c} ${i*step}%, ${c} ${(i+1)*step}%`).join(", ");
        cell.style.background = `linear-gradient(135deg, ${stops})`;
      }
    }

    cell.addEventListener("click", () => openDayModal(iso));
    grid.appendChild(cell);
  }

  return card;
}

function renderMonthsGrid(){
  const grid = document.getElementById("monthsGrid");
  grid.innerHTML = "";
  for(let m = 0; m < 12; m++){
    grid.appendChild(buildMonthCard(m));
  }
}

function renderAll(){
  renderSidebar();
  renderMonthsGrid();
}

/* ================================================================
   Tabs (espacios de trabajo)
================================================================= */
document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if(!btn) return;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  state.workspace = btn.dataset.tab;
  data = loadData(state.workspace);
  renderAll();
});

/* ================================================================
   Año
================================================================= */
document.getElementById("prevYear").addEventListener("click", () => {
  state.year--; renderAll();
});
document.getElementById("nextYear").addEventListener("click", () => {
  state.year++; renderAll();
});

/* ================================================================
   Ir a mes / ir a hoy
================================================================= */
document.getElementById("monthSelect").addEventListener("change", (e) => {
  const el = document.getElementById(`month-${e.target.value}`);
  if(el) el.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("gotoTodayBtn").addEventListener("click", () => {
  state.year = today.getFullYear();
  renderAll();
  setTimeout(() => {
    const el = document.getElementById(`month-${today.getMonth()}`);
    if(el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
});

/* ================================================================
   Modal: pintar rango de fechas
================================================================= */
const rangeModal = document.getElementById("rangeModalBackdrop");
let selectedCategoryId = null;

function openRangeModal(prefillIso){
  document.getElementById("rangeStart").value = prefillIso || "";
  document.getElementById("rangeEnd").value = prefillIso || "";
  document.getElementById("rangeNote").value = "";
  selectedCategoryId = data.categories[0] ? data.categories[0].id : null;
  renderCategoryPicker();
  rangeModal.classList.add("open");
}
function closeRangeModal(){ rangeModal.classList.remove("open"); }

function renderCategoryPicker(){
  const picker = document.getElementById("categoryPicker");
  picker.innerHTML = "";
  data.categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "category-chip" + (cat.id === selectedCategoryId ? " selected" : "");
    chip.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.name}`;
    chip.addEventListener("click", () => {
      selectedCategoryId = cat.id;
      renderCategoryPicker();
    });
    picker.appendChild(chip);
  });
}

document.getElementById("paintRangeBtn").addEventListener("click", () => openRangeModal());
document.getElementById("cancelRangeBtn").addEventListener("click", closeRangeModal);

document.getElementById("confirmRangeBtn").addEventListener("click", () => {
  const start = document.getElementById("rangeStart").value;
  const end = document.getElementById("rangeEnd").value;
  const note = document.getElementById("rangeNote").value.trim();

  if(!start || !end){
    alert("Selecciona una fecha de inicio y de fin.");
    return;
  }
  if(!selectedCategoryId){
    alert("Elige una etiqueta de color.");
    return;
  }
  const s = start <= end ? start : end;
  const e = start <= end ? end : start;

  data.ranges.push({
    id: "r_" + Date.now(),
    start: s,
    end: e,
    categoryId: selectedCategoryId,
    note
  });
  saveData(state.workspace, data);
  closeRangeModal();
  renderMonthsGrid();
});

/* ================================================================
   Modal: nueva etiqueta / categoría
================================================================= */
const categoryModal = document.getElementById("categoryModalBackdrop");

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  document.getElementById("newCategoryName").value = "";
  document.getElementById("newCategoryColor").value = "#3B82F6";
  categoryModal.classList.add("open");
});
document.getElementById("cancelCategoryBtn").addEventListener("click", () => {
  categoryModal.classList.remove("open");
});
document.getElementById("confirmCategoryBtn").addEventListener("click", () => {
  const name = document.getElementById("newCategoryName").value.trim();
  const color = document.getElementById("newCategoryColor").value;
  if(!name){ alert("Ponle un nombre a la etiqueta."); return; }
  data.categories.push({ id: "c_" + Date.now(), name, color });
  saveData(state.workspace, data);
  categoryModal.classList.remove("open");
  renderLegend();
});

function deleteCategory(catId){
  const inUse = data.ranges.some(r => r.categoryId === catId);
  const msg = inUse
    ? "Esta etiqueta tiene fechas pintadas. Si la eliminas, también se borrarán esos rangos. ¿Continuar?"
    : "¿Eliminar esta etiqueta?";
  if(!confirm(msg)) return;
  data.categories = data.categories.filter(c => c.id !== catId);
  data.ranges = data.ranges.filter(r => r.categoryId !== catId);
  saveData(state.workspace, data);
  renderLegend();
  renderMonthsGrid();
}

/* ================================================================
   Modal: detalle de un día
================================================================= */
const dayModal = document.getElementById("dayModalBackdrop");

function openDayModal(iso){
  const d = parseISO(iso);
  const label = `${d.getDate()} de ${MONTH_NAMES_CAP[d.getMonth()]} ${d.getFullYear()}`;
  document.getElementById("dayModalTitle").textContent = label;

  const body = document.getElementById("dayModalBody");
  const hits = rangesForDay(iso);

  if(hits.length === 0){
    body.innerHTML = `<p style="color:var(--muted);margin:0 0 16px;">Sin actividades registradas. Usa "Pintar rango de fechas" para agregar una.</p>`;
  } else {
    body.innerHTML = "";
    hits.forEach(r => {
      const cat = data.categories.find(c => c.id === r.categoryId);
      const entry = document.createElement("div");
      entry.className = "day-note-entry";
      entry.innerHTML = `
        <div class="cat"><span class="dot" style="background:${cat ? cat.color : "#999"}"></span>${cat ? cat.name : "Sin etiqueta"}</div>
        <p class="range">${r.start} → ${r.end}</p>
        ${r.note ? `<p class="note">${escapeHtml(r.note)}</p>` : `<p class="note" style="color:var(--muted)">Sin nota</p>`}
        <button class="remove" data-id="${r.id}">Eliminar este rango</button>
      `;
      entry.querySelector(".remove").addEventListener("click", () => {
        data.ranges = data.ranges.filter(x => x.id !== r.id);
        saveData(state.workspace, data);
        renderMonthsGrid();
        openDayModal(iso);
      });
      body.appendChild(entry);
    });
  }

  // Botón rápido para pintar sobre este día
  const quick = document.createElement("button");
  quick.className = "primary-btn";
  quick.style.marginTop = "4px";
  quick.textContent = "Pintar este día";
  quick.addEventListener("click", () => {
    closeDayModal();
    openRangeModal(iso);
  });
  body.appendChild(quick);

  dayModal.classList.add("open");
}
function closeDayModal(){ dayModal.classList.remove("open"); }
document.getElementById("closeDayBtn").addEventListener("click", closeDayModal);

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ================================================================
   Borrar todo
================================================================= */
document.getElementById("clearBtn").addEventListener("click", () => {
  if(!confirm(`Esto borrará todas las fechas pintadas y etiquetas de "${WORKSPACES[state.workspace].label}". ¿Continuar?`)) return;
  data = { categories: DEFAULT_CATEGORIES.map(c => ({...c})), ranges: [] };
  saveData(state.workspace, data);
  renderAll();
});

/* ================================================================
   Cerrar modales al hacer click fuera
================================================================= */
[rangeModal, categoryModal, dayModal].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if(e.target === modal) modal.classList.remove("open");
  });
});

/* ================================================================
   Init
================================================================= */
renderAll();

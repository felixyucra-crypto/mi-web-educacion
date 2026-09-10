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
    try{
      const parsed = JSON.parse(raw);
      if(!parsed.notes) parsed.notes = [];
      // Migración: rangos antiguos usaban categoryId (una sola etiqueta).
      if(parsed.ranges){
        parsed.ranges = parsed.ranges.map(r => {
          if(!r.categoryIds){
            return { ...r, categoryIds: r.categoryId ? [r.categoryId] : [] };
          }
          return r;
        });
      }
      return parsed;
    }catch(e){ /* fall through */ }
  }
  return {
    categories: DEFAULT_CATEGORIES.map(c => ({...c})),
    ranges: [],
    notes: []
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

  renderLegend();
  renderMonthSelect();
  renderPending();
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

function buildCellBackground(colors){
  if(colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((c,i)=>`${c} ${i*step}%, ${c} ${(i+1)*step}%`).join(", ");
  return `conic-gradient(from 45deg, ${stops})`;
}

function buildTagDots(colors){
  const wrap = document.createElement("span");
  wrap.className = "dot-multi";
  colors.slice(0,4).forEach(c => {
    const dot = document.createElement("span");
    dot.style.background = c;
    wrap.appendChild(dot);
  });
  return wrap;
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
    const catIds = [...new Set(hits.flatMap(h => h.categoryIds || []))];
    const colors = catIds
      .map(id => data.categories.find(c => c.id === id))
      .filter(Boolean)
      .map(c => c.color);

    if(iso === todayISO){
      cell.classList.add("today");
      if(colors.length){
        cell.classList.add("has-tags");
        cell.appendChild(buildTagDots(colors));
      }
    } else if(colors.length){
      cell.classList.add("painted");
      cell.style.background = buildCellBackground(colors);
      if(colors.length > 1){
        cell.classList.add("multi");
        cell.appendChild(buildTagDots(colors));
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
let selectedCategoryIds = [];

function openRangeModal(prefillIso){
  document.getElementById("rangeStart").value = prefillIso || "";
  document.getElementById("rangeEnd").value = prefillIso || "";
  document.getElementById("rangeNote").value = "";
  selectedCategoryIds = data.categories[0] ? [data.categories[0].id] : [];
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
    const isSelected = selectedCategoryIds.includes(cat.id);
    chip.className = "category-chip" + (isSelected ? " selected" : "");
    chip.style.setProperty("--chip-color", cat.color);
    chip.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.name}<span class="check">✓</span>`;
    chip.addEventListener("click", () => {
      if(isSelected){
        selectedCategoryIds = selectedCategoryIds.filter(id => id !== cat.id);
      } else {
        selectedCategoryIds.push(cat.id);
      }
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
  if(selectedCategoryIds.length === 0){
    alert("Elige al menos una etiqueta de color.");
    return;
  }
  const s = start <= end ? start : end;
  const e = start <= end ? end : start;

  data.ranges.push({
    id: "r_" + Date.now(),
    start: s,
    end: e,
    categoryIds: [...selectedCategoryIds],
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
  const inUse = data.ranges.some(r => (r.categoryIds || []).includes(catId));
  const msg = inUse
    ? "Esta etiqueta tiene fechas pintadas. Si la eliminas, se quitará de esos rangos (y si algún rango se queda sin etiquetas, se borrará). ¿Continuar?"
    : "¿Eliminar esta etiqueta?";
  if(!confirm(msg)) return;
  data.categories = data.categories.filter(c => c.id !== catId);
  data.ranges = data.ranges
    .map(r => ({ ...r, categoryIds: (r.categoryIds || []).filter(id => id !== catId) }))
    .filter(r => r.categoryIds.length > 0);
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
      const cats = (r.categoryIds || [])
        .map(id => data.categories.find(c => c.id === id))
        .filter(Boolean);
      const entry = document.createElement("div");
      entry.className = "day-note-entry";
      const catsHtml = cats.length
        ? cats.map(cat => `<span class="cat"><span class="dot" style="background:${cat.color}"></span>${cat.name}</span>`).join("")
        : `<span class="cat">Sin etiqueta</span>`;
      entry.innerHTML = `
        <div class="cat-row">${catsHtml}</div>
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
   Pendientes (notas con fecha límite, responsable y etiqueta)
================================================================= */
function noteStatus(note){
  if(note.done) return "done";
  if(!note.dueDate) return "none";
  if(note.dueDate < todayISO) return "overdue";
  if(note.dueDate === todayISO) return "today";
  return "upcoming";
}

function renderPending(){
  const listEl = document.getElementById("pendingList");
  const alertEl = document.getElementById("pendingAlert");
  const countEl = document.getElementById("pendingCount");
  const notes = data.notes || [];

  const sorted = [...notes].sort((a,b) => {
    if(a.done !== b.done) return a.done ? 1 : -1;
    if(!a.dueDate && !b.dueDate) return 0;
    if(!a.dueDate) return 1;
    if(!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const urgent = notes.filter(n => !n.done && (noteStatus(n) === "overdue" || noteStatus(n) === "today"));
  if(urgent.length){
    alertEl.hidden = false;
    const overdueCount = notes.filter(n => !n.done && noteStatus(n) === "overdue").length;
    const todayCount = notes.filter(n => !n.done && noteStatus(n) === "today").length;
    const parts = [];
    if(overdueCount) parts.push(`${overdueCount} vencido${overdueCount>1?"s":""}`);
    if(todayCount) parts.push(`${todayCount} vence${todayCount>1?"n":""} hoy`);
    alertEl.innerHTML = `⚠️ Tienes ${parts.join(" y ")}.`;
  } else {
    alertEl.hidden = true;
  }

  const pendingTotal = notes.filter(n => !n.done).length;
  if(pendingTotal){
    countEl.hidden = false;
    countEl.textContent = pendingTotal;
    countEl.className = "pending-count" + (urgent.length ? " urgent" : "");
  } else {
    countEl.hidden = true;
  }

  listEl.innerHTML = "";
  if(sorted.length === 0){
    const empty = document.createElement("li");
    empty.className = "pending-empty";
    empty.textContent = "No tienes notas pendientes todavía.";
    listEl.appendChild(empty);
    return;
  }

  sorted.forEach(note => {
    const status = noteStatus(note);
    const cat = note.categoryId ? data.categories.find(c => c.id === note.categoryId) : null;

    const li = document.createElement("li");
    li.className = "pending-item" + (note.done ? " done" : "") + (status === "overdue" ? " overdue" : "");

    const dueLabel = note.dueDate
      ? (status === "overdue" ? `Venció ${note.dueDate}` : status === "today" ? "Vence hoy" : note.dueDate)
      : null;

    li.innerHTML = `
      <button class="pending-check" title="Marcar como hecho">${note.done ? "✓" : ""}</button>
      <div class="pending-body">
        <p class="pending-text">${escapeHtml(note.text)}</p>
        <div class="pending-meta">
          ${cat ? `<span class="pending-tag"><span class="dot" style="background:${cat.color}"></span>${cat.name}</span>` : ""}
          ${note.responsible ? `<span class="pending-responsible">👤 ${escapeHtml(note.responsible)}</span>` : ""}
          ${dueLabel ? `<span class="pending-due ${status}">${dueLabel}</span>` : ""}
        </div>
      </div>
      <button class="pending-remove" title="Eliminar">✕</button>
    `;

    li.querySelector(".pending-check").addEventListener("click", () => {
      note.done = !note.done;
      saveData(state.workspace, data);
      renderPending();
    });
    li.querySelector(".pending-remove").addEventListener("click", () => {
      data.notes = data.notes.filter(n => n.id !== note.id);
      saveData(state.workspace, data);
      renderPending();
    });

    listEl.appendChild(li);
  });
}

const noteModal = document.getElementById("noteModalBackdrop");
let selectedNoteCategoryId = null;

function renderNoteCategoryPicker(){
  const picker = document.getElementById("noteCategoryPicker");
  picker.innerHTML = "";
  data.categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.type = "button";
    const isSelected = selectedNoteCategoryId === cat.id;
    chip.className = "category-chip" + (isSelected ? " selected" : "");
    chip.style.setProperty("--chip-color", cat.color);
    chip.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.name}<span class="check">✓</span>`;
    chip.addEventListener("click", () => {
      selectedNoteCategoryId = isSelected ? null : cat.id;
      renderNoteCategoryPicker();
    });
    picker.appendChild(chip);
  });
}

function openNoteModal(){
  document.getElementById("noteText").value = "";
  document.getElementById("noteDueDate").value = "";
  document.getElementById("noteResponsible").value = "";
  selectedNoteCategoryId = null;
  renderNoteCategoryPicker();
  noteModal.classList.add("open");
}
function closeNoteModal(){ noteModal.classList.remove("open"); }

document.getElementById("addNoteBtn").addEventListener("click", openNoteModal);
document.getElementById("cancelNoteBtn").addEventListener("click", closeNoteModal);

document.getElementById("confirmNoteBtn").addEventListener("click", () => {
  const text = document.getElementById("noteText").value.trim();
  const dueDate = document.getElementById("noteDueDate").value || null;
  const responsible = document.getElementById("noteResponsible").value.trim();

  if(!text){
    alert("Escribe el contenido de la nota.");
    return;
  }

  data.notes.push({
    id: "n_" + Date.now(),
    text,
    dueDate,
    responsible,
    categoryId: selectedNoteCategoryId,
    done: false
  });
  saveData(state.workspace, data);
  closeNoteModal();
  renderPending();
});

/* ================================================================
   Borrar todo
================================================================= */
document.getElementById("clearBtn").addEventListener("click", () => {
  if(!confirm(`Esto borrará todas las fechas pintadas, etiquetas y notas pendientes de "${WORKSPACES[state.workspace].label}". ¿Continuar?`)) return;
  data = { categories: DEFAULT_CATEGORIES.map(c => ({...c})), ranges: [], notes: [] };
  saveData(state.workspace, data);
  renderAll();
});

/* ================================================================
   Cerrar modales al hacer click fuera
================================================================= */
[rangeModal, categoryModal, dayModal, noteModal].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if(e.target === modal) modal.classList.remove("open");
  });
});

/* ================================================================
   Init
================================================================= */
renderAll();

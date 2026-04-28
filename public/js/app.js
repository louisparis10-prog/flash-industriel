// ── STATE ─────────────────────────────────────────────
let currentDate = new Date().toISOString().slice(0, 10);
let formData = {};

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('session-date').value = today;
  document.getElementById('dash-date-picker').value = today;
  currentDate = today;
  updateHeaderDate();
  checkStatus();
  initForms();
});

function updateHeaderDate() {
  const d = new Date(currentDate + 'T12:00:00');
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('header-date').textContent = label;
}

// ── NAVIGATION ────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.textContent.toLowerCase().includes(name) || (name === 'home' && b.textContent.includes('Accueil'))) {
      b.classList.add('active');
    }
  });
  if (name === 'dashboard') {
    document.getElementById('dash-date-picker').value = currentDate;
    loadDashboard();
  }
  window.scrollTo(0, 0);
}

// ── DATE ──────────────────────────────────────────────
function setDate() {
  const val = document.getElementById('session-date').value;
  if (!val) return;
  currentDate = val;
  document.getElementById('dash-date-picker').value = val;
  updateHeaderDate();
  document.getElementById('home-status-bar').style.display = 'block';
  checkStatus();
}

// ── STATUS ────────────────────────────────────────────
async function checkStatus() {
  try {
    const res = await fetch('/api/status/' + currentDate);
    const data = await res.json();
    updateStatusUI(data);
  } catch (e) {}
}

function updateStatusUI(data) {
  const services = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
  const labels = { securite: 'Sécurité', production: 'Production', qualite: 'Qualité', maintenance: 'Maintenance', utilites: 'Utilités' };
  services.forEach(s => {
    const ok = data.submitted.includes(s);
    const el = document.getElementById('status-' + s);
    if (el) {
      el.className = 'feu ' + (ok ? 'feu-vert' : 'feu-gris');
      el.textContent = labels[s];
    }
    // Cards
    const card = document.getElementById('card-' + s);
    if (card) {
      card.className = 'status-badge ' + (ok ? 'badge-ok' : 'badge-missing');
      card.textContent = ok ? '✅ Envoyé' : ' En attente';
    }
  });
  const complete = document.getElementById('status-complete');
  if (complete) {
    if (data.complete) {
      complete.textContent = 'Tous les services ont répondu — tableau de bord prêt !';
      complete.style.color = 'var(--vert)';
    } else {
      complete.textContent = `${data.submitted.length}/5 services`;
      complete.style.color = 'var(--text2)';
    }
  }
  document.getElementById('home-status-bar').style.display = 'block';
}

// ── FORMS INIT ────────────────────────────────────────
function initForms() {
  // Statut buttons
  document.querySelectorAll('.statut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      btn.closest('.statut-group').querySelectorAll('.statut-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Form submissions
  ['securite', 'production', 'qualite', 'maintenance', 'utilites'].forEach(service => {
    const form = document.getElementById('form-' + service);
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); submitForm(service, form); });
  });
}

function collectFormData(form) {
  const data = {};
  // Standard inputs
  new FormData(form).forEach((val, key) => { if (val !== '') data[key] = val; });
  // Statut buttons
  form.querySelectorAll('.statut-btn.selected').forEach(btn => {
    data[btn.dataset.field] = btn.dataset.val;
  });
  return data;
}

async function submitForm(service, form) {
  const data = collectFormData(form);
  if (!currentDate) { alert('Veuillez d\'abord sélectionner une date.'); return; }

  try {
    const res = await fetch(`/api/submissions/${currentDate}/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      showToast('Flash ' + service.charAt(0).toUpperCase() + service.slice(1) + ' envoyé !');
      checkStatus();
      setTimeout(() => showPage('home'), 1200);
    }
  } catch (e) {
    alert('Erreur lors de l\'envoi');
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// ── DYNAMIC EVENTS (Maintenance) ──────────────────────
let eventCounts = { impact: 1, risque: 1, point: 1 };

function addEvent(type) {
  const idx = eventCounts[type]++;
  const container = document.getElementById('events-' + (type === 'point' ? 'points' : 'events-' + type) + '-container')
    || document.getElementById('points-container')
    || document.getElementById('events-impact-container')
    || document.getElementById('events-risque-container');

  let html = '';
  if (type === 'impact') {
    html = `<div class="event-item" style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px;">
      <div class="form-row">
        <div class="form-group" style="grid-column:span 2">
          <label>Description</label>
          <input type="text" name="impact_${idx}_desc" placeholder="Description de l'événement...">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label>Machine</label>
          <select name="impact_${idx}_machine"><option value="">...</option><option>MFT1</option><option>MFT3</option><option>Finition</option><option>Autre</option></select>
        </div>
        <div class="form-group"><label>Durée (h)</label><input type="number" name="impact_${idx}_duree" step="0.5" min="0"></div>
        <div class="form-group"><label>Urgence</label>
          <div class="statut-group">
            <button type="button" class="statut-btn" data-field="impact_${idx}_urgence" data-val="orange">🟠</button>
            <button type="button" class="statut-btn" data-field="impact_${idx}_urgence" data-val="rouge">🔴</button>
          </div>
        </div>
      </div>
    </div>`;
    document.getElementById('events-impact-container').insertAdjacentHTML('beforeend', html);
  } else if (type === 'risque') {
    html = `<div class="event-item" style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px;">
      <div class="form-row">
        <div class="form-group" style="grid-column:span 2">
          <label>Description du risque</label>
          <input type="text" name="risque_${idx}_desc" placeholder="Description...">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Machine</label>
          <select name="risque_${idx}_machine"><option value="">...</option><option>MFT1</option><option>MFT3</option><option>Finition</option><option>Autre</option></select>
        </div>
        <div class="form-group"><label>Délai</label><input type="text" name="risque_${idx}_delai" placeholder="Ex: 48h..."></div>
      </div>
    </div>`;
    document.getElementById('events-risque-container').insertAdjacentHTML('beforeend', html);
  } else if (type === 'point') {
    html = `<div class="event-item" style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px;">
      <div class="form-row">
        <div class="form-group" style="grid-column:span 2">
          <label>Point à investiguer</label>
          <input type="text" name="point_${idx}_desc" placeholder="Description...">
        </div>
      </div>
      <div class="form-row-3">
        <div class="form-group"><label>Machine</label>
          <select name="point_${idx}_machine"><option value="">...</option><option>MFT1</option><option>MFT3</option><option>Finition 1</option><option>Finition 2</option><option>Autre</option></select>
        </div>
        <div class="form-group"><label>Responsable</label><input type="text" name="point_${idx}_responsable" placeholder="Qui ?"></div>
        <div class="form-group"><label>Délai</label><input type="text" name="point_${idx}_delai" placeholder="Date..."></div>
      </div>
      <div class="form-group" style="margin-top:8px;"><label>Statut</label>
        <div class="statut-group">
          <button type="button" class="statut-btn" data-field="point_${idx}_statut" data-val="vert">🟢 Soldé</button>
          <button type="button" class="statut-btn" data-field="point_${idx}_statut" data-val="orange">🟠 En cours</button>
          <button type="button" class="statut-btn" data-field="point_${idx}_statut" data-val="rouge">🔴 En retard</button>
        </div>
      </div>
    </div>`;
    document.getElementById('points-container').insertAdjacentHTML('beforeend', html);
  }

  // Re-init new buttons
  document.querySelectorAll('.statut-btn:not([data-init])').forEach(btn => {
    btn.dataset.init = '1';
    btn.addEventListener('click', () => {
      btn.closest('.statut-group').querySelectorAll('.statut-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

// ── DASHBOARD ─────────────────────────────────────────
async function loadDashboard() {
  const date = document.getElementById('dash-date-picker').value;
  if (!date) return;
  currentDate = date;
  updateHeaderDate();

  const [submissionsRes, statusRes] = await Promise.all([
    fetch('/api/submissions/' + date),
    fetch('/api/status/' + date)
  ]);
  const submissions = await submissionsRes.json();
  const status = await statusRes.json();

  const d = new Date(date + 'T12:00:00');
  document.getElementById('dash-date-label').textContent =
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  renderDashboard(submissions, status, date);
}

function feu(val, label = '') {
  if (!val) return `<span class="feu feu-gris">— ${label}</span>`;
  return `<span class="feu feu-${val}">${label || val}</span>`;
}

function pct(reel, obj) {
  if (!reel || !obj || obj == 0) return null;
  return Math.round((reel / obj) * 100);
}

function barColor(pct) {
  if (pct >= 95) return 'var(--vert)';
  if (pct >= 80) return 'var(--orange)';
  return 'var(--rouge)';
}

function progressBar(reel, obj, unite = '') {
  const p = pct(reel, obj);
  if (p === null) return '<span style="color:var(--text2);font-size:12px">—</span>';
  const color = barColor(p);
  const ecart = reel - obj;
  const sign = ecart >= 0 ? '+' : '';
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <span style="font-size:13px;font-weight:700;color:${color}">${Number(reel).toLocaleString('fr-FR')} ${unite}</span>
      <span style="font-size:11px;color:var(--text2)">obj. ${Number(obj).toLocaleString('fr-FR')} ${unite} · <span style="color:${color}">${sign}${Number(ecart).toLocaleString('fr-FR')}</span></span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(p,100)}%;background:${color}"></div></div>
  `;
}

function renderDashboard(d, status, date) {
  const sec = d.securite || null;
  const prod = d.production || null;
  const qual = d.qualite || null;
  const maint = d.maintenance || null;
  const util = d.utilites || null;

  // Calcul statut global
  const statuts = [
    sec?.couleur_globale, prod?.statut_global, qual?.statut_global, maint?.statut_global
  ].filter(Boolean);
  let globalStatut = 'vert';
  if (statuts.includes('rouge')) globalStatut = 'rouge';
  else if (statuts.includes('orange')) globalStatut = 'orange';

  const globalLabels = { vert: 'Situation normale', orange: 'Points de vigilance', rouge: 'Situation critique' };
  const globalIcons = { vert: '✅', orange: '⚠️', rouge: '🚨' };

  // Points à investiguer (maintenance)
  const points = [];
  if (maint) {
    for (let i = 0; i < 10; i++) {
      const desc = maint[`point_${i}_desc`];
      if (desc) points.push({
        desc,
        machine: maint[`point_${i}_machine`] || '—',
        responsable: maint[`point_${i}_responsable`] || '—',
        delai: maint[`point_${i}_delai`] || '—',
        statut: maint[`point_${i}_statut`] || 'orange'
      });
    }
  }

  // Incidents maintenance
  const impacts = [];
  if (maint) {
    for (let i = 0; i < 10; i++) {
      const desc = maint[`impact_${i}_desc`];
      if (desc) impacts.push({
        desc,
        machine: maint[`impact_${i}_machine`] || '—',
        duree: maint[`impact_${i}_duree`] || '—',
        urgence: maint[`impact_${i}_urgence`] || 'rouge'
      });
    }
  }

  const html = `
    <!-- Statut global -->
    <div class="global-status">
      <div class="status-orb orb-${globalStatut}">${globalIcons[globalStatut]}</div>
      <div class="status-info">
        <h2>${globalLabels[globalStatut]}</h2>
        <p>${status.submitted.length}/5 services ont soumis leurs indicateurs
          ${status.complete ? ' · <strong style="color:var(--vert)">Flash complet</strong>' : ' · <span style="color:var(--orange)">En attente : ' + status.missing.map(s => ({securite:'Sécurité',production:'Production',qualite:'Qualité',maintenance:'Maintenance',utilites:'Utilités'})[s]).join(', ') + '</span>'}
        </p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">
        ${['securite','production','qualite','maintenance','utilites'].map(s => {
          const ok = status.submitted.includes(s);
          const names = {securite:'Sécurité',production:'Production',qualite:'Qualité',maintenance:'Maintenance',utilites:'Utilités'};
          return `<span class="feu ${ok?'feu-vert':'feu-gris'}">${names[s]}</span>`;
        }).join('')}
      </div>
    </div>

    <!-- KPIs rapides -->
    <div class="section-title">Indicateurs clés</div>
    <div class="kpi-grid">
      ${prod ? `
        <div class="kpi-card" style="--kpi-color:${prod.m1_statut==='rouge'?'var(--rouge)':prod.m1_statut==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">Production M1 (t)</div>
          <div class="kpi-value">${prod.m1_prod_cumul ?? '—'}<span style="font-size:16px"> t</span></div>
          <div class="kpi-unit">obj. ${prod.m1_prod_cible ?? '—'} t</div>
          ${prod.m1_prod_cumul && prod.m1_prod_cible ? `<div class="kpi-delta ${+prod.m1_prod_cumul >= +prod.m1_prod_cible ? 'pos':'neg'}">${+prod.m1_prod_cumul >= +prod.m1_prod_cible ? '▲' : '▼'} ${Math.abs(+prod.m1_prod_cumul - +prod.m1_prod_cible).toFixed(1)} t</div>` : ''}
        </div>
        <div class="kpi-card" style="--kpi-color:${prod.m3_statut==='rouge'?'var(--rouge)':prod.m3_statut==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">Production M3 (t)</div>
          <div class="kpi-value">${prod.m3_prod_cumul ?? '—'}<span style="font-size:16px"> t</span></div>
          <div class="kpi-unit">obj. ${prod.m3_prod_cible ?? '—'} t</div>
          ${prod.m3_prod_cumul && prod.m3_prod_cible ? `<div class="kpi-delta ${+prod.m3_prod_cumul >= +prod.m3_prod_cible ? 'pos':'neg'}">${+prod.m3_prod_cumul >= +prod.m3_prod_cible ? '▲' : '▼'} ${Math.abs(+prod.m3_prod_cumul - +prod.m3_prod_cible).toFixed(1)} t</div>` : ''}
        </div>
      ` : `<div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">Prod. M1</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>
           <div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">Prod. M3</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>`}

      ${qual ? `
        <div class="kpi-card" style="--kpi-color:${qual.m1_resultat==='rouge'?'var(--rouge)':qual.m1_resultat==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">TC% Machine 1</div>
          <div class="kpi-value">${qual.m1_tc_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">cible : ${qual.m1_tc_cible ?? '—'}</div>
        </div>
        <div class="kpi-card" style="--kpi-color:${qual.m3_resultat==='rouge'?'var(--rouge)':qual.m3_resultat==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">TC% Machine 3</div>
          <div class="kpi-value">${qual.m3_tc_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">cible : ${qual.m3_tc_cible ?? '—'}</div>
        </div>
      ` : `<div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">TC% M1</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>
           <div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">TC% M3</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>`}

      <div class="kpi-card" style="--kpi-color:${impacts.length > 0 ? 'var(--rouge)' : 'var(--vert)'}">
        <div class="kpi-label">Pannes (impact)</div>
        <div class="kpi-value" style="color:${impacts.length > 0 ? 'var(--rouge)' : 'var(--vert)'}">${maint ? impacts.length : '—'}</div>
        <div class="kpi-unit">événements maintenance</div>
      </div>
      <div class="kpi-card" style="--kpi-color:${sec?.nb_evenements > 0 ? 'var(--orange)' : 'var(--vert)'}">
        <div class="kpi-label">Incidents sécu</div>
        <div class="kpi-value" style="color:${sec?.nb_evenements > 0 ? 'var(--orange)' : 'var(--vert)'}">${sec ? (sec.nb_evenements ?? 0) : '—'}</div>
        <div class="kpi-unit">événements du jour</div>
      </div>
    </div>

    <!-- Panels services -->
    <div class="section-title">Détail par service</div>
    <div class="services-grid">

      <!-- SÉCURITÉ -->
      <div class="service-panel" style="--accent:var(--securite)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--securite)"></div>Sécurité</div>
          ${sec ? feu(sec.couleur_globale, sec.couleur_globale === 'vert' ? 'OK' : sec.couleur_globale === 'orange' ? 'Vigilance' : 'Critique') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${sec ? `
            <div class="metric-row"><span class="metric-name">Qualification</span><span class="metric-val">${feu(sec.qualification)}</span></div>
            <div class="metric-row"><span class="metric-name">Zone déchets</span><span class="metric-val">${feu(sec.zone_dechets)}</span></div>
            <div class="metric-row"><span class="metric-name">Protection incendie</span><span class="metric-val">${feu(sec.protection_incendie)}</span></div>
            <div class="metric-row"><span class="metric-name">Utilités / NTOL</span><span class="metric-val">${feu(sec.utilites)}</span></div>
            <div class="metric-row"><span class="metric-name">Biomasse</span><span class="metric-val">${feu(sec.biomasse)}</span></div>
            <div class="metric-row"><span class="metric-name">Gaz</span><span class="metric-val">${feu(sec.gaz)}</span></div>
            <div class="metric-row"><span class="metric-name">Fioul</span><span class="metric-val">${feu(sec.fioul)}</span></div>
            <div class="metric-row"><span class="metric-name">Air comprimé</span><span class="metric-val">${feu(sec.air_comprime)}</span></div>
            <div class="metric-row"><span class="metric-name">Énergie</span><span class="metric-val">${feu(sec.efficacite_energetique)}</span></div>
            ${sec.evenements ? `<div style="margin-top:12px;padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);"><strong style="color:var(--text)">⚠️ Événements :</strong> ${sec.evenements}</div>` : ''}
            ${sec.commentaire_general ? `<div style="margin-top:8px;padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);">${sec.commentaire_general}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px"></span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- PRODUCTION -->
      <div class="service-panel" style="--accent:var(--production)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--production)"></div>Production</div>
          ${prod ? feu(prod.statut_global, prod.statut_global === 'vert' ? 'OK' : prod.statut_global === 'orange' ? 'Écart' : 'Critique') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${prod ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                Machine 1 ${prod.m1_ref ? `<span style="font-weight:400;color:var(--text);font-size:13px;">(${prod.m1_ref})</span>` : ''} ${feu(prod.m1_statut)}
              </div>
              <div class="metric-row"><span class="metric-name">Production (t)</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.m1_prod_cumul, prod.m1_prod_cible, 't')}
              </span></div>
              <div class="metric-row"><span class="metric-name">Rendement (%)</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.m1_rdt_cumul, parseFloat(prod.m1_rdt_cible)||null, '%')}
              </span></div>
              ${prod.m1_phnr_j1 ? `<div class="metric-row"><span class="metric-name">PHNR J-1</span><span class="metric-val"><strong>${prod.m1_phnr_j1}</strong> kg/h${prod.m1_phnr_cible ? ` <span style="color:var(--orange);font-size:11px;">/ obj. ${prod.m1_phnr_cible}</span>` : ''}</span></div>` : ''}
              ${prod.m1_arret_cumul ? `<div class="metric-row"><span class="metric-name">Arrêts</span><span class="metric-val" style="color:var(--rouge)">${prod.m1_arret_cumul}</span></div>` : ''}
              ${prod.m1_casse_cumul ? `<div class="metric-row"><span class="metric-name">Casse</span><span class="metric-val" style="color:var(--rouge)">${prod.m1_casse_cumul}</span></div>` : ''}
              ${prod.m1_info ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">${prod.m1_info}</div>` : ''}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                Machine 3 ${prod.m3_ref ? `<span style="font-weight:400;color:var(--text);font-size:13px;">(${prod.m3_ref})</span>` : ''} ${feu(prod.m3_statut)}
              </div>
              <div class="metric-row"><span class="metric-name">Production (t)</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.m3_prod_cumul, prod.m3_prod_cible, 't')}
              </span></div>
              <div class="metric-row"><span class="metric-name">Rendement (%)</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.m3_rdt_cumul, parseFloat(prod.m3_rdt_cible)||null, '%')}
              </span></div>
              ${prod.m3_phnr_j1 ? `<div class="metric-row"><span class="metric-name">PHNR J-1</span><span class="metric-val"><strong>${prod.m3_phnr_j1}</strong> kg/h${prod.m3_phnr_cible ? ` <span style="color:var(--orange);font-size:11px;">/ obj. ${prod.m3_phnr_cible}</span>` : ''}</span></div>` : ''}
              ${prod.m3_arret_cumul ? `<div class="metric-row"><span class="metric-name">Arrêts</span><span class="metric-val" style="color:var(--rouge)">${prod.m3_arret_cumul}</span></div>` : ''}
              ${prod.m3_casse_cumul ? `<div class="metric-row"><span class="metric-name">Casse</span><span class="metric-val" style="color:var(--rouge)">${prod.m3_casse_cumul}</span></div>` : ''}
              ${prod.m3_info ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">${prod.m3_info}</div>` : ''}
            </div>
            ${(prod.gemba_prep1 || prod.gemba_prep3 || prod.gemba_machine1 || prod.gemba_machine3) ? `
            <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">TOURNÉE TERRAIN</div>
              <div class="gemba-grid">
                <div class="gemba-zone"><div class="gemba-zone-name">Prépa 1</div><div class="gemba-dot" style="background:var(--${prod.gemba_prep1 || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Prépa 3</div><div class="gemba-dot" style="background:var(--${prod.gemba_prep3 || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Machine 1</div><div class="gemba-dot" style="background:var(--${prod.gemba_machine1 || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Machine 3</div><div class="gemba-dot" style="background:var(--${prod.gemba_machine3 || 'gris'})"></div></div>
              </div>
            </div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px"></span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- QUALITÉ -->
      <div class="service-panel" style="--accent:var(--qualite)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--qualite)"></div>Qualité</div>
          ${qual ? feu(qual.statut_global, qual.statut_global === 'vert' ? 'OK' : qual.statut_global === 'orange' ? 'Écart' : 'Critique') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${qual ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                Machine 1 ${qual.m1_produit ? `<span style="font-weight:400;color:var(--text);font-size:13px;">(${qual.m1_produit})</span>` : ''} ${feu(qual.m1_resultat)}
              </div>
              ${qual.m1_tc_reel ? `<div class="metric-row"><span class="metric-name">TC %</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.m1_tc_reel, parseFloat(qual.m1_tc_cible)||null, '%')}
              </span></div>` : ''}
              ${qual.m1_perco_reel ? `<div class="metric-row"><span class="metric-name">E% Perco</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.m1_perco_reel, qual.m1_perco_cible, '%')}
              </span></div>` : ''}
              ${qual.m1_fait_marquant ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">${qual.m1_fait_marquant}</div>` : ''}
              ${qual.m1_consigne ? `<div style="margin-top:4px;padding:8px;background:rgba(59,130,246,.08);border-radius:6px;font-size:12px;color:var(--blue);">${qual.m1_consigne}</div>` : ''}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                Machine 3 ${qual.m3_produit ? `<span style="font-weight:400;color:var(--text);font-size:13px;">(${qual.m3_produit})</span>` : ''} ${feu(qual.m3_resultat)}
              </div>
              ${qual.m3_tc_reel ? `<div class="metric-row"><span class="metric-name">TC %</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.m3_tc_reel, parseFloat(qual.m3_tc_cible)||null, '%')}
              </span></div>` : ''}
              ${qual.m3_perco_reel ? `<div class="metric-row"><span class="metric-name">E% Perco</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.m3_perco_reel, qual.m3_perco_cible, '%')}
              </span></div>` : ''}
              ${qual.m3_fait_marquant ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">${qual.m3_fait_marquant}</div>` : ''}
              ${qual.m3_consigne ? `<div style="margin-top:4px;padding:8px;background:rgba(59,130,246,.08);border-radius:6px;font-size:12px;color:var(--blue);">${qual.m3_consigne}</div>` : ''}
            </div>
            ${qual.remontees ? `<div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;font-size:13px;color:var(--text2);"><strong style="color:var(--text)">Remontées :</strong> ${qual.remontees}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px"></span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- MAINTENANCE -->
      <div class="service-panel" style="--accent:var(--maintenance)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--maintenance)"></div>Maintenance</div>
          ${maint ? feu(maint.statut_global, maint.statut_global === 'vert' ? 'OK' : maint.statut_global === 'orange' ? 'Risque' : 'Impact') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${maint ? `
            ${impacts.length > 0 ? `
              <div style="margin-bottom:12px;">
                <div style="font-size:12px;font-weight:700;color:var(--rouge);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Impact performance</div>
                ${impacts.map(ev => `
                  <div class="incident-item">
                    <div class="incident-dot" style="background:var(--${ev.urgence})"></div>
                    <div>
                      <div class="incident-text">${ev.desc}</div>
                      <div class="incident-meta">${ev.machine} · ${ev.duree}h d'arrêt</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `<div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px;font-size:13px;color:var(--vert);margin-bottom:12px;">Aucune panne impactant la performance</div>`}
            ${(() => {
              const risques = [];
              for (let i = 0; i < 10; i++) {
                const desc = maint[`risque_${i}_desc`];
                if (desc) risques.push({ desc, machine: maint[`risque_${i}_machine`] || '—', delai: maint[`risque_${i}_delai`] || '—' });
              }
              return risques.length > 0 ? `
                <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
                  <div style="font-size:12px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Risques à surveiller</div>
                  ${risques.map(r => `
                    <div class="incident-item">
                      <div class="incident-dot" style="background:var(--orange)"></div>
                      <div>
                        <div class="incident-text">${r.desc}</div>
                        <div class="incident-meta">${r.machine} · ${r.delai}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>` : '';
            })()}
            ${maint.commentaire_general ? `<div style="padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);">${maint.commentaire_general}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px"></span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>
    </div>

    <!-- UTILITÉS -->
    <div class="section-title">Utilités</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:24px;">
      ${util ? `
      <div style="display:grid;grid-template-columns:180px 100px 1fr 120px;gap:0;">
        <div style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);">Indicateur</div>
        <div style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);text-align:center;">Statut</div>
        <div style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);">Événements / Informations</div>
        <div style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);">Délai</div>
        ${[
          ['Clarification', 'clarification'],
          ['Zone déchets', 'zone_dechets'],
          ['Protection incendie', 'incendie'],
          ['STEP (1)', 'step1'],
          ['STEP (2)', 'step2'],
          ['Chaufferies — Biomasse', 'biomasse'],
          ['Gaz', 'gaz'],
          ['Dalkia', 'dalkia'],
          ['Air Comprimé', 'air'],
          ['Climatisation / cond.', 'clim'],
          ['Effacement Énergétique', 'effacement'],
        ].map(([label, key]) => {
          const statut = util[key + '_statut'];
          const info = util[key + '_info'] || '—';
          const delai = util[key + '_delai'] || '';
          return `
            <div style="padding:10px 14px;font-size:13px;font-weight:${label.includes('—')||label==='Gaz'||label==='Dalkia'?'400':'600'};color:${label.includes('—')||label==='Gaz'||label==='Dalkia'?'var(--text2)':'var(--text)'};border-bottom:1px solid rgba(51,65,85,.3);padding-left:${label==='Gaz'||label==='Dalkia'?'28px':'14px'};">${label.replace('Chaufferies — ','Chaufferies — ')}</div>
            <div style="padding:10px 14px;text-align:center;border-bottom:1px solid rgba(51,65,85,.3);">${statut ? `<span class="feu feu-${statut}"></span>` : '<span class="feu feu-gris"></span>'}</div>
            <div style="padding:10px 14px;font-size:13px;color:var(--text2);border-bottom:1px solid rgba(51,65,85,.3);">${info}</div>
            <div style="padding:10px 14px;font-size:12px;color:var(--text2);border-bottom:1px solid rgba(51,65,85,.3);">${delai}</div>
          `;
        }).join('')}
      </div>
      ${util.commentaire_general ? `<div style="padding:12px 16px;font-size:13px;color:var(--text2);border-top:1px solid var(--border);">${util.commentaire_general}</div>` : ''}
      ` : `<div class="no-data" style="padding:32px"><span class="icon" style="font-size:24px"></span><p>Formulaire Utilités non soumis</p></div>`}
    </div>

    <!-- TENDANCES DU MOIS -->
    <div class="section-title">Tendances du mois</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;margin-bottom:24px;">
      <div id="trends-month-label" style="font-size:13px;color:var(--text2);margin-bottom:16px;font-weight:600;"></div>
      <div id="trends-loading" style="text-align:center;color:var(--text2);padding:32px;">
        <div style="font-size:24px;margin-bottom:8px;"></div><p>Chargement des tendances...</p>
      </div>
      <div id="trends-grid" style="display:none;grid-template-columns:repeat(2,1fr);gap:16px;">
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #3b82f6">
          <div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:12px;">Production M1 (t)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-prod-m1"></canvas></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #10b981">
          <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;margin-bottom:12px;">Production M3 (t)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-prod-m3"></canvas></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #8b5cf6">
          <div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;margin-bottom:12px;">PHNR M1 (kg/h)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-phnr-m1"></canvas></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #8b5cf6">
          <div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;margin-bottom:12px;">PHNR M3 (kg/h)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-phnr-m3"></canvas></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #22c55e">
          <div style="font-size:11px;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:12px;">Rendement M1 (%)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-rdt-m1"></canvas></div>
        </div>
        <div style="background:var(--bg3);border-radius:10px;padding:16px;border-left:3px solid #22c55e">
          <div style="font-size:11px;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:12px;">Rendement M3 (%)</div>
          <div style="position:relative;height:140px;"><canvas id="chart-rdt-m3"></canvas></div>
        </div>
      </div>
    </div>

    <!-- POINTS À INVESTIGUER -->
    ${points.length > 0 ? `
    <div class="section-title">Points à investiguer</div>
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:24px;">
      <table class="points-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Machine / Zone</th>
            <th>Responsable</th>
            <th>Délai</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${points.map(p => `
            <tr>
              <td>${p.desc}</td>
              <td><span style="background:var(--bg3);padding:2px 8px;border-radius:4px;font-size:12px;">${p.machine}</span></td>
              <td>${p.responsable}</td>
              <td>${p.delai}</td>
              <td>${feu(p.statut, p.statut === 'vert' ? 'Soldé' : p.statut === 'orange' ? 'En cours' : 'En retard')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `;

  document.getElementById('dashboard-content').innerHTML = html;
  loadTrendCharts(date);
}

// ── TREND CHARTS ──────────────────────────────────────
let activeCharts = {};

async function loadTrendCharts(date) {
  // Destroy existing Chart instances
  Object.values(activeCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  activeCharts = {};

  const [year, month] = date.split('-');
  const monthNames = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const labelEl = document.getElementById('trends-month-label');
  const loadingEl = document.getElementById('trends-loading');
  const gridEl = document.getElementById('trends-grid');
  if (!labelEl) return;

  labelEl.textContent = `Données du mois de ${monthNames[+month]} ${year}`;
  loadingEl.style.display = 'block';
  gridEl.style.display = 'none';

  try {
    const res = await fetch(`/api/monthly/${year}/${month}`);
    const byDate = await res.json();
    const dates = Object.keys(byDate).sort();

    if (dates.length === 0) {
      loadingEl.innerHTML = '<p style="color:var(--text2)">Aucune donnée pour ce mois.</p>';
      return;
    }

    const labels = dates.map(d => {
      const dd = new Date(d + 'T12:00:00');
      return dd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    });

    const extract = (service, field) => dates.map(d => {
      const val = byDate[d]?.[service]?.[field];
      if (val === undefined || val === null || val === '') return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    });

    const makeChart = (canvasId, color, dataReal, dataObj, unit) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Réel',
              data: dataReal,
              borderColor: color,
              backgroundColor: color + '18',
              borderWidth: 2.5,
              pointRadius: 4,
              pointBackgroundColor: color,
              pointBorderColor: '#0f172a',
              pointBorderWidth: 1.5,
              tension: 0.3,
              fill: true,
              spanGaps: true,
            },
            {
              label: 'Objectif',
              data: dataObj,
              borderColor: '#f59e0b',
              borderDash: [5, 4],
              borderWidth: 2,
              pointRadius: 3,
              pointBackgroundColor: '#f59e0b',
              pointBorderColor: '#0f172a',
              tension: 0.1,
              fill: false,
              spanGaps: true,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 16 }
            },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label} : ${ctx.parsed.y !== null ? ctx.parsed.y : '—'} ${unit}`
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#64748b', font: { size: 10 } },
              grid: { color: 'rgba(51,65,85,.35)' }
            },
            y: {
              ticks: { color: '#64748b', font: { size: 10 } },
              grid: { color: 'rgba(51,65,85,.35)' }
            }
          }
        }
      });
      activeCharts[canvasId] = chart;
    };

    loadingEl.style.display = 'none';
    gridEl.style.display = 'grid';

    makeChart('chart-prod-m1', '#3b82f6', extract('production','m1_prod_cumul'), extract('production','m1_prod_cible'), 't');
    makeChart('chart-prod-m3', '#10b981', extract('production','m3_prod_cumul'), extract('production','m3_prod_cible'), 't');
    makeChart('chart-phnr-m1', '#8b5cf6', extract('production','m1_phnr_j1'),    extract('production','m1_phnr_cible'), 'kg/h');
    makeChart('chart-phnr-m3', '#8b5cf6', extract('production','m3_phnr_j1'),    extract('production','m3_phnr_cible'), 'kg/h');
    makeChart('chart-rdt-m1',  '#22c55e', extract('production','m1_rdt_cumul'),  extract('production','m1_rdt_cible'),  '%');
    makeChart('chart-rdt-m3',  '#22c55e', extract('production','m3_rdt_cumul'),  extract('production','m3_rdt_cible'),  '%');

  } catch(e) {
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--rouge)">Erreur de chargement des tendances.</p>';
    console.error(e);
  }
}

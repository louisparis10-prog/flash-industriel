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
  const services = ['securite', 'production', 'qualite', 'maintenance'];
  services.forEach(s => {
    const ok = data.submitted.includes(s);
    // Header bar
    const el = document.getElementById('status-' + s);
    if (el) {
      el.className = 'feu ' + (ok ? 'feu-vert' : 'feu-gris');
      el.textContent = { securite: 'Sécurité', production: 'Production', qualite: 'Qualité', maintenance: 'Maintenance' }[s];
    }
    // Cards
    const card = document.getElementById('card-' + s);
    if (card) {
      card.className = 'status-badge ' + (ok ? 'badge-ok' : 'badge-missing');
      card.textContent = ok ? '✅ Envoyé' : '⏳ En attente';
    }
  });
  const complete = document.getElementById('status-complete');
  if (complete) {
    if (data.complete) {
      complete.textContent = '🎉 Tous les services ont répondu — tableau de bord prêt !';
      complete.style.color = 'var(--vert)';
    } else {
      complete.textContent = `${data.submitted.length}/4 services`;
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
  ['securite', 'production', 'qualite', 'maintenance'].forEach(service => {
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
      showToast('✅ Flash ' + service.charAt(0).toUpperCase() + service.slice(1) + ' envoyé !');
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
        <p>${status.submitted.length}/4 services ont soumis leurs indicateurs
          ${status.complete ? ' · <strong style="color:var(--vert)">Flash complet</strong>' : ' · <span style="color:var(--orange)">En attente : ' + status.missing.map(s => ({securite:'Sécurité',production:'Production',qualite:'Qualité',maintenance:'Maintenance'})[s]).join(', ') + '</span>'}
        </p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">
        ${['securite','production','qualite','maintenance'].map(s => {
          const ok = status.submitted.includes(s);
          const names = {securite:'🦺 Sécu',production:'⚙️ Prod',qualite:'✅ Qualité',maintenance:'🔧 Maint'};
          return `<span class="feu ${ok?'feu-vert':'feu-gris'}">${names[s]}</span>`;
        }).join('')}
      </div>
    </div>

    <!-- KPIs rapides -->
    <div class="section-title">⚡ Indicateurs clés</div>
    <div class="kpi-grid">
      ${prod ? `
        <div class="kpi-card" style="--kpi-color:${prod.mft1_statut==='rouge'?'var(--rouge)':prod.mft1_statut==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">TRS MFT1</div>
          <div class="kpi-value">${prod.mft1_trs_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">obj. ${prod.mft1_trs_obj ?? '—'}%</div>
          ${prod.mft1_trs_reel && prod.mft1_trs_obj ? `<div class="kpi-delta ${prod.mft1_trs_reel >= prod.mft1_trs_obj ? 'pos':'neg'}">${prod.mft1_trs_reel >= prod.mft1_trs_obj ? '▲' : '▼'} ${Math.abs(prod.mft1_trs_reel - prod.mft1_trs_obj).toFixed(1)}%</div>` : ''}
        </div>
        <div class="kpi-card" style="--kpi-color:${prod.mft3_statut==='rouge'?'var(--rouge)':prod.mft3_statut==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">TRS MFT3</div>
          <div class="kpi-value">${prod.mft3_trs_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">obj. ${prod.mft3_trs_obj ?? '—'}%</div>
          ${prod.mft3_trs_reel && prod.mft3_trs_obj ? `<div class="kpi-delta ${prod.mft3_trs_reel >= prod.mft3_trs_obj ? 'pos':'neg'}">${prod.mft3_trs_reel >= prod.mft3_trs_obj ? '▲' : '▼'} ${Math.abs(prod.mft3_trs_reel - prod.mft3_trs_obj).toFixed(1)}%</div>` : ''}
        </div>
      ` : `<div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">TRS MFT1</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>
           <div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">TRS MFT3</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>`}

      ${qual ? `
        <div class="kpi-card" style="--kpi-color:${qual.mft1_resultat==='rouge'?'var(--rouge)':qual.mft1_resultat==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">Qualité FH MFT1</div>
          <div class="kpi-value">${qual.mft1_qual_h_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">obj. ${qual.mft1_qual_h_obj ?? '—'}% · manques: ${qual.mft1_nb_manques ?? 0}</div>
        </div>
        <div class="kpi-card" style="--kpi-color:${qual.mft3_resultat==='rouge'?'var(--rouge)':qual.mft3_resultat==='orange'?'var(--orange)':'var(--vert)'}">
          <div class="kpi-label">Qualité FH MFT3</div>
          <div class="kpi-value">${qual.mft3_qual_h_reel ?? '—'}<span style="font-size:16px">%</span></div>
          <div class="kpi-unit">obj. ${qual.mft3_qual_h_obj ?? '—'}% · manques: ${qual.mft3_nb_manques ?? 0}</div>
        </div>
      ` : `<div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">Qualité MFT1</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>
           <div class="kpi-card" style="--kpi-color:var(--gris)"><div class="kpi-label">Qualité MFT3</div><div class="kpi-value small" style="color:var(--gris)">En attente</div></div>`}

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
    <div class="section-title">🏭 Détail par service</div>
    <div class="services-grid">

      <!-- SÉCURITÉ -->
      <div class="service-panel" style="--accent:var(--securite)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--securite)"></div>🦺 Sécurité</div>
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
            ${sec.commentaire_general ? `<div style="margin-top:8px;padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);">💬 ${sec.commentaire_general}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px">⏳</span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- PRODUCTION -->
      <div class="service-panel" style="--accent:var(--production)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--production)"></div>⚙️ Production</div>
          ${prod ? feu(prod.statut_global, prod.statut_global === 'vert' ? 'OK' : prod.statut_global === 'orange' ? 'Écart' : 'Critique') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${prod ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">MFT1 ${feu(prod.mft1_statut)}</div>
              <div class="metric-row"><span class="metric-name">Production</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.mft1_prod_reel, prod.mft1_prod_obj, 'm²')}
              </span></div>
              <div class="metric-row"><span class="metric-name">TRS</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.mft1_trs_reel, prod.mft1_trs_obj, '%')}
              </span></div>
              ${prod.mft1_tsse ? `<div class="metric-row"><span class="metric-name">% TSSE</span><span class="metric-val">${prod.mft1_tsse}%</span></div>` : ''}
              ${prod.mft1_info ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">ℹ️ ${prod.mft1_info}</div>` : ''}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">MFT3 ${feu(prod.mft3_statut)}</div>
              <div class="metric-row"><span class="metric-name">Production</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.mft3_prod_reel, prod.mft3_prod_obj, 'm²')}
              </span></div>
              <div class="metric-row"><span class="metric-name">TRS</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(prod.mft3_trs_reel, prod.mft3_trs_obj, '%')}
              </span></div>
              ${prod.mft3_tsse ? `<div class="metric-row"><span class="metric-name">% TSSE</span><span class="metric-val">${prod.mft3_tsse}%</span></div>` : ''}
              ${prod.mft3_info ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">ℹ️ ${prod.mft3_info}</div>` : ''}
            </div>
            ${(prod.gemba_chargement || prod.gemba_preparation || prod.gemba_machine || prod.gemba_finition) ? `
            <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">GEMBA</div>
              <div class="gemba-grid">
                <div class="gemba-zone"><div class="gemba-zone-name">Chargement</div><div class="gemba-dot" style="background:var(--${prod.gemba_chargement || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Préparation</div><div class="gemba-dot" style="background:var(--${prod.gemba_preparation || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Machine</div><div class="gemba-dot" style="background:var(--${prod.gemba_machine || 'gris'})"></div></div>
                <div class="gemba-zone"><div class="gemba-zone-name">Finition</div><div class="gemba-dot" style="background:var(--${prod.gemba_finition || 'gris'})"></div></div>
              </div>
            </div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px">⏳</span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- QUALITÉ -->
      <div class="service-panel" style="--accent:var(--qualite)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--qualite)"></div>✅ Qualité</div>
          ${qual ? feu(qual.statut_global, qual.statut_global === 'vert' ? 'OK' : qual.statut_global === 'orange' ? 'Écart' : 'Critique') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${qual ? `
            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                MFT1 ${qual.mft1_semaine_iq ? `<span style="font-weight:400;color:var(--text2)">(${qual.mft1_semaine_iq})</span>` : ''} ${feu(qual.mft1_resultat)}
              </div>
              <div class="metric-row"><span class="metric-name">% h réel</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.mft1_qual_h_reel, qual.mft1_qual_h_obj, '%')}
              </span></div>
              ${qual.mft1_qual_jour ? `<div class="metric-row"><span class="metric-name">% jour</span><span class="metric-val">${qual.mft1_qual_jour}%</span></div>` : ''}
              <div class="metric-row"><span class="metric-name">Nb manques</span><span class="metric-val" style="color:${qual.mft1_nb_manques > 0 ? 'var(--orange)' : 'var(--vert)'}">${qual.mft1_nb_manques ?? 0}</span></div>
              ${qual.mft1_autre_resultat ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">ℹ️ ${qual.mft1_autre_resultat}</div>` : ''}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">
                MFT3 ${qual.mft3_semaine_iq ? `<span style="font-weight:400;color:var(--text2)">(${qual.mft3_semaine_iq})</span>` : ''} ${feu(qual.mft3_resultat)}
              </div>
              <div class="metric-row"><span class="metric-name">% h réel</span><span class="metric-val" style="flex-direction:column;align-items:flex-end">
                ${progressBar(qual.mft3_qual_h_reel, qual.mft3_qual_h_obj, '%')}
              </span></div>
              ${qual.mft3_qual_jour ? `<div class="metric-row"><span class="metric-name">% jour</span><span class="metric-val">${qual.mft3_qual_jour}%</span></div>` : ''}
              <div class="metric-row"><span class="metric-name">Nb manques</span><span class="metric-val" style="color:${qual.mft3_nb_manques > 0 ? 'var(--orange)' : 'var(--vert)'}">${qual.mft3_nb_manques ?? 0}</span></div>
              ${qual.mft3_autre_resultat ? `<div style="margin-top:8px;padding:8px;background:var(--bg3);border-radius:6px;font-size:12px;color:var(--text2);">ℹ️ ${qual.mft3_autre_resultat}</div>` : ''}
            </div>
            ${qual.remontees ? `<div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px;font-size:13px;color:var(--text2);">🔴 <strong style="color:var(--text)">Remontées :</strong> ${qual.remontees}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px">⏳</span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>

      <!-- MAINTENANCE -->
      <div class="service-panel" style="--accent:var(--maintenance)">
        <div class="service-panel-header">
          <div class="service-name"><div class="dot" style="background:var(--maintenance)"></div>🔧 Maintenance</div>
          ${maint ? feu(maint.statut_global, maint.statut_global === 'vert' ? 'OK' : maint.statut_global === 'orange' ? 'Risque' : 'Impact') : '<span class="feu feu-gris">En attente</span>'}
        </div>
        <div class="service-panel-body">
          ${maint ? `
            ${impacts.length > 0 ? `
              <div style="margin-bottom:12px;">
                <div style="font-size:12px;font-weight:700;color:var(--rouge);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">🔴 Impact performance</div>
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
            ` : `<div style="padding:10px;background:rgba(34,197,94,.08);border-radius:8px;font-size:13px;color:var(--vert);margin-bottom:12px;">✅ Aucune panne impactant la performance</div>`}
            ${(() => {
              const risques = [];
              for (let i = 0; i < 10; i++) {
                const desc = maint[`risque_${i}_desc`];
                if (desc) risques.push({ desc, machine: maint[`risque_${i}_machine`] || '—', delai: maint[`risque_${i}_delai`] || '—' });
              }
              return risques.length > 0 ? `
                <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
                  <div style="font-size:12px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">🟠 Risques à surveiller</div>
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
            ${maint.commentaire_general ? `<div style="padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);">💬 ${maint.commentaire_general}</div>` : ''}
          ` : '<div class="no-data" style="padding:24px"><span class="icon" style="font-size:24px">⏳</span><p>Formulaire non soumis</p></div>'}
        </div>
      </div>
    </div>

    <!-- POINTS À INVESTIGUER -->
    ${points.length > 0 ? `
    <div class="section-title">🔍 Points à investiguer</div>
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
}

// ── STATE ─────────────────────────────────────────────
let currentDate = new Date().toISOString().slice(0, 10);
let formData = {};
let currentM1Ref = null;
let currentM3Ref = null;
let currentTrendsMode = 'month';

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

      // Commentaire conditionnel pour les zones maintenance
      const commentEl = document.getElementById('zone-comment-' + field);
      if (commentEl) {
        const needComment = btn.dataset.val === 'orange' || btn.dataset.val === 'rouge';
        commentEl.style.display = needComment ? 'block' : 'none';
        commentEl.classList.toggle('zone-comment-visible', needComment);
        if (!needComment) { commentEl.value = ''; commentEl.style.border = ''; }
      }
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

  // Vérification commentaires zones obligatoires (maintenance)
  if (service === 'maintenance') {
    const visible = form.querySelectorAll('.zone-comment-visible');
    for (const el of visible) {
      if (!el.value.trim()) {
        el.style.border = '2px solid var(--rouge)';
        el.placeholder = 'Commentaire obligatoire pour ce statut !';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        return;
      }
      el.style.border = '';
    }
  }

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
  trendsLoaded = false;
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
  const sec   = d.securite    || null;
  const prod  = d.production  || null;
  const qual  = d.qualite     || null;
  const maint = d.maintenance || null;
  const util  = d.utilites    || null;

  // Mémoriser les refs produit pour les graphiques grade
  currentM1Ref = prod?.m1_ref || null;
  currentM3Ref = prod?.m3_ref || null;
  currentTrendsMode = 'month';

  // Statut global
  const statuts = [sec?.couleur_globale, prod?.statut_global, qual?.statut_global, maint?.statut_global].filter(Boolean);
  let globalStatut = 'vert';
  if (statuts.includes('rouge')) globalStatut = 'rouge';
  else if (statuts.includes('orange')) globalStatut = 'orange';
  const globalLabels = { vert: 'Situation normale', orange: 'Points de vigilance', rouge: 'Situation critique' };
  const svcNames = { securite:'Sécurité', production:'Production', qualite:'Qualité', maintenance:'Maintenance', utilites:'Utilités' };

  // Points à investiguer
  const points = [];
  if (maint) {
    for (let i = 0; i < 10; i++) {
      const desc = maint[`point_${i}_desc`];
      if (desc) points.push({ desc, machine: maint[`point_${i}_machine`]||'—', responsable: maint[`point_${i}_responsable`]||'—', delai: maint[`point_${i}_delai`]||'—', statut: maint[`point_${i}_statut`]||'orange' });
    }
  }

  // Impacts maintenance
  const impacts = [];
  if (maint) {
    for (let i = 0; i < 10; i++) {
      const desc = maint[`impact_${i}_desc`];
      if (desc) impacts.push({ desc, machine: maint[`impact_${i}_machine`]||'—', duree: maint[`impact_${i}_duree`]||'—', urgence: maint[`impact_${i}_urgence`]||'rouge' });
    }
  }

  // Risques maintenance
  const risques = [];
  if (maint) {
    for (let i = 0; i < 10; i++) {
      const desc = maint[`risque_${i}_desc`];
      if (desc) risques.push({ desc, machine: maint[`risque_${i}_machine`]||'—', delai: maint[`risque_${i}_delai`]||'—' });
    }
  }

  const [year, month] = date.split('-');
  const monthNames = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // ── Helpers dashboard body ──
  function dbProgress(label, reel, obj, unite = '') {
    const p = pct(reel, obj);
    if (p === null) return `<div class="db-metric"><span class="db-label">${label}</span><span class="db-val" style="color:var(--text2);font-size:13px">—</span></div>`;
    const color = barColor(p);
    const ecart = +reel - +obj;
    const sign = ecart >= 0 ? '+' : '';
    return `
      <div class="db-metric">
        <span class="db-label">${label}</span>
        <span class="db-val" style="color:${color}">${Number(reel).toLocaleString('fr-FR')} ${unite}<span class="db-obj">obj. ${Number(obj).toLocaleString('fr-FR')} · <span style="color:${color}">${sign}${Number(ecart).toLocaleString('fr-FR')}</span></span></span>
      </div>
      <div class="db-progress"><div class="db-progress-fill" style="width:${Math.min(p,100)}%;background:${color}"></div></div>`;
  }
  function dbSimple(label, val, sub = '', color = 'var(--text)') {
    if (!val) return '';
    return `<div class="db-simple"><span class="db-simple-label">${label}</span><span class="db-simple-val" style="color:${color}">${val}${sub ? `<span style="font-size:11px;color:var(--text2);font-weight:400;margin-left:4px">${sub}</span>` : ''}</span></div>`;
  }
  function dbInfo(text, bg = 'var(--bg3)', color = 'var(--text2)') {
    if (!text) return '';
    return `<div class="db-info" style="background:${bg};color:${color};white-space:pre-line">${text}</div>`;
  }

  // ── Helper : panneau accordéon ──
  function acc(id, color, name, animateur, hasData, statusHtml, bodyHtml) {
    return `
      <div class="acc-panel ${hasData ? '' : 'acc-missing'}" id="acc-${id}">
        <div class="acc-header" ${hasData ? `onclick="toggleAcc('${id}')"` : ''}>
          <div class="acc-left">
            <div class="dot" style="background:${color}"></div>
            <span class="acc-name">${name}</span>
            ${animateur ? `<span class="acc-animateur">${animateur}</span>` : ''}
          </div>
          <div class="acc-right">
            ${statusHtml}
            ${hasData ? '<span class="acc-chevron">›</span>' : ''}
          </div>
        </div>
        ${hasData ? `<div class="acc-body" id="acc-body-${id}" style="display:none">${bodyHtml}</div>` : ''}
      </div>`;
  }

  // ── Corps Sécurité ──
  const secColor = +sec?.nb_evenements > 0 ? 'var(--rouge)' : 'var(--vert)';
  const secBody = sec ? `
    <div class="db-sec-count">
      <div>
        <div class="db-sec-number" style="color:${secColor}">${sec.nb_evenements ?? 0}</div>
        <div class="db-sec-sublabel">événement(s)</div>
      </div>
      ${sec.evenements
        ? `<div style="flex:1;padding:10px 14px;background:#ffedd5;border-radius:8px;font-size:13px;color:#9a3412;border-left:3px solid var(--rouge);line-height:1.5"><strong>Événement :</strong> ${sec.evenements}</div>`
        : `<div style="flex:1;padding:10px 14px;background:rgba(34,197,94,.08);border-radius:8px;font-size:13px;color:var(--vert);">✓ Aucun incident à signaler</div>`}
    </div>
    ${sec.gravite && sec.gravite !== 'vert' ? dbSimple('Gravité', sec.gravite, '', sec.gravite === 'rouge' ? 'var(--rouge)' : 'var(--orange)') : ''}
    ${sec.commentaire_general && sec.commentaire_general !== 'Aucun incident à signaler' ? dbInfo(sec.commentaire_general) : ''}
  ` : '';

  // ── Corps Production ──
  const prodBody = prod ? `
    <div class="db-machines">
      <div>
        <div class="db-machine-header">Machine 1 ${prod.m1_ref ? `<span class="db-ref">${prod.m1_ref}</span>` : ''} ${feu(prod.m1_statut)}</div>
        ${dbProgress('Production', prod.m1_prod_cumul, prod.m1_prod_cible, 't')}
        ${String(prod.m1_rdt_cible||'').includes('/') ? dbSimple('Rendement', prod.m1_rdt_cumul != null ? prod.m1_rdt_cumul+'%' : null, 'cible '+prod.m1_rdt_cible) : dbProgress('Rendement', prod.m1_rdt_cumul, parseFloat(prod.m1_rdt_cible)||null, '%')}
        ${dbSimple('PHNR J-1', prod.m1_phnr_j1 ? prod.m1_phnr_j1+' kg/h' : null, prod.m1_phnr_cible ? 'obj. '+prod.m1_phnr_cible : '')}
        ${dbSimple('Arrêts cumulés', prod.m1_arret_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('Casse', prod.m1_casse_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('CDC', prod.m1_cdc_cumul||null, prod.m1_cdc_cible ? 'obj. '+prod.m1_cdc_cible : '')}
        ${dbInfo(prod.m1_info||null)}
      </div>
      <div>
        <div class="db-machine-header">Machine 3 ${prod.m3_ref ? `<span class="db-ref">${prod.m3_ref}</span>` : ''} ${feu(prod.m3_statut)}</div>
        ${dbProgress('Production', prod.m3_prod_cumul, prod.m3_prod_cible, 't')}
        ${String(prod.m3_rdt_cible||'').includes('/') ? dbSimple('Rendement', prod.m3_rdt_cumul != null ? prod.m3_rdt_cumul+'%' : null, 'cible '+prod.m3_rdt_cible) : dbProgress('Rendement', prod.m3_rdt_cumul, parseFloat(prod.m3_rdt_cible)||null, '%')}
        ${dbSimple('PHNR J-1', prod.m3_phnr_j1 ? prod.m3_phnr_j1+' kg/h' : null, prod.m3_phnr_cible ? 'obj. '+prod.m3_phnr_cible : '')}
        ${dbSimple('Arrêts cumulés', prod.m3_arret_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('Casse', prod.m3_casse_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('CDC', prod.m3_cdc_cumul||null, prod.m3_cdc_cible ? 'obj. '+prod.m3_cdc_cible : '')}
        ${dbInfo(prod.m3_info||null)}
      </div>
    </div>
    ${prod.commentaire_general ? dbInfo(prod.commentaire_general) : ''}
  ` : '';

  // ── Corps Qualité ──
  const qualBody = qual ? `
    <div class="db-machines">
      <div>
        <div class="db-machine-header">Machine 1 ${qual.m1_produit ? `<span class="db-ref">${qual.m1_produit}</span>` : ''} ${feu(qual.m1_resultat)}</div>
        ${qual.m1_tc_reel ? dbProgress('TC %', qual.m1_tc_reel, parseFloat(qual.m1_tc_cible)||null, '%') : ''}
        ${qual.m1_perco_reel ? dbProgress('E% Perco', qual.m1_perco_reel, qual.m1_perco_cible, '%') : ''}
        ${qual.m1_pir && qual.m1_pir !== 'Non Applicable' ? dbSimple('PIR', qual.m1_pir) : ''}
        ${qual.m1_autre_resultat ? dbInfo(qual.m1_autre_resultat) : ''}
        ${qual.m1_fait_marquant ? dbInfo(qual.m1_fait_marquant, 'rgba(251,146,60,.1)', 'var(--orange)') : ''}
        ${qual.m1_demande_cq ? dbSimple('Demande CQ', qual.m1_demande_cq) : ''}
        ${qual.m1_consigne ? dbInfo(qual.m1_consigne, 'rgba(59,130,246,.08)', '#2563eb') : ''}
      </div>
      <div>
        <div class="db-machine-header">Machine 3 ${qual.m3_produit ? `<span class="db-ref">${qual.m3_produit}</span>` : ''} ${feu(qual.m3_resultat)}</div>
        ${qual.m3_tc_reel ? dbProgress('TC %', qual.m3_tc_reel, parseFloat(qual.m3_tc_cible)||null, '%') : ''}
        ${qual.m3_perco_reel ? dbProgress('E% Perco', qual.m3_perco_reel, qual.m3_perco_cible, '%') : ''}
        ${qual.m3_pir && qual.m3_pir !== 'Non Applicable' ? dbSimple('PIR', qual.m3_pir) : ''}
        ${qual.m3_autre_resultat ? dbInfo(qual.m3_autre_resultat) : ''}
        ${qual.m3_fait_marquant ? dbInfo(qual.m3_fait_marquant, 'rgba(251,146,60,.1)', 'var(--orange)') : ''}
        ${qual.m3_demande_cq ? dbSimple('Demande CQ', qual.m3_demande_cq) : ''}
        ${qual.m3_consigne ? dbInfo(qual.m3_consigne, 'rgba(59,130,246,.08)', '#2563eb') : ''}
      </div>
    </div>
  ` : '';

  // ── Corps Maintenance ──
  const zoneList = [
    ['MT1','zone_mt1'],['MT3','zone_mt3'],
    ['Charg. 1','zone_charg1'],['Charg. 3','zone_charg3'],
    ['Prép. 1','zone_prep1'],['Prép. 3','zone_prep3'],
    ['Fin. 1','zone_fin1'],['Fin. 3','zone_fin3'],
  ];
  const zonesDefined = zoneList.filter(([,k]) => maint && maint[k]);
  const zoneGrid = zonesDefined.map(([label, k]) => {
    const s = maint[k];
    return `<div class="db-zone" style="${s!=='vert'?'border-color:var(--'+s+')':''}">
      <span class="db-zone-label">${label}</span>
      <span class="db-zone-dot" style="background:var(--${s})"></span>
    </div>`;
  }).join('');
  const zoneAlerts = zonesDefined.filter(([,k]) => maint[k] !== 'vert').map(([label, k]) => {
    const comment = maint[k+'_comment'];
    return `<div class="incident-item">
      <div class="incident-dot" style="background:var(--${maint[k]})"></div>
      <div><div class="incident-text">${label}</div>${comment ? `<div class="incident-meta">${comment}</div>` : ''}</div>
    </div>`;
  }).join('');

  const maintBody = maint ? `
    ${zonesDefined.length > 0 ? `
      <div style="margin-bottom:14px;">
        <div class="db-section-title">Zones — Niveau de confiance</div>
        <div class="db-zones">${zoneGrid}</div>
        ${zoneAlerts ? `<div style="margin-top:8px">${zoneAlerts}</div>` : ''}
        ${maint.zones_commentaire ? dbInfo(maint.zones_commentaire) : ''}
      </div>` : ''}
    ${impacts.length > 0 ? `
      <div style="margin-bottom:12px;${zonesDefined.length?'border-top:1px solid var(--border);padding-top:12px':''}">
        <div class="db-section-title" style="color:var(--rouge)">Pannes</div>
        ${impacts.map(ev => `
          <div class="incident-item">
            <div class="incident-dot" style="background:var(--${ev.urgence})"></div>
            <div><div class="incident-text">${ev.desc}</div><div class="incident-meta">${ev.machine}${ev.duree && ev.duree!=='—' ? ' · '+ev.duree+'h d\'arrêt' : ''}</div></div>
          </div>`).join('')}
      </div>
    ` : `<div style="padding:9px 12px;background:rgba(34,197,94,.08);border-radius:8px;font-size:13px;color:var(--vert);margin-bottom:12px;">✓ Aucune panne</div>`}
    ${risques.length > 0 ? `
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
        <div class="db-section-title" style="color:var(--orange)">Risques 24/48h</div>
        ${risques.map(r => `
          <div class="incident-item">
            <div class="incident-dot" style="background:var(--orange)"></div>
            <div><div class="incident-text">${r.desc}</div><div class="incident-meta">${r.machine}${r.delai && r.delai!=='—' ? ' · '+r.delai : ''}</div></div>
          </div>`).join('')}
      </div>` : ''}
    ${maint.commentaire_general ? dbInfo(maint.commentaire_general) : ''}
  ` : '';

  // ── Corps Utilités ──
  const utilRows = [
    ['Clarification','clarification'], ['Zone déchets','zone_dechets'],
    ['Protection incendie','incendie'], ['STEP (1)','step1'], ['STEP (2)','step2'],
    ['Biomasse','biomasse'], ['Gaz','gaz'], ['Dalkia','dalkia'],
    ['Air Comprimé','air'], ['Climatisation','clim'], ['Effacement Énergétique','effacement'],
  ].filter(([,k]) => util && util[k+'_statut']);

  const utilBody = util ? `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);">Indicateur</th>
          <th style="padding:8px 12px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);text-align:center;">Statut</th>
          <th style="text-align:left;padding:8px 12px;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;background:var(--bg3);border-bottom:1px solid var(--border);">Information</th>
        </tr></thead>
        <tbody>
          ${utilRows.map(([label, k]) => `
            <tr>
              <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid var(--border);">${label}</td>
              <td style="padding:8px 12px;text-align:center;border-bottom:1px solid var(--border);">${util[k+'_statut'] ? `<span class="feu feu-${util[k+'_statut']}"></span>` : ''}</td>
              <td style="padding:8px 12px;font-size:12px;color:var(--text2);border-bottom:1px solid var(--border);">${util[k+'_info'] || '—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${util.commentaire_general ? `<div style="margin-top:8px;padding:10px;background:var(--bg3);border-radius:8px;font-size:13px;color:var(--text2);">${util.commentaire_general}</div>` : ''}
  ` : '';

  // ── Corps Tendances ──
  const trendsBody = `
    <div class="trend-tabs">
      <button class="trend-tab active" id="tab-month" onclick="setTrendsMode('month')">Mois</button>
      <button class="trend-tab" id="tab-grade" onclick="setTrendsMode('grade')">Grade actuel</button>
      <button class="trend-tab" id="tab-comparatif" onclick="setTrendsMode('comparatif')">Comparatif grade</button>
    </div>
    <div id="trends-context" style="font-size:12px;color:var(--text2);margin-bottom:12px;font-weight:600;min-height:16px;"></div>
    <div id="trends-loading" style="text-align:center;color:var(--text2);padding:24px;display:none;"><p>Chargement...</p></div>
    <div id="trends-grid" style="display:none;grid-template-columns:repeat(2,1fr);gap:14px;">
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #3b82f6">
        <div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:10px;">Production M1 (t)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-prod-m1"></canvas></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #10b981">
        <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;margin-bottom:10px;">Production M3 (t)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-prod-m3"></canvas></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #8b5cf6">
        <div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;margin-bottom:10px;">PHNR M1 (kg/h)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-phnr-m1"></canvas></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #8b5cf6">
        <div style="font-size:11px;font-weight:700;color:#8b5cf6;text-transform:uppercase;margin-bottom:10px;">PHNR M3 (kg/h)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-phnr-m3"></canvas></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #22c55e">
        <div style="font-size:11px;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:10px;">Rendement M1 (%)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-rdt-m1"></canvas></div>
      </div>
      <div style="background:var(--bg3);border-radius:10px;padding:14px;border-left:3px solid #22c55e">
        <div style="font-size:11px;font-weight:700;color:#22c55e;text-transform:uppercase;margin-bottom:10px;">Rendement M3 (%)</div>
        <div style="position:relative;height:130px;"><canvas id="chart-rdt-m3"></canvas></div>
      </div>
    </div>
  `;

  const html = `
    <!-- Statut global compact -->
    <div class="global-status-compact gsc-${globalStatut}">
      <div class="gsc-indicator"></div>
      <div>
        <div class="gsc-label">${globalLabels[globalStatut]}</div>
        <div class="gsc-sub">${status.submitted.length}/5 services${status.complete
          ? ' · <strong style="color:var(--vert)">Flash complet</strong>'
          : ' · En attente : ' + status.missing.map(s => svcNames[s]).join(', ')}</div>
      </div>
      <div class="gsc-feux">
        ${['securite','production','qualite','maintenance','utilites'].map(s => {
          const ok = status.submitted.includes(s);
          return `<span class="feu ${ok?'feu-vert':'feu-gris'}" style="font-size:11px">${svcNames[s]}</span>`;
        }).join('')}
      </div>
    </div>

    <!-- KPIs compacts -->
    <div class="kpi-grid-compact">
      <div class="kpi-card-sm" style="--kpi-color:${prod?.m1_statut==='rouge'?'var(--rouge)':prod?.m1_statut==='orange'?'var(--orange)':'var(--vert)'}">
        <div class="kpi-label">Prod. M1</div>
        <div class="kpi-value">${prod?.m1_prod_cumul ?? '—'}<span style="font-size:12px"> t</span></div>
        <div class="kpi-unit">obj. ${prod?.m1_prod_cible ?? '—'} t</div>
      </div>
      <div class="kpi-card-sm" style="--kpi-color:${prod?.m3_statut==='rouge'?'var(--rouge)':prod?.m3_statut==='orange'?'var(--orange)':'var(--vert)'}">
        <div class="kpi-label">Prod. M3</div>
        <div class="kpi-value">${prod?.m3_prod_cumul ?? '—'}<span style="font-size:12px"> t</span></div>
        <div class="kpi-unit">obj. ${prod?.m3_prod_cible ?? '—'} t</div>
      </div>
      <div class="kpi-card-sm" style="--kpi-color:${parseFloat(prod?.m1_rdt_cumul)>=75?'var(--vert)':parseFloat(prod?.m1_rdt_cumul)>=60?'var(--orange)':'var(--rouge)'}">
        <div class="kpi-label">Rdt M1</div>
        <div class="kpi-value">${prod?.m1_rdt_cumul ?? '—'}<span style="font-size:12px">%</span></div>
        <div class="kpi-unit">cible ${prod?.m1_rdt_cible ?? '—'}</div>
      </div>
      <div class="kpi-card-sm" style="--kpi-color:${parseFloat(prod?.m3_rdt_cumul)>=90?'var(--vert)':parseFloat(prod?.m3_rdt_cumul)>=83?'var(--orange)':'var(--rouge)'}">
        <div class="kpi-label">Rdt M3</div>
        <div class="kpi-value">${prod?.m3_rdt_cumul ?? '—'}<span style="font-size:12px">%</span></div>
        <div class="kpi-unit">cible ${prod?.m3_rdt_cible ?? '—'}</div>
      </div>
      <div class="kpi-card-sm" style="--kpi-color:${impacts.length>0?'var(--rouge)':'var(--vert)'}">
        <div class="kpi-label">Pannes</div>
        <div class="kpi-value" style="color:${impacts.length>0?'var(--rouge)':'var(--vert)'}">${maint?impacts.length:'—'}</div>
        <div class="kpi-unit">impact prod.</div>
      </div>
      <div class="kpi-card-sm" style="--kpi-color:${+sec?.nb_evenements>0?'var(--orange)':'var(--vert)'}">
        <div class="kpi-label">Sécu</div>
        <div class="kpi-value" style="color:${+sec?.nb_evenements>0?'var(--orange)':'var(--vert)'}">${sec?(sec.nb_evenements??0):'—'}</div>
        <div class="kpi-unit">incident(s)</div>
      </div>
    </div>

    <!-- Accordéon services -->
    <div class="acc-stack">
      ${acc('securite',   'var(--securite)',   'Sécurité',    sec?.animateur||'',  !!sec,
        sec  ? feu(sec.couleur_globale,  sec.couleur_globale==='vert'?'OK':sec.couleur_globale==='orange'?'Vigilance':'Critique')  : '<span class="feu feu-gris">En attente</span>',
        secBody)}

      ${acc('production', 'var(--production)', 'Production',  prod?.animateur||'', !!prod,
        prod ? feu(prod.statut_global,   prod.statut_global==='vert'?'OK':prod.statut_global==='orange'?'Écart':'Critique')        : '<span class="feu feu-gris">En attente</span>',
        prodBody)}

      ${acc('qualite',    'var(--qualite)',    'Qualité',     qual?.animateur||'', !!qual,
        qual ? feu(qual.statut_global,   qual.statut_global==='vert'?'OK':qual.statut_global==='orange'?'Écart':'Critique')        : '<span class="feu feu-gris">En attente</span>',
        qualBody)}

      ${acc('maintenance','var(--maintenance)','Maintenance', maint?.animateur||'',!!maint,
        maint? feu(maint.statut_global,  maint.statut_global==='vert'?'OK':maint.statut_global==='orange'?'Risque':'Impact')       : '<span class="feu feu-gris">En attente</span>',
        maintBody)}

      ${acc('utilites',   '#0ea5e9',           'Utilités',    util?.animateur||'', !!util,
        util ? feu(util.statut_global,   util.statut_global==='vert'?'OK':util.statut_global==='orange'?'Vigilance':'Critique')    : '<span class="feu feu-gris">En attente</span>',
        utilBody)}

      <!-- Tendances / Grade -->
      <div class="acc-panel" id="acc-trends">
        <div class="acc-header" onclick="toggleAcc('trends')">
          <div class="acc-left">
            <div class="dot" style="background:var(--swm)"></div>
            <span class="acc-name">Tendances &amp; Grade</span>
            <span class="acc-animateur">${monthNames[+month]} ${year}</span>
          </div>
          <div class="acc-right"><span class="acc-chevron">›</span></div>
        </div>
        <div class="acc-body" id="acc-body-trends" style="display:none">${trendsBody}</div>
      </div>

    </div>
  `;

  document.getElementById('dashboard-content').innerHTML = html;
}

// ── ACCORDION TOGGLE ──────────────────────────────────
let trendsLoaded = false;

function toggleAcc(id) {
  const body  = document.getElementById('acc-body-' + id);
  const panel = document.getElementById('acc-' + id);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  panel?.classList.toggle('open', !isOpen);

  // Charger les graphiques au premier clic
  if (id === 'trends' && !isOpen && !trendsLoaded) {
    trendsLoaded = true;
    loadTrendCharts(document.getElementById('dash-date-picker').value);
  }
}

// ── CHARTS ────────────────────────────────────────────
let activeCharts = {};

function createChart(canvasId, color, dataReal, dataObj, unit, labels, prevData = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const datasets = [];
  datasets.push({
    label: prevData ? 'Grade actuel' : 'Réel',
    data: dataReal,
    borderColor: color,
    backgroundColor: color + '18',
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1.5,
    tension: 0.3,
    fill: !prevData,
    spanGaps: true,
  });
  if (prevData) {
    datasets.push({ label: 'Grade précédent', data: prevData, borderColor: '#94a3b8', borderDash: [6,4], borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#94a3b8', tension: 0.3, fill: false, spanGaps: true });
  } else if (dataObj) {
    datasets.push({ label: 'Objectif', data: dataObj, borderColor: '#f59e0b', borderDash: [5,4], borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#f59e0b', tension: 0.1, fill: false, spanGaps: true });
  }
  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 16 } },
        tooltip: { callbacks: { label: c => `${c.dataset.label} : ${c.parsed.y ?? '—'} ${unit}` } }
      },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,.3)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(51,65,85,.3)' } }
      }
    }
  });
  activeCharts[canvasId] = chart;
}

function resetChartArea() {
  Object.values(activeCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  activeCharts = {};
  const loadingEl = document.getElementById('trends-loading');
  const gridEl    = document.getElementById('trends-grid');
  if (loadingEl) { loadingEl.innerHTML = '<p>Chargement...</p>'; loadingEl.style.display = 'block'; }
  if (gridEl)    gridEl.style.display = 'none';
}

function groupIntoRuns(rows) {
  if (!rows.length) return [];
  const runs = []; let current = [rows[0]];
  for (let i = 1; i < rows.length; i++) {
    const diff = (new Date(rows[i].date+'T12:00:00') - new Date(rows[i-1].date+'T12:00:00')) / 86400000;
    if (diff <= 4) { current.push(rows[i]); } else { runs.push(current); current = [rows[i]]; }
  }
  runs.push(current);
  return runs;
}

function pad(arr, len) { return [...arr, ...Array(Math.max(0, len - arr.length)).fill(null)]; }
function extractField(run, field) { return run.map(r => { const v = parseFloat(r[field]); return isNaN(v) ? null : v; }); }

function setTrendsMode(mode) {
  currentTrendsMode = mode;
  ['month','grade','comparatif'].forEach(m => document.getElementById('tab-'+m)?.classList.toggle('active', m === mode));
  resetChartArea();
  const date = document.getElementById('dash-date-picker').value;
  if (mode === 'month')      loadTrendCharts(date);
  else if (mode === 'grade') loadGradeCharts(date);
  else                        loadComparativeCharts(date);
}

async function loadTrendCharts(date) {
  resetChartArea();
  const [year, month] = date.split('-');
  const monthNames = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const contextEl = document.getElementById('trends-context');
  const loadingEl = document.getElementById('trends-loading');
  const gridEl    = document.getElementById('trends-grid');
  if (!gridEl) return;
  if (contextEl) contextEl.textContent = `Données du mois de ${monthNames[+month]} ${year}`;

  try {
    const res = await fetch(`/api/monthly/${year}/${month}`);
    const byDate = await res.json();
    const dates = Object.keys(byDate).sort();
    if (!dates.length) { if (loadingEl) loadingEl.innerHTML = '<p>Aucune donnée pour ce mois.</p>'; return; }
    const labels = dates.map(d => new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}));
    const extract = (svc, fld) => dates.map(d => { const v = byDate[d]?.[svc]?.[fld]; const n = parseFloat(v); return isNaN(n)?null:n; });
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.style.display = 'grid';
    createChart('chart-prod-m1','#3b82f6',extract('production','m1_prod_cumul'),extract('production','m1_prod_cible'),'t',labels);
    createChart('chart-prod-m3','#10b981',extract('production','m3_prod_cumul'),extract('production','m3_prod_cible'),'t',labels);
    createChart('chart-phnr-m1','#8b5cf6',extract('production','m1_phnr_j1'),extract('production','m1_phnr_cible'),'kg/h',labels);
    createChart('chart-phnr-m3','#8b5cf6',extract('production','m3_phnr_j1'),extract('production','m3_phnr_cible'),'kg/h',labels);
    createChart('chart-rdt-m1','#22c55e',extract('production','m1_rdt_cumul'),extract('production','m1_rdt_cible'),'%',labels);
    createChart('chart-rdt-m3','#22c55e',extract('production','m3_rdt_cumul'),extract('production','m3_rdt_cible'),'%',labels);
  } catch(e) {
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--rouge)">Erreur de chargement.</p>';
    console.error(e);
  }
}

async function loadGradeCharts(date) {
  const contextEl = document.getElementById('trends-context');
  const loadingEl = document.getElementById('trends-loading');
  const gridEl    = document.getElementById('trends-grid');
  if (!gridEl) return;
  if (!currentM1Ref && !currentM3Ref) {
    if (contextEl) contextEl.textContent = '';
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--text2)">Aucune référence produit pour cette date.<br>Remplissez d\'abord le formulaire Production.</p>';
    return;
  }
  try {
    const m1Rows = currentM1Ref ? await fetch(`/api/grade?ref=${encodeURIComponent(currentM1Ref)}`).then(r=>r.json()) : [];
    const m3Rows = (currentM3Ref && currentM3Ref !== currentM1Ref) ? await fetch(`/api/grade?ref=${encodeURIComponent(currentM3Ref)}`).then(r=>r.json()) : m1Rows;
    const m1Run = groupIntoRuns(m1Rows.filter(r=>r.m1_ref===currentM1Ref)).at(-1) || [];
    const m3Run = groupIntoRuns(m3Rows.filter(r=>r.m3_ref===currentM3Ref)).at(-1) || [];
    const maxLen = Math.max(m1Run.length, m3Run.length, 1);
    const labels = Array.from({length:maxLen},(_,i)=>`J${i+1}`);
    const startDate = m1Run[0]?.date || m3Run[0]?.date || date;
    const startLabel = new Date(startDate+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'});
    const refLabel = [currentM1Ref, currentM3Ref!==currentM1Ref?currentM3Ref:null].filter(Boolean).join(' / ');
    if (contextEl) contextEl.textContent = `Grade "${refLabel}" — depuis le ${startLabel} · J${Math.max(m1Run.length,m3Run.length)}`;
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.style.display = 'grid';
    createChart('chart-prod-m1','#3b82f6',pad(extractField(m1Run,'m1_prod_cumul'),maxLen),pad(extractField(m1Run,'m1_prod_cible'),maxLen),'t',labels);
    createChart('chart-prod-m3','#10b981',pad(extractField(m3Run,'m3_prod_cumul'),maxLen),pad(extractField(m3Run,'m3_prod_cible'),maxLen),'t',labels);
    createChart('chart-phnr-m1','#8b5cf6',pad(extractField(m1Run,'m1_phnr_j1'),maxLen),pad(extractField(m1Run,'m1_phnr_cible'),maxLen),'kg/h',labels);
    createChart('chart-phnr-m3','#8b5cf6',pad(extractField(m3Run,'m3_phnr_j1'),maxLen),pad(extractField(m3Run,'m3_phnr_cible'),maxLen),'kg/h',labels);
    createChart('chart-rdt-m1','#22c55e',pad(extractField(m1Run,'m1_rdt_cumul'),maxLen),pad(extractField(m1Run,'m1_rdt_cible'),maxLen),'%',labels);
    createChart('chart-rdt-m3','#22c55e',pad(extractField(m3Run,'m3_rdt_cumul'),maxLen),pad(extractField(m3Run,'m3_rdt_cible'),maxLen),'%',labels);
  } catch(e) {
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--rouge)">Erreur de chargement du grade.</p>';
    console.error(e);
  }
}

async function loadComparativeCharts(date) {
  const contextEl = document.getElementById('trends-context');
  const loadingEl = document.getElementById('trends-loading');
  const gridEl    = document.getElementById('trends-grid');
  if (!gridEl) return;
  if (!currentM1Ref && !currentM3Ref) {
    if (contextEl) contextEl.textContent = '';
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--text2)">Aucune référence produit pour cette date.</p>';
    return;
  }
  try {
    const m1Rows = currentM1Ref ? await fetch(`/api/grade?ref=${encodeURIComponent(currentM1Ref)}`).then(r=>r.json()) : [];
    const m3Rows = (currentM3Ref && currentM3Ref !== currentM1Ref) ? await fetch(`/api/grade?ref=${encodeURIComponent(currentM3Ref)}`).then(r=>r.json()) : m1Rows;
    const m1Runs = groupIntoRuns(m1Rows.filter(r=>r.m1_ref===currentM1Ref));
    const m3Runs = groupIntoRuns(m3Rows.filter(r=>r.m3_ref===currentM3Ref));
    const m1Cur=m1Runs.at(-1)||[], m1Prev=m1Runs.at(-2)||[];
    const m3Cur=m3Runs.at(-1)||[], m3Prev=m3Runs.at(-2)||[];
    if (!m1Prev.length && !m3Prev.length) {
      if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--text2);line-height:1.7">Aucun grade précédent pour cette référence.<br>Le comparatif nécessite au moins <strong>2 passages</strong> sur ce produit.</p>';
      return;
    }
    const maxLen = Math.max(m1Cur.length,m1Prev.length,m3Cur.length,m3Prev.length,1);
    const labels = Array.from({length:maxLen},(_,i)=>`J${i+1}`);
    const fmtD = run => run[0]?.date ? new Date(run[0].date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '—';
    if (contextEl) contextEl.textContent = `Comparatif : grade actuel (dép. ${fmtD(m1Cur)}) vs grade précédent (dép. ${fmtD(m1Prev)})`;
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.style.display = 'grid';
    createChart('chart-prod-m1','#3b82f6',pad(extractField(m1Cur,'m1_prod_cumul'),maxLen),null,'t',labels,pad(extractField(m1Prev,'m1_prod_cumul'),maxLen));
    createChart('chart-prod-m3','#10b981',pad(extractField(m3Cur,'m3_prod_cumul'),maxLen),null,'t',labels,pad(extractField(m3Prev,'m3_prod_cumul'),maxLen));
    createChart('chart-phnr-m1','#8b5cf6',pad(extractField(m1Cur,'m1_phnr_j1'),maxLen),null,'kg/h',labels,pad(extractField(m1Prev,'m1_phnr_j1'),maxLen));
    createChart('chart-phnr-m3','#8b5cf6',pad(extractField(m3Cur,'m3_phnr_j1'),maxLen),null,'kg/h',labels,pad(extractField(m3Prev,'m3_phnr_j1'),maxLen));
    createChart('chart-rdt-m1','#22c55e',pad(extractField(m1Cur,'m1_rdt_cumul'),maxLen),null,'%',labels,pad(extractField(m1Prev,'m1_rdt_cumul'),maxLen));
    createChart('chart-rdt-m3','#22c55e',pad(extractField(m3Cur,'m3_rdt_cumul'),maxLen),null,'%',labels,pad(extractField(m3Prev,'m3_rdt_cumul'),maxLen));
  } catch(e) {
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--rouge)">Erreur de chargement du comparatif.</p>';
    console.error(e);
  }
}

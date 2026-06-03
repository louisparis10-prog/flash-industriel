// ── STATE ─────────────────────────────────────────────
let currentDate = new Date().toISOString().slice(0, 10);
let formData = {};
let currentM1Ref = null;
let currentM3Ref = null;
let currentTrendsMode = 'month';

// ── AUTO-RESIZE TEXTAREAS ─────────────────────────────
function autoResize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}
function autoResizeAll() {
  document.querySelectorAll('textarea').forEach(autoResize);
}
// Grandir à chaque frappe
document.addEventListener('input', e => {
  if (e.target.tagName === 'TEXTAREA') autoResize(e.target);
});

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('session-date').value = today;
  document.getElementById('dash-date-picker').value = today;
  currentDate = today;
  updateHeaderDate();
  checkStatus();
  initForms();
  autoResizeAll();
  injectStatutLegends();

  // Fermer le menu mobile en cliquant en dehors
  document.addEventListener('click', e => {
    const menu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger');
    if (menu?.classList.contains('open') && !menu.contains(e.target) && !hamburger?.contains(e.target)) {
      closeMobileMenu();
    }
  });
});

/* ── Légendes visuelles par indicateur ── */
const STATUT_LEGENDS = {
  couleur_globale:      { vert: ['Journée nominale',    'Aucun incident signalé'],          orange: ['Vigilance',        'Événement mineur déclaré'],            rouge: ['Alerte',           'Incident grave en cours']               },
  gravite:              { vert: ['Faible',              'Sans conséquence sur les personnes'], orange: ['Modérée',         'Soins requis ou presque-accident'],    rouge: ['Grave',            'Accident avec arrêt ou danger immédiat'] },
  clarification_statut: { vert: ['Conforme',            'Turbidité dans les normes'],        orange: ['Surveillance',     'Paramètre hors seuil'],                rouge: ['Hors normes',      'Action corrective requise']             },
  zone_dechets_statut:  { vert: ['Conforme',            'Zone propre, tri respecté'],        orange: ['Écart',            'Désordre ou tri non respecté'],        rouge: ['Non-conforme',     'Déchets dangereux mal stockés']         },
  incendie_statut:      { vert: ['Opérationnel',        'Tous équipements fonctionnels'],    orange: ['Vigilance',        'Équipement non critique défaillant'],  rouge: ['Critique',         'Équipement vital hors service']         },
  step1_statut:         { vert: ['Nominal',             'Fonctionnement conforme'],          orange: ['Anomalie',         'Paramètre hors seuil, en traitement'], rouge: ['Critique',         'Risque de rejet non conforme']          },
  statut_global:        { vert: ['Nominal',             'Tous équipements opérationnels'],   orange: ['Dégradé',          'Un ou plusieurs équipements en anomalie'], rouge: ['Critique',     'Équipement vital en panne']             },
  biomasse_statut:      { vert: ['En marche',           'Production de vapeur nominale'],    orange: ['Dégradé',          'Fonctionnement en dessous du nominal'], rouge: ['Arrêt',            'Hors service non planifié']             },
  gaz_statut:           { vert: ['Disponible',          'Prête ou en fonctionnement'],       orange: ['Partiel',          'Disponibilité réduite'],               rouge: ['Indisponible',     'Chaudière hors service']                },
  dalkia_statut:        { vert: ['Normal',              'Toutes chaudières opérationnelles'],orange: ['Dégradé',          'Chaudière(s) en bouillotte ou arrêtée'],rouge: ['Critique',         'Absence de vapeur']                    },
  air_statut:           { vert: ['Nominal',             'Pression dans les plages normales'],orange: ['Basse pression',   'Surveillance requise'],                rouge: ['Critique',         'Chute de pression / panne compresseur'] },
  clim_statut:          { vert: ['Normal',              'Temp. & hygrométrie nominales'],    orange: ['Écart',            'Température hors consigne'],           rouge: ['Panne',            'Climatisation hors service']            },
  effacement_statut:    { vert: ['Disponible',          'Capacité d\'effacement nominale'],  orange: ['Réduit',           'Capacité d\'effacement partielle'],    rouge: ['Indisponible',     'Effacement impossible']                 },
  m1_statut:            { vert: ['Objectifs atteints',  'Production dans les cibles'],       orange: ['Écart',            'Un ou plusieurs objectifs non atteints'], rouge: ['Critique',     'Arrêt ou production très dégradée']     },
  m3_statut:            { vert: ['Objectifs atteints',  'Production dans les cibles'],       orange: ['Écart',            'Un ou plusieurs objectifs non atteints'], rouge: ['Critique',     'Arrêt ou production très dégradée']     },
  m1_resultat:          { vert: ['Conforme',            'Qualité dans les spécifications'],  orange: ['Écart',            'Non-conformité mineure en traitement'],rouge: ['Non-conforme',     'Qualité hors spécifications']           },
  m3_resultat:          { vert: ['Conforme',            'Qualité dans les spécifications'],  orange: ['Écart',            'Non-conformité mineure en traitement'],rouge: ['Non-conforme',     'Qualité hors spécifications']           },
  m1_tc_statut:         { vert: ['Dans l\'objectif',    'Taux de casse acceptable'],         orange: ['Élevé',            'Taux au-dessus de l\'objectif'],       rouge: ['Critique',         'Taux de casse très élevé']              },
  m3_tc_statut:         { vert: ['Dans l\'objectif',    'Taux de casse acceptable'],         orange: ['Élevé',            'Taux au-dessus de l\'objectif'],       rouge: ['Critique',         'Taux de casse très élevé']              },
  zone_mt1:             { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_mt3:             { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_charg1:          { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_charg3:          { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_prep1:           { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_prep3:           { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_fin1:            { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  zone_fin3:            { vert: ['Conforme',            'Aucune non-conformité relevée'],    orange: ['Écart mineur',     'Non-conformité en cours de traitement'],rouge: ['Non-conforme',     'Non-conformité grave non résolue']      },
  impact_0_urgence:     {                                                                     orange: ['Moyen',            'Impact indirect sur la production'],   rouge: ['Urgent',           'Impact direct — intervention sous 24h'] },
  point_0_statut:       { vert: ['Soldé',               'Action réalisée et clôturée'],      orange: ['En cours',         'Action engagée, dans les délais'],     rouge: ['En retard',        'Délai dépassé, escalade requise']       },
};

function injectStatutLegends() {
  document.querySelectorAll('.statut-group').forEach(group => {
    if (group.parentElement?.classList.contains('statut-group-wrap')) return;

    const field = group.querySelector('[data-field]')?.dataset.field || '';
    const cfg = STATUT_LEGENDS[field];

    const legend = document.createElement('div');
    legend.className = 'statut-legend-block';

    const colorDefs = [
      { key: 'vert',   cls: 'slb-vert'   },
      { key: 'orange', cls: 'slb-orange' },
      { key: 'rouge',  cls: 'slb-rouge'  },
    ];

    let html = '';
    colorDefs.forEach(({ key, cls }) => {
      const data = cfg?.[key];
      const title = data?.[0] || (key === 'vert' ? 'Normal' : key === 'orange' ? 'Écart' : 'Critique');
      const desc  = data?.[1] || '';
      if (!data && !cfg) {
        // fallback générique
      }
      if (cfg && !cfg[key]) return; // ex: urgence sans vert
      html += `<div class="slb-item ${cls}">
        <span class="slb-dot"></span>
        <div>
          <div class="slb-title">${key.charAt(0).toUpperCase() + key.slice(1)} — ${title}</div>
          ${desc ? `<div class="slb-desc">${desc}</div>` : ''}
        </div>
      </div>`;
    });

    // Fallback si champ non trouvé
    if (!html) {
      html =
        '<div class="slb-item slb-vert"><span class="slb-dot"></span><div><div class="slb-title">Vert — Normal</div><div class="slb-desc">Situation nominale</div></div></div>' +
        '<div class="slb-item slb-orange"><span class="slb-dot"></span><div><div class="slb-title">Orange — Écart</div><div class="slb-desc">Vigilance requise</div></div></div>' +
        '<div class="slb-item slb-rouge"><span class="slb-dot"></span><div><div class="slb-title">Rouge — Critique</div><div class="slb-desc">Action immédiate requise</div></div></div>';
    }

    legend.innerHTML = html;

    const wrap = document.createElement('div');
    wrap.className = 'statut-group-wrap';
    group.parentNode.insertBefore(wrap, group);
    wrap.appendChild(group);
    wrap.appendChild(legend);
  });
}

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
    if (b.dataset.page === name) b.classList.add('active');
  });
  if (name === 'dashboard') {
    document.getElementById('dash-date-picker').value = currentDate;
    loadDashboard();
  }
  // Pré-remplir le formulaire avec les données déjà soumises
  const services = ['securite','production','qualite','maintenance','utilites'];
  if (services.includes(name)) {
    const form = document.getElementById('form-' + name);
    if (form) loadFormData(name, form);
    else autoResizeAll();
  } else {
    autoResizeAll();
  }
  // Fermer le menu mobile si ouvert
  closeMobileMenu();
  // Sync active state des boutons mobile
  document.querySelectorAll('.mob-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === name);
  });
  window.scrollTo(0, 0);
}

// ── MENU MOBILE ───────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    closeMobileMenu();
  } else {
    menu.classList.add('open');
    btn.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  if (!menu) return;
  menu.classList.remove('open');
  btn?.classList.remove('open');
  document.body.style.overflow = '';
}

function onMobileSearch(value) {
  const q = value.trim();
  const panel = document.getElementById('mobile-search-results');
  if (!panel) return;
  clearTimeout(_searchTimer);
  if (q.length < 2) { panel.innerHTML = ''; return; }
  _searchTimer = setTimeout(async () => {
    panel.innerHTML = `<div class="sr-loading">Recherche…</div>`;
    try {
      const res  = await fetch('/api/search?q=' + encodeURIComponent(q));
      const data = await res.json();
      if (!data.length) {
        panel.innerHTML = `<div class="sr-empty">Aucun résultat pour "<strong>${q}</strong>"</div>`;
        return;
      }
      const byDate = {};
      data.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });
      let html = '';
      Object.entries(byDate).forEach(([date, items]) => {
        html += `<div class="sr-group">
          <div class="sr-date" onclick="selectMobileSearchDate('${date}')">${formatDateLabel(date)}</div>`;
        items.forEach(item => {
          const snippets = extractSnippets(item.data, q);
          const col = svcColors[item.service] || 'var(--text2)';
          html += `<div class="sr-item" onclick="selectMobileSearchDate('${item.date}')">
            <span class="sr-badge" style="background:${col}20;color:${col}">${svcLabels[item.service]||item.service}</span>
            ${snippets.length
              ? snippets.map(s => `<div class="sr-snippet">${s}</div>`).join('')
              : `<div class="sr-snippet" style="color:var(--text2);font-style:italic">Correspondance dans les données</div>`}
          </div>`;
        });
        html += '</div>';
      });
      panel.innerHTML = html;
    } catch(e) {
      panel.innerHTML = '<div class="sr-empty" style="color:var(--rouge)">Erreur de connexion.</div>';
    }
  }, 380);
}

function selectMobileSearchDate(date) {
  closeMobileMenu();
  const mInput = document.getElementById('mobile-search');
  if (mInput) { mInput.value = ''; document.getElementById('mobile-search-results').innerHTML = ''; }
  document.getElementById('dash-date-picker').value = date;
  currentDate = date;
  updateHeaderDate();
  showPage('dashboard');
}

// ── PRÉ-REMPLISSAGE DES FORMULAIRES ───────────────────
async function loadFormData(service, form) {
  if (!currentDate) return;
  try {
    const res = await fetch('/api/submissions/' + currentDate);
    const allData = await res.json();
    const saved = allData[service];
    if (!saved) return;

    // Pour maintenance : recréer les événements dynamiques si nécessaire
    if (service === 'maintenance') {
      // Réinitialiser les compteurs et supprimer les éléments dynamiques existants
      ['impact','risque','point'].forEach(type => {
        const containerId = type === 'point' ? 'points-container' : 'events-' + type + '-container';
        const container = document.getElementById(containerId);
        if (container) container.querySelectorAll('.event-item').forEach((el, i) => { if (i > 0) el.remove(); });
        eventCounts[type] = 1;
      });
      // Recréer les événements sauvegardés (index 1+)
      for (let i = 1; i < 10; i++) {
        if (saved['impact_' + i + '_desc']) addEvent('impact'); else break;
      }
      for (let i = 1; i < 10; i++) {
        if (saved['risque_' + i + '_desc']) addEvent('risque'); else break;
      }
      for (let i = 1; i < 10; i++) {
        if (saved['point_' + i + '_desc']) addEvent('point'); else break;
      }
    }

    // Remplir tous les champs texte, textarea, select
    form.querySelectorAll('[name]').forEach(el => {
      const val = saved[el.name];
      if (val !== undefined && val !== null) el.value = val;
    });

    // Sélectionner les boutons statut
    form.querySelectorAll('.statut-group').forEach(group => {
      const firstBtn = group.querySelector('.statut-btn');
      if (!firstBtn) return;
      const field = firstBtn.dataset.field;
      const val = saved[field];
      if (!val) return;
      group.querySelectorAll('.statut-btn').forEach(b => b.classList.remove('selected'));
      const match = group.querySelector(`.statut-btn[data-val="${val}"]`);
      if (match) match.classList.add('selected');
    });

    // Afficher les commentaires de zone si statut orange/rouge
    form.querySelectorAll('.statut-btn.selected').forEach(btn => {
      if (btn.dataset.val === 'orange' || btn.dataset.val === 'rouge') {
        const commentEl = document.getElementById('zone-comment-' + btn.dataset.field);
        if (commentEl) { commentEl.style.display = 'block'; commentEl.classList.add('zone-comment-visible'); }
      }
    });

    // Ajuster la hauteur de toutes les textareas après remplissage
    autoResizeAll();

  } catch(e) {
    console.error('loadFormData error:', e);
  }
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
    btn.dataset.init = '1'; // marquer pour éviter les double-listeners dans addEvent()
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

  try {
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
  } catch (e) {
    document.getElementById('dashboard-content').innerHTML =
      `<div style="text-align:center;padding:60px 20px;color:var(--rouge)">
        <div style="font-size:32px;margin-bottom:12px">⚠️</div>
        <div style="font-weight:700;margin-bottom:6px">Erreur de chargement</div>
        <div style="font-size:13px;color:var(--text2)">${e.message}</div>
      </div>`;
  }
}

function feu(val, label = '') {
  if (!val) return `<span class="feu feu-gris">— ${label}</span>`;
  return `<span class="feu feu-${val}">${label || val}</span>`;
}

// Gère les décimales françaises (virgule) et les ranges (→, /)
function parseFr(val) {
  if (val === null || val === undefined) return NaN;
  const s = String(val).replace(',', '.').split(/[→/]/)[0].trim();
  return parseFloat(s);
}

function pct(reel, obj) {
  const r = parseFr(reel), o = parseFr(obj);
  if (isNaN(r) || isNaN(o) || o === 0) return null;
  return Math.round((r / o) * 100);
}

function isRange(val) {
  return val != null && /[→/,]/.test(String(val)) && isNaN(parseFloat(String(val).replace(',','.')));
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

  // Statut global Utilités dérivé des zones individuelles
  const utilZoneKeys = ['clarification_statut','zone_dechets_statut','incendie_statut','step1_statut','biomasse_statut','gaz_statut','dalkia_statut','air_statut','clim_statut','effacement_statut'];
  const utilZoneVals = util ? utilZoneKeys.map(k => util[k]).filter(Boolean) : [];
  const utilStatutGlobal = util?.statut_global || (utilZoneVals.includes('rouge') ? 'rouge' : utilZoneVals.includes('orange') ? 'orange' : utilZoneVals.length > 0 ? 'vert' : null);

  // Mémoriser les refs produit pour les graphiques grade
  currentM1Ref = prod?.m1_ref || null;
  currentM3Ref = prod?.m3_ref || null;
  currentTrendsMode = 'month';

  // Statut global
  const statuts = [sec?.couleur_globale, prod?.statut_global, qual?.statut_global, maint?.statut_global, utilStatutGlobal].filter(Boolean);
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
    if (val === null || val === undefined || val === '') return '';
    return `<div class="db-simple"><span class="db-simple-label">${label}</span><span class="db-simple-val" style="color:${color}">${val}${sub ? `<span style="font-size:11px;color:var(--text2);font-weight:400;margin-left:4px">${sub}</span>` : ''}</span></div>`;
  }
  function dbInfo(text, bg = 'var(--bg3)', color = 'var(--text2)') {
    if (text === null || text === undefined || text === '') return '';
    return `<div class="db-info" style="background:${bg};color:${color}">${text}</div>`;
  }
  function dbNote(label, text, color = 'var(--text)') {
    if (text === null || text === undefined || text === '') return '';
    return `<div class="db-note"><div class="db-note-label">${label}</div><div class="db-note-body" style="color:${color}">${text}</div></div>`;
  }

  // ── Helper : panneau accordéon ──
  function acc(id, color, name, animateur, hasData, statusHtml, bodyHtml) {
    return `
      <div class="acc-panel ${hasData ? '' : 'acc-missing'}" id="acc-${id}">
        <div class="acc-header" ${hasData ? `onclick="toggleAcc('${id}')"` : ''}>
          <div class="acc-left">
            <div class="dot" style="background:${color}"></div>
            <span class="acc-name">${name}</span>
            <span class="acc-animateur">${animateur}</span>
            ${statusHtml}
          </div>
          <div class="acc-right">
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
        <div class="db-machine-header">Machine 1 ${feu(prod.m1_statut)}</div>
        ${dbProgress('Production', prod.m1_prod_cumul, prod.m1_prod_cible, 't')}
        ${String(prod.m1_rdt_cible||'').includes('/') ? dbSimple('Rendement', prod.m1_rdt_cumul != null ? prod.m1_rdt_cumul+'%' : null, 'cible '+prod.m1_rdt_cible) : dbProgress('Rendement', prod.m1_rdt_cumul, parseFloat(prod.m1_rdt_cible)||null, '%')}
        ${dbSimple('PHNR J-1', prod.m1_phnr_j1 ? prod.m1_phnr_j1+' kg/h' : null, prod.m1_phnr_cible ? 'obj. '+prod.m1_phnr_cible : '')}
        ${dbSimple('Arrêts cumulés', prod.m1_arret_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('Casse', prod.m1_casse_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('CDC', prod.m1_cdc_cumul||null, prod.m1_cdc_cible ? 'obj. '+prod.m1_cdc_cible : '')}
        ${dbNote('Événements en cours / Informations', prod.m1_info||null)}
      </div>
      <div>
        <div class="db-machine-header">Machine 3 ${feu(prod.m3_statut)}</div>
        ${dbProgress('Production', prod.m3_prod_cumul, prod.m3_prod_cible, 't')}
        ${String(prod.m3_rdt_cible||'').includes('/') ? dbSimple('Rendement', prod.m3_rdt_cumul != null ? prod.m3_rdt_cumul+'%' : null, 'cible '+prod.m3_rdt_cible) : dbProgress('Rendement', prod.m3_rdt_cumul, parseFloat(prod.m3_rdt_cible)||null, '%')}
        ${dbSimple('PHNR J-1', prod.m3_phnr_j1 ? prod.m3_phnr_j1+' kg/h' : null, prod.m3_phnr_cible ? 'obj. '+prod.m3_phnr_cible : '')}
        ${dbSimple('Arrêts cumulés', prod.m3_arret_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('Casse', prod.m3_casse_cumul||null, '', 'var(--rouge)')}
        ${dbSimple('CDC', prod.m3_cdc_cumul||null, prod.m3_cdc_cible ? 'obj. '+prod.m3_cdc_cible : '')}
        ${dbNote('Événements en cours / Informations', prod.m3_info||null)}
      </div>
    </div>
    ${prod.commentaire_general ? dbNote('Commentaire général', prod.commentaire_general) : ''}
  ` : '';

  // ── Corps Qualité ──
  const tcRange = v => v != null && /[→,]/.test(String(v)) && String(v).includes('→');
  const qualBody = qual ? `
    <div class="db-machines">
      <div>
        <div class="db-machine-header">Machine 1 ${feu(qual.m1_resultat)}</div>
        ${qual.m1_tc_reel != null ? (tcRange(qual.m1_tc_cible) ? dbSimple('TC %', qual.m1_tc_reel+'%', 'cible '+qual.m1_tc_cible) : dbProgress('TC %', parseFr(qual.m1_tc_reel), parseFr(qual.m1_tc_cible)||null, '%')) : ''}
        ${qual.m1_perco_reel != null ? dbProgress('E% Perco', parseFr(qual.m1_perco_reel), parseFr(qual.m1_perco_cible)||null, '%') : ''}
        ${qual.m1_pir && qual.m1_pir !== 'Non Applicable' ? dbSimple('PIR', qual.m1_pir) : ''}
        ${qual.m1_autre_resultat ? dbNote('Résultats', qual.m1_autre_resultat) : ''}
        ${qual.m1_fait_marquant ? dbNote('Fait marquant', qual.m1_fait_marquant, 'var(--orange)') : ''}
        ${qual.m1_demande_cq ? dbSimple('Demande CQ', qual.m1_demande_cq) : ''}
        ${qual.m1_consigne ? dbNote('Consigne', qual.m1_consigne, '#2563eb') : ''}
      </div>
      <div>
        <div class="db-machine-header">Machine 3 ${feu(qual.m3_resultat)}</div>
        ${qual.m3_tc_reel != null ? (tcRange(qual.m3_tc_cible) ? dbSimple('TC %', qual.m3_tc_reel+'%', 'cible '+qual.m3_tc_cible) : dbProgress('TC %', parseFr(qual.m3_tc_reel), parseFr(qual.m3_tc_cible)||null, '%')) : ''}
        ${qual.m3_perco_reel != null ? dbProgress('E% Perco', parseFr(qual.m3_perco_reel), parseFr(qual.m3_perco_cible)||null, '%') : ''}
        ${qual.m3_pir && qual.m3_pir !== 'Non Applicable' ? dbSimple('PIR', qual.m3_pir) : ''}
        ${qual.m3_autre_resultat ? dbNote('Résultats', qual.m3_autre_resultat) : ''}
        ${qual.m3_fait_marquant ? dbNote('Fait marquant', qual.m3_fait_marquant, 'var(--orange)') : ''}
        ${qual.m3_demande_cq ? dbSimple('Demande CQ', qual.m3_demande_cq) : ''}
        ${qual.m3_consigne ? dbNote('Consigne', qual.m3_consigne, '#2563eb') : ''}
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
    ${points.length > 0 ? `
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
        <div class="db-section-title">Points à investiguer (${points.length})</div>
        ${points.map(p => `
          <div class="db-point-item">
            <div class="db-point-dot" style="background:var(--${p.statut})"></div>
            <div class="db-point-body">
              <div class="db-point-desc">${p.desc}</div>
              <div class="db-point-meta">
                ${p.machine !== '—' ? `<span>${p.machine}</span>` : ''}
                ${p.responsable !== '—' ? `<span>${p.responsable}</span>` : ''}
                ${p.delai !== '—' ? `<span>↻ ${p.delai}</span>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>` : ''}
    ${maint.commentaire_general ? dbNote('Commentaire général', maint.commentaire_general) : ''}
  ` : '';

  // ── Corps Utilités ──
  const utilRows = [
    ['Clarification','clarification'], ['Zone déchets','zone_dechets'],
    ['Protection incendie','incendie'], ['STEP','step1'],
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
      ${standardChartsHTML()}
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
    <div class="kpi-groups">
      <!-- Groupe Machine 1 -->
      <div class="kpi-machine-group">
        <div class="kpi-machine-label">Machine 1</div>
        <div class="kpi-machine-cards">
          <div class="kpi-card-sm" style="--kpi-color:${prod?.m1_statut==='rouge'?'var(--rouge)':prod?.m1_statut==='orange'?'var(--orange)':'var(--vert)'}">
            <div class="kpi-label">Production</div>
            <div class="kpi-value">${prod?.m1_prod_cumul ?? '—'}<span style="font-size:12px"> t</span></div>
            <div class="kpi-unit">obj. ${prod?.m1_prod_cible ?? '—'} t</div>
          </div>
          <div class="kpi-card-sm" style="--kpi-color:${parseFloat(prod?.m1_rdt_cumul)>=75?'var(--vert)':parseFloat(prod?.m1_rdt_cumul)>=60?'var(--orange)':'var(--rouge)'}">
            <div class="kpi-label">Rendement</div>
            <div class="kpi-value">${prod?.m1_rdt_cumul ?? '—'}<span style="font-size:12px">%</span></div>
            <div class="kpi-unit">cible ${prod?.m1_rdt_cible ?? '—'}</div>
          </div>
        </div>
      </div>
      <!-- Groupe Machine 3 -->
      <div class="kpi-machine-group">
        <div class="kpi-machine-label">Machine 3</div>
        <div class="kpi-machine-cards">
          <div class="kpi-card-sm" style="--kpi-color:${prod?.m3_statut==='rouge'?'var(--rouge)':prod?.m3_statut==='orange'?'var(--orange)':'var(--vert)'}">
            <div class="kpi-label">Production</div>
            <div class="kpi-value">${prod?.m3_prod_cumul ?? '—'}<span style="font-size:12px"> t</span></div>
            <div class="kpi-unit">obj. ${prod?.m3_prod_cible ?? '—'} t</div>
          </div>
          <div class="kpi-card-sm" style="--kpi-color:${parseFloat(prod?.m3_rdt_cumul)>=90?'var(--vert)':parseFloat(prod?.m3_rdt_cumul)>=83?'var(--orange)':'var(--rouge)'}">
            <div class="kpi-label">Rendement</div>
            <div class="kpi-value">${prod?.m3_rdt_cumul ?? '—'}<span style="font-size:12px">%</span></div>
            <div class="kpi-unit">cible ${prod?.m3_rdt_cible ?? '—'}</div>
          </div>
        </div>
      </div>
      <!-- Pannes + Sécu -->
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
        maint? feu(maint.statut_global||'rouge', maint.statut_global==='vert'?'OK':maint.statut_global==='orange'?'Risque':'Impact') : '<span class="feu feu-gris">En attente</span>',
        maintBody)}

      ${acc('utilites',   '#0ea5e9',           'Utilités',    util?.animateur||'', !!util,
        util ? feu(utilStatutGlobal, utilStatutGlobal==='vert'?'OK':utilStatutGlobal==='orange'?'Vigilance':'Critique')            : '<span class="feu feu-gris">En attente</span>',
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

// ── RECHERCHE GLOBALE ─────────────────────────────────
const svcLabels = { securite:'Sécurité', production:'Production', qualite:'Qualité', maintenance:'Maintenance', utilites:'Utilités' };
const svcColors = { securite:'var(--securite)', production:'var(--production)', qualite:'var(--qualite)', maintenance:'var(--maintenance)', utilites:'#0ea5e9' };

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function extractSnippets(data, q) {
  const results = [];
  const lq = q.toLowerCase();
  // Champs exclus (non pertinents pour l'affichage)
  const skip = new Set(['animateur','statut_global','m1_statut','m3_statut','m1_ref','m3_ref','m1_produit','m3_produit','couleur_globale','gravite']);
  Object.entries(data).forEach(([key, val]) => {
    if (skip.has(key)) return;
    const str = String(val ?? '');
    if (str.length < 3 || !str.toLowerCase().includes(lq)) return;
    const idx = str.toLowerCase().indexOf(lq);
    const s = Math.max(0, idx - 60);
    const e = Math.min(str.length, idx + q.length + 60);
    const raw = (s > 0 ? '…' : '') + str.slice(s, e) + (e < str.length ? '…' : '');
    results.push(raw.replace(new RegExp(escapeRegex(q), 'gi'), m => `<mark class="sh">${m}</mark>`));
    if (results.length >= 2) return;
  });
  return results;
}

let _searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('global-search');
  const clearBtn = document.getElementById('search-clear');

  input.addEventListener('input', function() {
    clearBtn.style.display = this.value ? 'flex' : 'none';
    clearTimeout(_searchTimer);
    const q = this.value.trim();
    if (q.length < 2) { closeSearch(); return; }
    _searchTimer = setTimeout(() => runSearch(q), 380);
  });

  input.addEventListener('focus', function() {
    if (this.value.trim().length >= 2) document.getElementById('search-results').classList.add('open');
  });

  // Fermer en cliquant à l'extérieur
  document.addEventListener('click', e => {
    if (!e.target.closest('.header-search')) closeSearch();
  });
});

function clearSearch() {
  const input = document.getElementById('global-search');
  input.value = '';
  document.getElementById('search-clear').style.display = 'none';
  closeSearch();
  input.focus();
}

function closeSearch() {
  document.getElementById('search-results')?.classList.remove('open');
}

async function runSearch(q) {
  const panel = document.getElementById('search-results');
  panel.innerHTML = `<div class="sr-loading">Recherche de "<strong>${q}</strong>"…</div>`;
  panel.classList.add('open');
  try {
    const res  = await fetch('/api/search?q=' + encodeURIComponent(q));
    const data = await res.json();

    if (!data.length) {
      panel.innerHTML = `<div class="sr-empty">Aucun résultat pour "<strong>${q}</strong>"</div>`;
      return;
    }

    // Grouper par date
    const byDate = {};
    data.forEach(r => { (byDate[r.date] = byDate[r.date] || []).push(r); });

    const total = data.length;
    let html = `<div class="sr-header">${total} résultat${total>1?'s':''} · <em>${q}</em></div>`;

    Object.entries(byDate).forEach(([date, items]) => {
      html += `<div class="sr-group">
        <div class="sr-date" onclick="selectSearchDate('${date}')">${formatDateLabel(date)}</div>`;
      items.forEach(item => {
        const snippets = extractSnippets(item.data, q);
        const col = svcColors[item.service] || 'var(--text2)';
        html += `<div class="sr-item" onclick="selectSearchDate('${item.date}')">
          <span class="sr-badge" style="background:${col}20;color:${col}">${svcLabels[item.service]||item.service}</span>
          ${snippets.length
            ? snippets.map(s => `<div class="sr-snippet">${s}</div>`).join('')
            : `<div class="sr-snippet" style="color:var(--text2);font-style:italic">Correspondance dans les données</div>`}
        </div>`;
      });
      html += '</div>';
    });

    panel.innerHTML = html;
  } catch(e) {
    panel.innerHTML = '<div class="sr-empty" style="color:var(--rouge)">Erreur de connexion.</div>';
  }
}

function selectSearchDate(date) {
  closeSearch();
  const input = document.getElementById('global-search');
  if (input) { input.value = ''; document.getElementById('search-clear').style.display = 'none'; }
  document.getElementById('dash-date-picker').value = date;
  currentDate = date;
  updateHeaderDate();
  showPage('dashboard');
}

// ── RÉCAP CDF ─────────────────────────────────────────
let recapData = null;
let recapPeriod = 7;

function toggleRecap() {
  const drawer  = document.getElementById('recap-drawer');
  const overlay = document.getElementById('recap-overlay');
  const isOpen  = drawer?.classList.contains('open');
  if (isOpen) {
    closeRecap();
  } else {
    drawer?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!recapData) loadRecap();
  }
}

function closeRecap() {
  document.getElementById('recap-drawer')?.classList.remove('open');
  document.getElementById('recap-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Fermer avec Échap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeRecap(); closeSearch(); closeMobileMenu(); }
});

async function setRecapPeriod(days) {
  recapPeriod = days;
  document.querySelectorAll('.recap-period-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.days === days);
  });
  if (recapData) renderRecap();
  else await loadRecap();
}

async function loadRecap() {
  const el = document.getElementById('recap-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text2)">Chargement…</div>';
  try {
    const res = await fetch('/api/recap?days=30');
    recapData = await res.json();
    renderRecap();
  } catch(e) {
    el.innerHTML = '<div style="color:var(--rouge);padding:16px">Erreur de chargement du récap.</div>';
  }
}

function formatDateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const mois = ['','jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const jours = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  const dow = jours[new Date(dateStr).getDay()];
  return `${dow} ${parseInt(d)} ${mois[parseInt(m)]} ${y}`;
}

function recapBadge(statut, label) {
  const cfg = {
    vert:   { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
    orange: { bg: '#ffedd5', color: '#9a3412', dot: '#f97316' },
    rouge:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  };
  const c = cfg[statut] || cfg.vert;
  return `<span class="recap-badge" style="background:${c.bg};color:${c.color}"><span class="recap-badge-dot" style="background:${c.dot}"></span>${label}</span>`;
}

function recapKpiChip(label, value, accent) {
  const style = accent ? `border-color:${accent};color:${accent}` : '';
  return `<div class="recap-chip" style="${style}"><span class="recap-chip-label">${label}</span><span class="recap-chip-value">${value}</span></div>`;
}

function toggleRecapDay(id, btn) {
  const body = document.getElementById('recap-body-' + id);
  if (!body) return;
  const open = body.classList.toggle('open');
  btn.textContent = open ? 'Réduire ▲' : 'Voir tout ▼';
}

let _recapDayIdx = 0;

function renderRecapDay(entry) {
  const prod  = entry.production;
  const sec   = entry.securite;
  const maint = entry.maintenance;
  if (!prod) return '';

  const id = 'rd' + (_recapDayIdx++);

  const gStatut    = prod.statut_global || 'vert';
  const secStatut  = sec?.couleur_globale || (sec && +sec.nb_evenements > 0 ? 'orange' : 'vert');
  const maintStatut = maint?.statut_global || 'vert';

  // Impacts maintenance
  const impacts = [];
  for (let i = 0; i < 10; i++) {
    const desc = maint?.[`impact_${i}_desc`];
    if (!desc) break;
    impacts.push({ desc, machine: maint[`impact_${i}_machine`]||'', urgence: maint[`impact_${i}_urgence`]||'rouge' });
  }

  // KPI chips builder
  function buildChips(prefix) {
    const chips = [];
    const rdt = prod[`${prefix}_rdt_cumul`];
    if (rdt != null && rdt !== '') {
      const under = prod[`${prefix}_rdt_cible`] && parseFloat(rdt) < parseFloat(prod[`${prefix}_rdt_cible`]);
      chips.push(recapKpiChip('Rdt', `${rdt}%${prod[`${prefix}_rdt_cible`] ? ' / '+prod[`${prefix}_rdt_cible`] : ''}`, under ? 'var(--orange)' : null));
    }
    if (prod[`${prefix}_phnr_cumul`]) chips.push(recapKpiChip('PHNR', `${Number(prod[`${prefix}_phnr_cumul`]).toLocaleString('fr-FR')} kg/h`));
    if (prod[`${prefix}_cdc_cumul`])  chips.push(recapKpiChip('CDC',  `${prod[`${prefix}_cdc_cumul`]}${prod[`${prefix}_cdc_cible`] ? ' / '+prod[`${prefix}_cdc_cible`] : ''}`));
    if (prod[`${prefix}_vitesse_j1`]) chips.push(recapKpiChip('Vitesse', `${prod[`${prefix}_vitesse_j1`]}${prod[`${prefix}_vitesse_cible`] ? ' / '+prod[`${prefix}_vitesse_cible`] : ''} m/min`));
    if (prod[`${prefix}_arret_cumul`] && prod[`${prefix}_arret_cumul`] !== '') chips.push(recapKpiChip('Arrêts', prod[`${prefix}_arret_cumul`], 'var(--rouge)'));
    if (prod[`${prefix}_casse_cumul`] && prod[`${prefix}_casse_cumul`] !== '') chips.push(recapKpiChip('Casse',  prod[`${prefix}_casse_cumul`],  'var(--orange)'));
    return chips;
  }

  const m1chips = buildChips('m1');
  const m3chips = buildChips('m3');

  const m1statut = prod.m1_statut || 'vert';
  const m3statut = prod.m3_statut || 'vert';
  const infos    = prod.commentaire_general;

  // Ce qui est "impactant" (à montrer par défaut)
  const m1impactant = m1statut !== 'vert';
  const m3impactant = m3statut !== 'vert';
  const hasPannes   = impacts.length > 0;
  const hasSecu     = sec && +sec.nb_evenements > 0;
  const hasVisible  = m1impactant || m3impactant || hasPannes || hasSecu || !!infos;

  // Ce qui est masqué (machines vertes + leurs KPIs)
  const hasHidden   = (!m1impactant && (prod.m1_ref || m1chips.length > 0))
                   || (!m3impactant && (prod.m3_ref || m3chips.length > 0));

  // Bordure gauche
  const borderColor = gStatut === 'rouge' ? 'var(--rouge)' : gStatut === 'orange' ? 'var(--orange)' : 'var(--vert)';

  // Date
  const [y, mo, d] = entry.date.split('-');
  const moisL = ['','jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const joursL = ['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
  const dow = joursL[new Date(entry.date).getDay()];
  const isToday = entry.date === new Date().toISOString().slice(0,10);

  function machineBlock(prefix, statut, chips, ref) {
    if (!ref && chips.length === 0) return '';
    return `
    <div class="recap-machine recap-machine-${statut}">
      <div class="recap-mach-header">
        <span class="recap-mach-num">${prefix === 'm1' ? 'M1' : 'M3'}</span>
        <span class="recap-mach-ref">${ref||'—'}</span>
        <span class="recap-mach-statut feu feu-${statut}"></span>
      </div>
      <div class="recap-chips">${chips.join('')}</div>
    </div>`;
  }

  return `
  <div class="recap-day" style="border-left:4px solid ${borderColor}">

    <!-- EN-TÊTE — clic pour ouvrir le tableau de bord -->
    <div class="recap-day-hd" onclick="selectSearchDate('${entry.date}')" title="Ouvrir le tableau de bord">
      <div class="recap-day-date-block">
        <span class="recap-day-num">${parseInt(d)}</span>
        <div class="recap-day-meta">
          <span class="recap-day-dow">${dow.toUpperCase()}</span>
          <span class="recap-day-mois">${moisL[parseInt(mo)]} ${y}</span>
        </div>
        ${isToday ? '<span class="recap-today-tag">Aujourd\'hui</span>' : ''}
      </div>
      <div class="recap-day-badges">
        ${recapBadge(gStatut,    gStatut    === 'vert' ? 'Production OK'  : gStatut    === 'orange' ? 'Écarts prod.'     : 'Prod. critique')}
        ${sec   ? recapBadge(secStatut,   secStatut   === 'vert' ? 'Sécu OK'        : 'Sécu ' + (sec.nb_evenements||'') + ' évèn.') : ''}
        ${maint ? recapBadge(maintStatut, maintStatut === 'vert' ? 'Maintenance OK' : maintStatut === 'orange' ? 'Maint. écarts' : 'Maint. critique') : ''}
      </div>
    </div>

    <!-- CONTENU VISIBLE : uniquement les écarts + infos importantes -->
    ${hasVisible ? `<div class="recap-visible">

      ${(m1impactant && (prod.m1_ref || m1chips.length > 0)) || (m3impactant && (prod.m3_ref || m3chips.length > 0)) ? `
      <div class="recap-machines">
        ${m1impactant ? machineBlock('m1', m1statut, m1chips, prod.m1_ref) : ''}
        ${m3impactant ? machineBlock('m3', m3statut, m3chips, prod.m3_ref) : ''}
      </div>` : ''}

      ${infos ? `
      <div class="recap-info">
        <div class="recap-info-label">📌 Informations importantes</div>
        <div class="recap-info-body">${infos}</div>
      </div>` : ''}

      ${hasPannes || hasSecu ? `
      <div class="recap-alerts">
        ${hasPannes ? impacts.map(ev => `
          <div class="recap-alert-item recap-alert-${ev.urgence}">
            <span class="recap-alert-icon">${ev.urgence === 'rouge' ? '🔴' : '🟠'}</span>
            <div class="recap-alert-body">
              <span class="recap-alert-desc">${ev.desc}</span>
              ${ev.machine ? `<span class="recap-alert-machine">${ev.machine}</span>` : ''}
            </div>
          </div>`).join('') : ''}
        ${hasSecu ? `
          <div class="recap-alert-item recap-alert-orange">
            <span class="recap-alert-icon">⚠</span>
            <div class="recap-alert-body">
              <span class="recap-alert-desc">Sécurité : ${sec.evenements || sec.nb_evenements + ' évènement(s)'}</span>
            </div>
          </div>` : ''}
      </div>` : ''}

    </div>` : ''}

    <!-- CONTENU CACHÉ : machines vertes -->
    ${hasHidden ? `
    <div class="recap-expandable" id="recap-body-${id}">
      <div class="recap-machines">
        ${!m1impactant ? machineBlock('m1', m1statut, m1chips, prod.m1_ref) : ''}
        ${!m3impactant ? machineBlock('m3', m3statut, m3chips, prod.m3_ref) : ''}
      </div>
    </div>
    <div class="recap-expand-bar">
      <button class="recap-expand-btn" onclick="toggleRecapDay('${id}', this)">Voir tout ▼</button>
    </div>` : ''}

  </div>`;
}

function renderRecap() {
  const el = document.getElementById('recap-content');
  if (!el || !recapData) return;
  _recapDayIdx = 0;
  const filtered = recapData.slice(0, recapPeriod);
  if (!filtered.length) {
    el.innerHTML = '<div style="color:var(--text2);padding:20px;text-align:center">Aucune donnée de production disponible.</div>';
    return;
  }
  el.innerHTML = filtered.map(renderRecapDay).join('');
}

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

// HTML des 6 graphiques standard (partagé entre renderDashboard et resetChartArea)
function standardChartsHTML() {
  return `
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
    </div>`;
}

// secondLine = { label, color, data } pour overlay M1 vs M3
function createChart(canvasId, color, dataReal, dataObj, unit, labels, prevData = null, secondLine = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const datasets = [];
  const firstLabel = secondLine ? 'Machine 1' : (prevData ? 'Grade actuel' : 'Réel');
  datasets.push({
    label: firstLabel,
    data: dataReal,
    borderColor: color,
    backgroundColor: secondLine ? 'transparent' : color + '18',
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 1.5,
    tension: 0.3,
    fill: !prevData && !secondLine,
    spanGaps: true,
  });
  if (secondLine) {
    datasets.push({
      label: secondLine.label || 'Machine 3',
      data: secondLine.data,
      borderColor: secondLine.color,
      backgroundColor: 'transparent',
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: secondLine.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      tension: 0.3,
      fill: false,
      spanGaps: true,
    });
  } else if (prevData) {
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
  if (gridEl) {
    gridEl.style.display = 'none';
    gridEl.style.gridTemplateColumns = 'repeat(2,1fr)';
    // Restaurer les 6 canvas si on était en mode comparatif M1 vs M3
    if (!document.getElementById('chart-prod-m1')) {
      gridEl.innerHTML = standardChartsHTML();
    }
  }
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
    const extractCible = (svc, fld) => dates.map(d => { const v = byDate[d]?.[svc]?.[fld]; const n = parseFr(v); return isNaN(n) ? null : n; });
    createChart('chart-rdt-m1','#22c55e',extract('production','m1_rdt_cumul'),extractCible('production','m1_rdt_cible'),'%',labels);
    createChart('chart-rdt-m3','#22c55e',extract('production','m3_rdt_cumul'),extractCible('production','m3_rdt_cible'),'%',labels);
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
    if (contextEl) contextEl.textContent = `Grade actuel — depuis le ${startLabel} · J${Math.max(m1Run.length,m3Run.length)}`;
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

// Groupe les runs d'une machine par changement de référence OU par gap de jours
function groupRunsByMachine(rows, refField) {
  if (!rows.length) return [];
  const runs = [];
  let current = [rows[0]];
  let currentRef = rows[0][refField];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const ref = row[refField];
    const gap = (new Date(row.date+'T12:00:00') - new Date(rows[i-1].date+'T12:00:00')) / 86400000;
    if (ref === currentRef && gap <= 4) {
      current.push(row);
    } else {
      if (current.length && currentRef) runs.push({ ref: currentRef, days: current });
      current = [row];
      currentRef = ref;
    }
  }
  if (current.length && currentRef) runs.push({ ref: currentRef, days: current });
  return runs;
}

async function loadComparativeCharts(date) {
  const contextEl = document.getElementById('trends-context');
  const loadingEl = document.getElementById('trends-loading');
  const gridEl    = document.getElementById('trends-grid');
  if (!gridEl) return;

  try {
    // Fetch tous les jours de production (toutes références confondues)
    const allRows = await fetch('/api/all-grades').then(r => r.json());
    if (!allRows.length) {
      if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--text2)">Aucune donnée de production.</p>';
      return;
    }

    const m1Runs = groupRunsByMachine(allRows.filter(r => r.m1_ref), 'm1_ref');
    const m3Runs = groupRunsByMachine(allRows.filter(r => r.m3_ref), 'm3_ref');

    const m1Cur  = m1Runs.at(-1);
    const m1Prev = m1Runs.at(-2);
    const m3Cur  = m3Runs.at(-1);
    const m3Prev = m3Runs.at(-2);

    if (!m1Prev && !m3Prev) {
      if (loadingEl) loadingEl.innerHTML = `
        <div style="line-height:1.8;font-size:13px;color:var(--text2)">
          <strong style="color:var(--text)">Premier grade enregistré</strong><br>
          Le comparatif sera disponible dès le 2ème grade.<br>
          Continuez à saisir vos données quotidiennes — la comparaison se fera automatiquement.
        </div>`;
      return;
    }

    const fmtD = run => run?.days[0]?.date
      ? new Date(run.days[0].date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})
      : '—';
    const maxLen = Math.max(
      m1Cur?.days.length||0, m1Prev?.days.length||0,
      m3Cur?.days.length||0, m3Prev?.days.length||0, 1
    );
    const labels = Array.from({length:maxLen},(_,i)=>`J${i+1}`);

    if (contextEl) contextEl.textContent =
      `Grade actuel (dép. ${fmtD(m1Cur)}) vs Grade précédent (dép. ${fmtD(m1Prev)})`;
    if (loadingEl) loadingEl.style.display = 'none';
    if (gridEl) gridEl.style.display = 'grid';

    const m1C = m1Cur?.days||[], m1P = m1Prev?.days||[];
    const m3C = m3Cur?.days||[], m3P = m3Prev?.days||[];

    createChart('chart-prod-m1','#3b82f6',pad(extractField(m1C,'m1_prod_cumul'),maxLen),null,'t',labels,pad(extractField(m1P,'m1_prod_cumul'),maxLen));
    createChart('chart-prod-m3','#10b981',pad(extractField(m3C,'m3_prod_cumul'),maxLen),null,'t',labels,pad(extractField(m3P,'m3_prod_cumul'),maxLen));
    createChart('chart-phnr-m1','#8b5cf6',pad(extractField(m1C,'m1_phnr_j1'),maxLen),null,'kg/h',labels,pad(extractField(m1P,'m1_phnr_j1'),maxLen));
    createChart('chart-phnr-m3','#8b5cf6',pad(extractField(m3C,'m3_phnr_j1'),maxLen),null,'kg/h',labels,pad(extractField(m3P,'m3_phnr_j1'),maxLen));
    createChart('chart-rdt-m1','#22c55e',pad(extractField(m1C,'m1_rdt_cumul'),maxLen),null,'%',labels,pad(extractField(m1P,'m1_rdt_cumul'),maxLen));
    createChart('chart-rdt-m3','#22c55e',pad(extractField(m3C,'m3_rdt_cumul'),maxLen),null,'%',labels,pad(extractField(m3P,'m3_rdt_cumul'),maxLen));
  } catch(e) {
    if (loadingEl) loadingEl.innerHTML = '<p style="color:var(--rouge)">Erreur de chargement du comparatif.</p>';
    console.error(e);
  }
}

// ── IMPRESSION RAPPORT ────────────────────────────────
async function printReport() {
  const date = document.getElementById('dash-date-picker').value || currentDate;
  if (!date) { alert('Aucune date sélectionnée.'); return; }

  const res = await fetch('/api/submissions/' + date);
  const d = await res.json();
  const sec   = d.securite    || null;
  const prod  = d.production  || null;
  const qual  = d.qualite     || null;
  const maint = d.maintenance || null;
  const util  = d.utilites    || null;

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Statut global
  const utilZK = ['clarification_statut','zone_dechets_statut','incendie_statut','step1_statut','biomasse_statut','gaz_statut','dalkia_statut','air_statut','clim_statut','effacement_statut'];
  const utilZV = util ? utilZK.map(k=>util[k]).filter(Boolean) : [];
  const utilSt = util?.statut_global || (utilZV.includes('rouge')?'rouge':utilZV.includes('orange')?'orange':utilZV.length?'vert':null);
  const allSt  = [sec?.couleur_globale, prod?.statut_global, qual?.statut_global, maint?.statut_global, utilSt].filter(Boolean);
  const gSt    = allSt.includes('rouge')?'rouge':allSt.includes('orange')?'orange':'vert';
  const gLabel = { vert:'Situation normale', orange:'Points de vigilance', rouge:'Situation critique' };
  const gColor = { vert:'#16a34a', orange:'#ea580c', rouge:'#dc2626' };

  // Helpers
  const dot = s => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s==='rouge'?'#dc2626':s==='orange'?'#ea580c':'#16a34a'};margin-right:5px;"></span>`;
  const badge = (s, label) => `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${s==='rouge'?'#fee2e2':s==='orange'?'#ffedd5':'#dcfce7'};color:${s==='rouge'?'#991b1b':s==='orange'?'#9a3412':'#166534'};">${dot(s)}${label}</span>`;
  const row  = (label, val, sub='') => val!=null&&val!==''?`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px;"><span style="color:#64748b;">${label}</span><span style="font-weight:600;">${val}${sub?` <span style="font-weight:400;color:#94a3b8;font-size:11px;">${sub}</span>`:''}</span></div>`:'';
  const info = (text, color='#64748b', bg='#f8fafc') => text?`<div style="margin:6px 0;padding:8px 10px;background:${bg};border-radius:6px;font-size:12px;color:${color};line-height:1.5;">${text}</div>`:'';
  const sect = (title, color='#1e293b') => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${color};margin:10px 0 5px;">${title}</div>`;
  const svcHeader = (name, animateur, statut, label) => `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:14px;font-weight:700;color:#0f172a;">${name}${animateur?` <span style="font-size:11px;font-weight:400;color:#94a3b8;margin-left:6px;">${animateur}</span>`:''}  </div>
      ${statut?badge(statut,label):''}
    </div>`;

  // Construire impacts/risques maintenance
  const impacts=[]; const risques=[];
  if (maint) {
    for(let i=0;i<10;i++){const desc=maint[`impact_${i}_desc`];if(desc)impacts.push({desc,machine:maint[`impact_${i}_machine`]||'',duree:maint[`impact_${i}_duree`]||''});}
    for(let i=0;i<10;i++){const desc=maint[`risque_${i}_desc`];if(desc)risques.push({desc,machine:maint[`risque_${i}_machine`]||'',delai:maint[`risque_${i}_delai`]||''});}
  }

  // Zones utilités
  const utilRows = [
    ['Clarification','clarification'],['Zone déchets','zone_dechets'],['Protection incendie','incendie'],
    ['STEP','step1'],['Biomasse','biomasse'],['Gaz','gaz'],['Dalkia','dalkia'],
    ['Air Comprimé','air'],['Climatisation','clim'],['Effacement','effacement'],
  ].filter(([,k])=>util&&util[k+'_statut']);

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Flash Industriel — ${dateLabel}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Helvetica Neue',Arial,sans-serif; font-size:13px; color:#1e293b; background:#fff; }
  @page { size:A4; margin:15mm 15mm 15mm 15mm; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  .page-header { border-bottom:3px solid #0f2c6b; padding-bottom:10px; margin-bottom:16px; display:flex; align-items:flex-start; justify-content:space-between; }
  .logo { font-size:18px; font-weight:800; color:#0f2c6b; letter-spacing:-.5px; }
  .logo span { color:#3b82f6; }
  .header-right { text-align:right; font-size:11px; color:#64748b; }
  .global-status { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:8px; margin-bottom:16px; background:${gSt==='rouge'?'#fef2f2':gSt==='orange'?'#fff7ed':'#f0fdf4'}; border-left:4px solid ${gColor[gSt]}; }
  .global-dot { width:12px; height:12px; border-radius:50%; background:${gColor[gSt]}; flex-shrink:0; }
  .kpi-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-bottom:16px; }
  .kpi-card { border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; }
  .kpi-card-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; margin-bottom:3px; }
  .kpi-card-value { font-size:18px; font-weight:800; color:#0f172a; line-height:1; }
  .kpi-card-sub { font-size:10px; color:#94a3b8; margin-top:2px; }
  .services { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .service-card { border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; break-inside:avoid; }
  .service-card.full { grid-column:span 2; }
  .divider { border:none; border-top:1px solid #f1f5f9; margin:8px 0; }
  .machine-col { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .footer { margin-top:20px; padding-top:8px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; }
</style></head><body>

<div class="page-header">
  <div>
    <div class="logo"><span>FLASH</span> INDUSTRIEL</div>
    <div style="font-size:12px;color:#64748b;margin-top:2px;">Rapport quotidien d'animation</div>
  </div>
  <div class="header-right">
    <div style="font-weight:700;font-size:13px;color:#0f172a;">${dateLabel.charAt(0).toUpperCase()+dateLabel.slice(1)}</div>
    <div>Généré le ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
  </div>
</div>

<div class="global-status">
  <div class="global-dot"></div>
  <div><strong>${gLabel[gSt]}</strong>${gSt!=='vert'?' — Voir détails ci-dessous':''}</div>
</div>

<!-- KPIs -->
<div class="kpi-grid">
  <div class="kpi-card" style="border-top:3px solid ${prod?.m1_statut==='rouge'?'#dc2626':prod?.m1_statut==='orange'?'#ea580c':'#16a34a'};">
    <div class="kpi-card-label">Prod. M1</div>
    <div class="kpi-card-value">${prod?.m1_prod_cumul??'—'}<span style="font-size:11px;font-weight:400;"> t</span></div>
    <div class="kpi-card-sub">obj. ${prod?.m1_prod_cible??'—'} t</div>
  </div>
  <div class="kpi-card" style="border-top:3px solid ${parseFr(prod?.m1_rdt_cumul)>=75?'#16a34a':parseFr(prod?.m1_rdt_cumul)>=60?'#ea580c':'#dc2626'};">
    <div class="kpi-card-label">Rdt M1</div>
    <div class="kpi-card-value">${prod?.m1_rdt_cumul??'—'}<span style="font-size:11px;font-weight:400;">%</span></div>
    <div class="kpi-card-sub">cible ${prod?.m1_rdt_cible??'—'}</div>
  </div>
  <div class="kpi-card" style="border-top:3px solid ${prod?.m3_statut==='rouge'?'#dc2626':prod?.m3_statut==='orange'?'#ea580c':'#16a34a'};">
    <div class="kpi-card-label">Prod. M3</div>
    <div class="kpi-card-value">${prod?.m3_prod_cumul??'—'}<span style="font-size:11px;font-weight:400;"> t</span></div>
    <div class="kpi-card-sub">obj. ${prod?.m3_prod_cible??'—'} t</div>
  </div>
  <div class="kpi-card" style="border-top:3px solid ${parseFr(prod?.m3_rdt_cumul)>=90?'#16a34a':parseFr(prod?.m3_rdt_cumul)>=83?'#ea580c':'#dc2626'};">
    <div class="kpi-card-label">Rdt M3</div>
    <div class="kpi-card-value">${prod?.m3_rdt_cumul??'—'}<span style="font-size:11px;font-weight:400;">%</span></div>
    <div class="kpi-card-sub">cible ${prod?.m3_rdt_cible??'—'}</div>
  </div>
  <div class="kpi-card" style="border-top:3px solid ${impacts.length>0?'#dc2626':'#16a34a'};">
    <div class="kpi-card-label">Pannes</div>
    <div class="kpi-card-value" style="color:${impacts.length>0?'#dc2626':'#16a34a'}">${maint?impacts.length:'—'}</div>
    <div class="kpi-card-sub">impact prod.</div>
  </div>
  <div class="kpi-card" style="border-top:3px solid ${+sec?.nb_evenements>0?'#ea580c':'#16a34a'};">
    <div class="kpi-card-label">Sécu</div>
    <div class="kpi-card-value" style="color:${+sec?.nb_evenements>0?'#ea580c':'#16a34a'}">${sec?(sec.nb_evenements??0):'—'}</div>
    <div class="kpi-card-sub">incident(s)</div>
  </div>
</div>

<!-- Services -->
<div class="services">

  <!-- Sécurité -->
  <div class="service-card">
    ${svcHeader('Sécurité', sec?.animateur, sec?.couleur_globale, sec?.couleur_globale==='vert'?'OK':sec?.couleur_globale==='orange'?'Vigilance':'Critique')}
    ${sec ? `
      ${row('Événements', sec.nb_evenements??0, 'incident(s)')}
      ${sec.evenements ? info(sec.evenements,'#9a3412','#fff7ed') : info('✓ Aucun incident à signaler','#166534','#f0fdf4')}
      ${sec.gravite&&sec.gravite!=='vert' ? row('Gravité', sec.gravite) : ''}
      ${sec.commentaire_general&&sec.commentaire_general!=='Aucun incident à signaler' ? info(sec.commentaire_general) : ''}
    ` : '<p style="color:#94a3b8;font-size:12px;">Non renseigné</p>'}
  </div>

  <!-- Maintenance -->
  <div class="service-card">
    ${svcHeader('Maintenance', maint?.animateur, impacts.length>0?'rouge':risques.length>0?'orange':'vert', impacts.length>0?'Impact':risques.length>0?'Risque':'OK')}
    ${maint ? `
      ${impacts.length>0 ? sect('Pannes','#dc2626')+impacts.map(e=>`<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px;"><strong>${e.desc}</strong><span style="color:#94a3b8;margin-left:6px;">${e.machine}${e.duree?' · '+e.duree+'h':''}</span></div>`).join('') : info('✓ Aucune panne','#166534','#f0fdf4')}
      ${risques.length>0 ? sect('Risques 24/48h','#ea580c')+risques.map(r=>`<div style="padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:12px;"><strong>${r.desc}</strong><span style="color:#94a3b8;margin-left:6px;">${r.machine}${r.delai?' · '+r.delai:''}</span></div>`).join('') : ''}
      ${maint.commentaire_general ? info(maint.commentaire_general) : ''}
    ` : '<p style="color:#94a3b8;font-size:12px;">Non renseigné</p>'}
  </div>

  <!-- Production -->
  <div class="service-card full">
    ${svcHeader('Production', prod?.animateur, prod?.statut_global, prod?.statut_global==='vert'?'OK':prod?.statut_global==='orange'?'Écart':'Critique')}
    ${prod ? `<div class="machine-col">
      <div>
        ${sect('Machine 1')}
        ${row('Production cumul', prod.m1_prod_cumul, 't — obj. '+(prod.m1_prod_cible||'—')+' t')}
        ${row('Rendement cumul', prod.m1_rdt_cumul, '% — cible '+(prod.m1_rdt_cible||'—'))}
        ${row('PHNR J-1', prod.m1_phnr_j1, prod.m1_phnr_cible?'kg/h — obj. '+prod.m1_phnr_cible:'kg/h')}
        ${row('Arrêts cumulés', prod.m1_arret_cumul||null)}
        ${row('Casse', prod.m1_casse_cumul||null)}
        ${row('CDC', prod.m1_cdc_cumul||null, prod.m1_cdc_cible?'obj. '+prod.m1_cdc_cible:'')}
        ${prod.m1_info ? info(prod.m1_info) : ''}
      </div>
      <div>
        ${sect('Machine 3')}
        ${row('Production cumul', prod.m3_prod_cumul, 't — obj. '+(prod.m3_prod_cible||'—')+' t')}
        ${row('Rendement cumul', prod.m3_rdt_cumul, '% — cible '+(prod.m3_rdt_cible||'—'))}
        ${row('PHNR J-1', prod.m3_phnr_j1, prod.m3_phnr_cible?'kg/h — obj. '+prod.m3_phnr_cible:'kg/h')}
        ${row('Arrêts cumulés', prod.m3_arret_cumul||null)}
        ${row('Casse', prod.m3_casse_cumul||null)}
        ${row('CDC', prod.m3_cdc_cumul||null, prod.m3_cdc_cible?'obj. '+prod.m3_cdc_cible:'')}
        ${prod.m3_info ? info(prod.m3_info) : ''}
      </div>
    </div>
    ${prod.commentaire_general ? info(prod.commentaire_general) : ''}
    ` : '<p style="color:#94a3b8;font-size:12px;">Non renseigné</p>'}
  </div>

  <!-- Qualité -->
  <div class="service-card full">
    ${svcHeader('Qualité', qual?.animateur, qual?.statut_global, qual?.statut_global==='vert'?'OK':qual?.statut_global==='orange'?'Écart':'Critique')}
    ${qual ? `<div class="machine-col">
      <div>
        ${sect('Machine 1')}
        ${row('TC %', qual.m1_tc_reel, qual.m1_tc_cible?'— cible '+qual.m1_tc_cible:'')}
        ${row('E% Perco', qual.m1_perco_reel, qual.m1_perco_cible?'— obj. '+qual.m1_perco_cible:'')}
        ${qual.m1_pir&&qual.m1_pir!=='Non Applicable'?row('PIR',qual.m1_pir):''}
        ${qual.m1_autre_resultat ? info(qual.m1_autre_resultat) : ''}
        ${qual.m1_demande_cq ? row('Demande CQ', qual.m1_demande_cq) : ''}
        ${qual.m1_consigne ? info(qual.m1_consigne, '#1d4ed8', '#eff6ff') : ''}
      </div>
      <div>
        ${sect('Machine 3')}
        ${row('TC %', qual.m3_tc_reel, qual.m3_tc_cible?'— cible '+qual.m3_tc_cible:'')}
        ${row('E% Perco', qual.m3_perco_reel, qual.m3_perco_cible?'— obj. '+qual.m3_perco_cible:'')}
        ${qual.m3_pir&&qual.m3_pir!=='Non Applicable'?row('PIR',qual.m3_pir):''}
        ${qual.m3_autre_resultat ? info(qual.m3_autre_resultat) : ''}
        ${qual.m3_demande_cq ? row('Demande CQ', qual.m3_demande_cq) : ''}
        ${qual.m3_consigne ? info(qual.m3_consigne, '#1d4ed8', '#eff6ff') : ''}
      </div>
    </div>` : '<p style="color:#94a3b8;font-size:12px;">Non renseigné</p>'}
  </div>

  <!-- Utilités -->
  <div class="service-card full">
    ${svcHeader('Utilités', util?.animateur, utilSt, utilSt==='vert'?'OK':utilSt==='orange'?'Vigilance':'Critique')}
    ${util ? `
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr style="border-bottom:2px solid #e2e8f0;">
          <th style="text-align:left;padding:4px 8px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;">Indicateur</th>
          <th style="text-align:center;padding:4px 8px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;width:80px;">Statut</th>
          <th style="text-align:left;padding:4px 8px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;">Informations</th>
          <th style="text-align:left;padding:4px 8px 6px;font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;width:90px;">Délai</th>
        </tr></thead>
        <tbody>
          ${utilRows.map(([label,k])=>`<tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:5px 8px;font-weight:600;">${label}</td>
            <td style="padding:5px 8px;text-align:center;">${dot(util[k+'_statut']||'vert')}</td>
            <td style="padding:5px 8px;color:#475569;">${util[k+'_info']||'—'}</td>
            <td style="padding:5px 8px;color:#94a3b8;">${util[k+'_delai']||'—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${util.commentaire_general ? info(util.commentaire_general) : ''}
    ` : '<p style="color:#94a3b8;font-size:12px;">Non renseigné</p>'}
  </div>

</div>

<div class="footer">
  <span>Flash Industriel — Rapport confidentiel</span>
  <span>${dateLabel.charAt(0).toUpperCase()+dateLabel.slice(1)}</span>
</div>

<script>window.onload = () => { window.print(); }</script>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

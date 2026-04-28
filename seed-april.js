// Script pour insérer des données d'exemple pour avril 2026
// Usage : node seed-april.js (le serveur doit tourner sur http://localhost:3001)

const BASE = 'http://localhost:3001';

async function post(date, service, data) {
  const res = await fetch(`${BASE}/api/submissions/${date}/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  console.log(`${date} / ${service} →`, json.ok ? '✅ OK' : '❌ ' + JSON.stringify(json));
}

async function seed() {
  // Données par jour (variantes réalistes)
  const days = [
    { date: '2026-04-07', m1_prod: 42.1, m1_phnr: 310, m1_rdt: 72.0, m3_prod: 38.5, m3_phnr: 285, m3_rdt: 88.0 },
    { date: '2026-04-08', m1_prod: 44.8, m1_phnr: 325, m1_rdt: 76.5, m3_prod: 40.2, m3_phnr: 290, m3_rdt: 91.0 },
    { date: '2026-04-09', m1_prod: 38.6, m1_phnr: 295, m1_rdt: 66.0, m3_prod: 37.0, m3_phnr: 272, m3_rdt: 85.0 },
    { date: '2026-04-10', m1_prod: 45.0, m1_phnr: 330, m1_rdt: 77.0, m3_prod: 41.5, m3_phnr: 298, m3_rdt: 92.5 },
    { date: '2026-04-11', m1_prod: 46.3, m1_phnr: 340, m1_rdt: 79.0, m3_prod: 42.8, m3_phnr: 305, m3_rdt: 94.0 },
    { date: '2026-04-14', m1_prod: 40.2, m1_phnr: 305, m1_rdt: 68.5, m3_prod: 39.0, m3_phnr: 280, m3_rdt: 87.0 },
    { date: '2026-04-15', m1_prod: 47.5, m1_phnr: 345, m1_rdt: 81.0, m3_prod: 43.0, m3_phnr: 310, m3_rdt: 95.0 },
    { date: '2026-04-16', m1_prod: 43.8, m1_phnr: 318, m1_rdt: 74.5, m3_prod: 40.8, m3_phnr: 293, m3_rdt: 90.0 },
    { date: '2026-04-17', m1_prod: 35.4, m1_phnr: 275, m1_rdt: 60.0, m3_prod: 36.0, m3_phnr: 265, m3_rdt: 83.0 },
    { date: '2026-04-22', m1_prod: 44.0, m1_phnr: 322, m1_rdt: 75.0, m3_prod: 41.0, m3_phnr: 295, m3_rdt: 91.5 },
    { date: '2026-04-23', m1_prod: 46.7, m1_phnr: 337, m1_rdt: 79.5, m3_prod: 42.3, m3_phnr: 302, m3_rdt: 93.5 },
    { date: '2026-04-24', m1_prod: 48.2, m1_phnr: 350, m1_rdt: 82.0, m3_prod: 44.1, m3_phnr: 315, m3_rdt: 96.0 },
    { date: '2026-04-25', m1_prod: 41.5, m1_phnr: 308, m1_rdt: 70.5, m3_prod: 39.5, m3_phnr: 283, m3_rdt: 88.5 },
    { date: '2026-04-26', m1_prod: 45.2, m1_phnr: 328, m1_rdt: 77.5, m3_prod: 41.8, m3_phnr: 300, m3_rdt: 93.0 },
    { date: '2026-04-27', m1_prod: 43.1, m1_phnr: 315, m1_rdt: 73.5, m3_prod: 40.5, m3_phnr: 288, m3_rdt: 89.5 },
    { date: '2026-04-28', m1_prod: 44.9, m1_phnr: 326, m1_rdt: 76.0, m3_prod: 41.2, m3_phnr: 294, m3_rdt: 91.0 },
  ];

  for (const day of days) {
    const { date, m1_prod, m1_phnr, m1_rdt, m3_prod, m3_phnr, m3_rdt } = day;

    // PRODUCTION
    await post(date, 'production', {
      animateur: 'Jean MARTIN',
      statut_global: m1_rdt >= 75 && m3_rdt >= 90 ? 'vert' : m1_rdt >= 65 ? 'orange' : 'rouge',
      m1_ref: 'GW17/26-10',
      m1_statut: m1_rdt >= 75 ? 'vert' : m1_rdt >= 65 ? 'orange' : 'rouge',
      m1_prod_cumul: m1_prod,
      m1_prod_j1: +(m1_prod * 0.97).toFixed(1),
      m1_prod_cible: 45,
      m1_phnr_cumul: m1_phnr,
      m1_phnr_j1: m1_phnr,
      m1_phnr_cible: 320,
      m1_rdt_cumul: m1_rdt,
      m1_rdt_j1: +(m1_rdt - 1.5).toFixed(1),
      m1_rdt_cible: '70/90%',
      m1_arret_cumul: m1_rdt < 70 ? '8%' : '3%',
      m1_casse_cumul: '2%',
      m1_cdc_cumul: '4:15',
      m1_cdc_cible: '3:00',
      m1_info: m1_rdt < 68 ? 'Arrêt technique non prévu — intervention en cours' : '',
      m3_ref: 'MK4/26-11',
      m3_statut: m3_rdt >= 90 ? 'vert' : m3_rdt >= 85 ? 'orange' : 'rouge',
      m3_prod_cumul: m3_prod,
      m3_prod_j1: +(m3_prod * 0.98).toFixed(1),
      m3_prod_cible: 42,
      m3_phnr_cumul: m3_phnr,
      m3_phnr_j1: m3_phnr,
      m3_phnr_cible: 295,
      m3_rdt_cumul: m3_rdt,
      m3_rdt_j1: +(m3_rdt - 1.0).toFixed(1),
      m3_rdt_cible: '94/104%',
      m3_arret_cumul: m3_rdt < 87 ? '6%' : '2%',
      m3_casse_cumul: '1%',
      m3_cdc_cumul: '3:36',
      m3_cdc_cible: '3:00',
      m3_info: '',
      gemba_prep1: 'vert',
      gemba_prep3: 'vert',
      gemba_machine1: m1_rdt >= 75 ? 'vert' : 'orange',
      gemba_machine3: m3_rdt >= 90 ? 'vert' : 'orange',
      gemba_commentaire: 'Tournée OK',
      commentaire_general: ''
    });

    // SÉCURITÉ
    await post(date, 'securite', {
      animateur: 'Sophie DURAND',
      couleur_globale: 'vert',
      evenements: '',
      nb_evenements: 0,
      gravite: 'vert',
      commentaire_general: 'Aucun incident à signaler'
    });

    // QUALITÉ
    await post(date, 'qualite', {
      animateur: 'Pierre LEBLANC',
      statut_global: 'vert',
      m1_produit: 'GW17/26-10',
      m1_resultat: 'vert',
      m1_tc_reel: +(41.5 + (Math.random() - 0.5) * 1.5).toFixed(1),
      m1_tc_cible: '41,5→42,5',
      m1_tc_statut: 'vert',
      m1_perco_reel: +(37.5 + (Math.random() - 0.5)).toFixed(1),
      m1_perco_cible: 38.0,
      m1_pir: 'Non Applicable',
      m1_autre_resultat: 'Aspect : OK\nCompactage : OK\nCouleur : OK',
      m1_fait_marquant: '',
      m1_demande_cq: '',
      m1_consigne: '',
      m3_produit: 'MK4/26-03',
      m3_resultat: 'vert',
      m3_tc_reel: +(43.5 + (Math.random() - 0.5) * 1.2).toFixed(1),
      m3_tc_cible: '43,5→44,5',
      m3_tc_statut: 'vert',
      m3_perco_reel: +(36.8 + (Math.random() - 0.5)).toFixed(1),
      m3_perco_cible: 38.0,
      m3_pir: 'Non Applicable',
      m3_autre_resultat: 'Aspect : OK\nCompactage : OK\nCouleur : OK',
      m3_fait_marquant: '',
      m3_demande_cq: '',
      m3_consigne: ''
    });

    // MAINTENANCE
    await post(date, 'maintenance', {
      animateur: 'Marc LEFEBVRE',
      statut_global: 'vert',
      commentaire_general: 'RAS'
    });

    // UTILITÉS
    await post(date, 'utilites', {
      animateur: 'Claire BERNARD',
      statut_global: 'vert',
      clarification_statut: 'vert',
      clarification_info: 'Fonctionnement normal',
      zone_dechets_statut: 'vert',
      zone_dechets_info: '',
      incendie_statut: 'vert',
      incendie_info: '',
      step1_statut: 'vert',
      step1_info: 'RAS',
      step2_statut: 'vert',
      step2_info: 'RAS',
      biomasse_statut: 'vert',
      biomasse_info: 'En fonctionnement',
      gaz_statut: 'vert',
      gaz_info: 'Prête à démarrer',
      dalkia_statut: 'vert',
      dalkia_info: 'D2 en fonctionnement',
      air_statut: 'vert',
      air_info: '',
      clim_statut: 'vert',
      clim_info: '',
      effacement_statut: 'vert',
      effacement_info: ''
    });
  }

  console.log('\n✅ Seed terminé !');
}

seed().catch(console.error);

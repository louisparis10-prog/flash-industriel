// Seed du 13/05/2026 — données réelles anonymisées (références produit masquées)
const BASE = 'https://flash-industriel.onrender.com';
const DATE = '2026-05-13';

async function post(service, data) {
  const res = await fetch(`${BASE}/api/submissions/${DATE}/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  console.log(`  ${service.padEnd(12)} ${json.ok ? '✅' : '❌ ' + JSON.stringify(json)}`);
}

async function main() {
  console.log(`\nInjection Flash Industriel — ${DATE}\n`);

  // ── SÉCURITÉ ──────────────────────────────────────────────────────────
  await post('securite', {
    animateur: 'NT/FL',
    couleur_globale: 'vert',
    evenements: '',
    nb_evenements: 0,
    gravite: 'vert',
    commentaire_general: 'Formation (chariot, pontier, ...)\nProchaine animation ESI 12/05 : Équipe B — Rdv au local ESI'
  });

  // ── UTILITÉS ──────────────────────────────────────────────────────────
  await post('utilites', {
    animateur: 'NT/OL',
    statut_global: 'orange',
    clarification_statut: 'orange',
    clarification_info: 'Filtre à sable n°2 — indisponible en travaux',
    clarification_delai: '',
    zone_dechets_statut: 'orange',
    zone_dechets_info: 'SORTIR les poubelles pleines et à moitié de TOUS les ateliers avant 16h mercredi 13 mai (pas d\'OTD jeudi 14)\n"Avec 1 machine nous pouvons passer les 3 jours (déjà fait)"',
    zone_dechets_delai: 'Mercredi 13 mai 16h',
    incendie_statut: 'orange',
    incendie_info: 'Poste Sprinkler n°8 ou 10 toujours en eau (remis sous air dès dispo tuyauteur)\nAlarme inhibée sur ce poste — levée de doute en cas de démarrage pompe incendie (secteur PF1-2 FA/FC)',
    incendie_delai: '',
    step1_statut: 'orange',
    step1_info: 'DCO élevée, pas de traitement interne des LC',
    step1_delai: '',
    biomasse_statut: 'vert',
    biomasse_info: 'En fonctionnement',
    biomasse_delai: '',
    gaz_statut: 'vert',
    gaz_info: 'Prête à démarrer',
    gaz_delai: '',
    dalkia_statut: 'orange',
    dalkia_info: 'D1 arrêtée, D2 en fonctionnement et D3 en bouillotte',
    dalkia_delai: '',
    air_statut: 'vert',
    air_info: '',
    air_delai: '',
    clim_statut: 'vert',
    clim_info: '',
    clim_delai: '',
    effacement_statut: 'orange',
    effacement_info: 'Possible demande d\'activation/d\'effacement journée du 14 mai',
    effacement_delai: '',
    commentaire_general: ''
  });

  // ── PRODUCTION ────────────────────────────────────────────────────────
  await post('production', {
    animateur: 'CDF/FL',
    statut_global: 'orange',

    // Machine 1 — référence anonymisée
    m1_ref: 'Produit A',
    m1_statut: 'orange',
    m1_prod_cumul: '',
    m1_prod_j1: '',
    m1_prod_cible: '',
    m1_phnr_cumul: 1750,
    m1_phnr_j1: '',
    m1_phnr_cible: '',
    m1_rdt_cumul: 70,
    m1_rdt_j1: '',
    m1_rdt_cible: '90%',
    m1_arret_cumul: '6,10%',
    m1_casse_cumul: '0,22%',
    m1_cdc_cumul: '3:00',
    m1_cdc_cible: '03:00',
    m1_vitesse_j1: 186,
    m1_vitesse_cible: 220,
    m1_laize_j1: 234,
    m1_laize_cible: 240,
    m1_info: 'Consignes J+1 :\n- Buses lécithine : Prod MU → buses 017 / Prod conventionnelle → buses 033\n- Essai passage pression Eau tiède à 8,5 bar (impact conso électrique + fonctionnement 2 ppes)\n- Changement vanne masoneilan : signal ouverture inversé (out 78% = ouverture réelle 22%) → Pentecôte\n- Faire une soude sur les habillages à l\'arrêt\n- Contrôler la couture dernière toile sécheuse et la refaire si nécessaire\n- Apprentissage nouvelle programmation S/P : fonctionnement idéal à 4b pour limiter variations vitesses et couples\n==> Dans la mesure du possible limiter la concentration pour viser une pression à 4b',

    // Machine 3 — référence anonymisée
    m3_ref: 'Produit B',
    m3_statut: 'vert',
    m3_prod_cumul: '',
    m3_prod_j1: '',
    m3_prod_cible: '',
    m3_phnr_cumul: 4600,
    m3_phnr_j1: 4900,
    m3_phnr_cible: 5700,
    m3_rdt_cumul: 98.4,
    m3_rdt_j1: 95,
    m3_rdt_cible: '100%',
    m3_arret_cumul: '',
    m3_casse_cumul: '3,7%',
    m3_cdc_cumul: '3:14',
    m3_cdc_cible: '03:00',
    m3_vitesse_j1: '',
    m3_vitesse_cible: '',
    m3_laize_j1: 368.5,
    m3_laize_cible: 370,
    m3_info: 'Evènements grade : Vigilance PF pas trop brillant — éclatement entre 45 et 50 kPa\nChgt de cde : Samedi 16 mai vers 5h — objectif CDC : 3h00\nConsignes J+1 :\n- Favoriser les rejets LF (10t mini/faction) plutôt que les rejets LC ségrégation\n- Essai passage pression Eau tiède à 8,5 bar (impact conso électrique)\n- 2ème toile sécheuse cousue CC à la jonction (fait le 13 mai)\n- Reprendre ppe pré-raffinage 113P9 dès que possible et épurateur cyclonique',

    gemba_prep1: 'vert',
    gemba_prep3: 'vert',
    gemba_machine1: 'orange',
    gemba_machine3: 'vert',
    gemba_commentaire: 'Amélioration continue : arrondir le poids des balles de kraft (étiquette kraft absente parfois sur toute la faction) — Pris en compte',
    commentaire_general: ''
  });

  // ── QUALITÉ ───────────────────────────────────────────────────────────
  await post('qualite', {
    animateur: '',
    statut_global: 'orange',

    // Machine 1 — pas de résultats renseignés ce jour
    m1_produit: 'Produit A',
    m1_resultat: 'orange',
    m1_tc_reel: '',
    m1_tc_cible: '',
    m1_tc_statut: '',
    m1_perco_reel: '',
    m1_perco_cible: '',
    m1_pir: 'Non Applicable',
    m1_autre_resultat: '',
    m1_fait_marquant: '',
    m1_demande_cq: '',
    m1_consigne: 'Prévenir TQ pour assister au compactage vers 8h00 et 14h00',

    // Machine 3
    m3_produit: 'Produit B',
    m3_resultat: 'orange',
    m3_tc_reel: 37.4,
    m3_tc_cible: '37,5',
    m3_tc_statut: 'orange',
    m3_perco_reel: 40.6,
    m3_perco_cible: '41,5',
    m3_pir: 'Non Applicable',
    m3_autre_resultat: 'Aspect : Ok\nCompactage : Ok\nCouleur : légèrement brillant lors des TC fort\nEclatement FDB : Moyenne 41,5 kPa — cible 45/50',
    m3_fait_marquant: '4 caisses déclassées (lot 26-03) suite rejet PIR — prélèvements effectués, en attente résultats.',
    m3_demande_cq: '',
    m3_consigne: 'Prévenir TQ pour assister au compactage vers 8h00 et 14h00'
  });

  // ── MAINTENANCE ───────────────────────────────────────────────────────
  await post('maintenance', {
    animateur: 'FL/Maint',
    statut_global: 'rouge',

    // Zones niveau de confiance
    zone_mt1: 'vert',
    zone_mt3: 'vert',
    zone_charg1: 'vert',
    zone_charg3: 'vert',
    zone_prep1: 'vert',
    zone_prep3: 'vert',
    zone_fin1: 'vert',
    zone_fin3: 'vert',

    // Pannes MT1
    impact_0_desc: 'MCR : OTs selon liste arrêt',
    impact_0_machine: 'MFT1',
    impact_0_duree: '',
    impact_0_urgence: 'orange',

    impact_1_desc: 'Jet Liqueur rouleau dur',
    impact_1_machine: 'MFT1',
    impact_1_duree: '',
    impact_1_urgence: 'rouge',

    // Pannes MT3
    impact_2_desc: 'Usure disques Raffineurs irrégulière',
    impact_2_machine: 'MFT3',
    impact_2_duree: '',
    impact_2_urgence: 'orange',

    // Points à investiguer
    point_0_desc: 'Vis égoutteuses VE1A et VE1B — VE1B changée, VE1A intervention le 13 mai en cours',
    point_0_machine: 'Prép. 3',
    point_0_responsable: 'Méca',
    point_0_delai: 'En cours',
    point_0_statut: 'orange',

    point_1_desc: 'Pompes P1 et P2 pulpeur difficultés lors des transferts — P2 prête, reste P1 (pièces en commande)',
    point_1_machine: 'Prép. 3',
    point_1_responsable: 'Méca',
    point_1_delai: 'Fin avril',
    point_1_statut: 'orange',

    point_2_desc: 'Pulpeur percé au fond (point de rouille au-dessus de l\'escalier) — réparation provisoire à faire sur arrêt de jour',
    point_2_machine: 'Prép. 3',
    point_2_responsable: 'Tuyauterie',
    point_2_delai: 'Pentecôte',
    point_2_statut: 'orange',

    point_3_desc: 'Massif béton pulpeur s\'effrite → analyse BE à faire',
    point_3_machine: 'Prép. 3',
    point_3_responsable: 'BE',
    point_3_delai: 'Pris en compte',
    point_3_statut: 'orange',

    point_4_desc: 'Problème sélection pompe LL2',
    point_4_machine: 'Prép. 3',
    point_4_responsable: 'MCR',
    point_4_delai: '',
    point_4_statut: 'orange',

    point_5_desc: 'Contrôle pompe pré-raffinage 113P9 → changement pompe — pompe neuve prête',
    point_5_machine: 'Prép. 3',
    point_5_responsable: 'Méca',
    point_5_delai: 'Soldé',
    point_5_statut: 'vert',

    commentaire_general: 'Amélioration continue : arrondir le poids des balles de kraft (étiquette kraft absente parfois sur toute la faction) — Pris en compte\nMT3 toile sécheuse 2ème batterie : jonction ouverte bord CC et CT sur 2cm — couture réalisée le 13 mai'
  });

  console.log('\n✅ Flash du 13/05/2026 injecté avec succès\n');
}

main().catch(console.error);

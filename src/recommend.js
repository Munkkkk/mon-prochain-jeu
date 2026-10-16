// Logique de recommandation validée (voir doc « Logique de recommandation de jeux »).
// Le catalogue vient de data/jeux.json : creerMoteur(donnees) renvoie { recommander, ressemblance, GAMES }.
function creerMoteur({ jeux: GAMES, genres_voisins: GENRES_VOISINS }) {

  const POIDS_FAMILLES = { genres: 40, mecaniques: 30, tags: 20, studio: 10 };
  const POIDS_NOTE = { adore: 1.5, normal: 1, bof: 0.5 };
  const SEUIL = 30, TOP = 10, MAX_PAR_STUDIO = 3;
  const ANNEE_COURANTE = new Date().getFullYear();

  const voisins = new Set(GENRES_VOISINS.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
  const rarete = (() => { // poids des tags : plus un tag est rare, plus il compte
    const n = {};
    GAMES.forEach(g => g.tags.forEach(t => (n[t] = (n[t] || 0) + 1)));
    return t => Math.log(1 + GAMES.length / (n[t] || 1));
  })();

  function jaccard(a, b, poids = () => 1, correspondance = (x, y) => (x === y ? 1 : 0)) {
    if (!a.length || !b.length) return 0;
    let inter = 0, totalA = 0, totalB = 0;
    a.forEach(x => { totalA += poids(x); inter += poids(x) * Math.max(...b.map(y => correspondance(x, y))); });
    b.forEach(y => (totalB += poids(y)));
    const union = totalA + totalB - inter;
    return union > 0 ? Math.min(1, inter / union) : 0;
  }
  const genreMatch = (x, y) => (x === y ? 1 : voisins.has(x + "|" + y) ? 0.5 : 0);

  // Ressemblance entre deux jeux, sur 100.
  function ressemblance(a, b) {
    const studio = a.studio === b.studio ? 1 : a.editeur === b.editeur ? 0.5 : 0;
    return (
      POIDS_FAMILLES.genres * jaccard(a.genres, b.genres, () => 1, genreMatch) +
      POIDS_FAMILLES.mecaniques * jaccard(a.mecaniques, b.mecaniques) +
      POIDS_FAMILLES.tags * jaccard(a.tags, b.tags, rarete) +
      POIDS_FAMILLES.studio * studio
    );
  }

  const commun = (a, b, cle) => a[cle].filter(x => b[cle].includes(x));

  function explication(candidat, source) {
    const parts = [];
    const g = commun(candidat, source, "genres"), m = commun(candidat, source, "mecaniques"), t = commun(candidat, source, "tags");
    if (g.length) parts.push("même genre (" + g.join(", ") + ")");
    if (m.length) parts.push(m.slice(0, 2).join(", "));
    if (t.length) parts.push(t.slice(0, 2).join(", "));
    if (candidat.studio === source.studio) parts.push("même studio");
    else if (candidat.editeur === source.editeur) parts.push("même éditeur");
    return "Comme " + source.titre + " : " + (parts.join(" · ") || "univers proche");
  }

  /**
   * entrees : [{ id, note: "adore"|"normal"|"bof", annee?: année de la dernière partie }]
   * options : { plateformes?: [..], inclureNonSortis?: false }
   */
  function recommander(entrees, options = {}) {
    const parId = Object.fromEntries(GAMES.map(g => [g.id, g]));
    const joues = entrees.filter(e => parId[e.id]).map(e => {
      const poids = POIDS_NOTE[e.note || "normal"] * (e.annee && ANNEE_COURANTE - e.annee > 2 ? 0.7 : 1);
      return { jeu: parId[e.id], note: e.note || "normal", poids };
    });
    const aimes = joues.filter(j => j.note !== "bof");
    const pasAimes = joues.filter(j => j.note === "bof");
    if (!aimes.length) return [];
    const dejaJoues = new Set(joues.map(j => j.jeu.id));

    const candidats = GAMES.filter(g => !dejaJoues.has(g.id) && g.annee <= ANNEE_COURANTE &&
      (!options.plateformes || !options.plateformes.length || g.plateformes.some(p => options.plateformes.includes(p))));

    const notes = candidats.map(c => {
      const sims = aimes.map(j => ({ j, s: ressemblance(c, j.jeu) }));
      const maxPondere = Math.min(100, Math.max(...sims.map(x => x.s * x.j.poids)));
      const sommePoids = aimes.reduce((acc, j) => acc + j.poids, 0);
      const moyennePonderee = sims.reduce((acc, x) => acc + x.s * x.j.poids, 0) / sommePoids;
      const malus = pasAimes.length ? 0.5 * Math.max(...pasAimes.map(j => ressemblance(c, j.jeu))) : 0;
      const bonusQualite = Math.max(0, Math.min(1, (c.note - 70) / 30)) * 5;
      const meilleure = sims.reduce((a, b) => (b.s * b.j.poids > a.s * a.j.poids ? b : a));
      return { jeu: c, score: 0.6 * maxPondere + 0.4 * moyennePonderee - malus + bonusQualite, source: meilleure.j.jeu };
    }).filter(r => r.score >= SEUIL).sort((a, b) => b.score - a.score);

    // Sélection avec diversité : −30 % par ressemblance aux jeux déjà retenus, max 3 par studio / série.
    const retenus = [], restants = [...notes];
    while (retenus.length < TOP && restants.length) {
      restants.forEach(r => {
        const maxSim = retenus.length ? Math.max(...retenus.map(x => ressemblance(r.jeu, x.jeu))) / 100 : 0;
        r.ajuste = r.score * (1 - 0.3 * maxSim);
      });
      restants.sort((a, b) => b.ajuste - a.ajuste);
      const i = restants.findIndex(r =>
        retenus.filter(x => x.jeu.studio === r.jeu.studio).length < MAX_PAR_STUDIO &&
        retenus.filter(x => x.jeu.serie === r.jeu.serie).length < MAX_PAR_STUDIO);
      if (i < 0) break;
      const [choisi] = restants.splice(i, 1);
      retenus.push({ ...choisi, score: Math.round(choisi.ajuste), raison: explication(choisi.jeu, choisi.source) });
    }
    return retenus;
  }
  return { recommander, ressemblance, GAMES };
}

if (typeof module !== "undefined") module.exports = { creerMoteur };
else window.creerMoteur = creerMoteur;

const LIBELLES = { adore: "Adoré", normal: "Bien", bof: "Bof" };
const $ = id => document.getElementById(id);
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function el(tag, props = {}, ...enfants) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...enfants);
  return e;
}

function demarrer(donnees) {
  const { GAMES, recommander } = creerMoteur(donnees);
  let entrees = [];
  try { entrees = JSON.parse(localStorage.getItem("jeux-joues") || "[]").filter(e => GAMES.some(g => g.id === e.id)); } catch (_) {}

  $("nb").textContent = GAMES.length;
  $("catalogue").append(...GAMES.map(g => Object.assign(document.createElement("option"), { value: g.titre })));

  function afficher() {
    try { localStorage.setItem("jeux-joues", JSON.stringify(entrees)); } catch (_) {}
    $("joues").replaceChildren(...entrees.map(e => {
      const jeu = GAMES.find(g => g.id === e.id);
      return el("li", {}, el("span", {}, jeu.titre), el("em", { className: "note " + e.note }, LIBELLES[e.note]),
        el("button", { type: "button", ariaLabel: "Retirer " + jeu.titre, textContent: "×", onclick: () => { entrees = entrees.filter(x => x.id !== e.id); afficher(); } }));
    }));
    const recos = recommander(entrees);
    $("vide").hidden = recos.length > 0;
    $("suggestions").replaceChildren(...recos.map(r =>
      el("li", {}, el("strong", {}, r.jeu.titre), el("span", { className: "score" }, r.score + "/100"),
        el("small", {}, r.jeu.genres.join(", ") + " · " + r.jeu.annee), el("p", {}, r.raison))));
  }

  $("form").addEventListener("submit", ev => {
    ev.preventDefault();
    const jeu = GAMES.find(g => norm(g.titre) === norm($("titre").value));
    $("erreur").hidden = !!jeu;
    if (!jeu) { $("erreur").textContent = "Jeu introuvable dans le catalogue."; return; }
    entrees = entrees.filter(e => e.id !== jeu.id).concat({ id: jeu.id, note: $("note").value });
    $("titre").value = "";
    afficher();
  });

  afficher();
}

fetch("data/jeux.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(demarrer)
  .catch(() => { $("chargement").hidden = false; });

const assert = require("assert");
const { recommander, ressemblance, GAMES } = require("./recommend.js");
const g = id => GAMES.find(x => x.id === id);

const fps = recommander([{ id: "doom-eternal", note: "adore" }]);
assert(fps.length > 0 && fps.length <= 10);
assert.strictEqual(fps[0].jeu.genres.includes("FPS"), true, "après un FPS, un FPS arrive en tête");
assert(!fps.some(r => r.jeu.id === "doom-eternal"), "pas de jeu déjà joué");
assert(ressemblance(g("doom-eternal"), g("halo-infinite")) > ressemblance(g("doom-eternal"), g("celeste")));

const malus = recommander([{ id: "doom-eternal" }, { id: "halo-infinite", note: "bof" }]);
const sansMalus = recommander([{ id: "doom-eternal" }]);
const s = (liste, id) => (liste.find(r => r.jeu.id === id) || { score: 0 }).score;
assert(s(malus, "titanfall-2") < s(sansMalus, "titanfall-2"), "le malus « bof » s'applique");

assert.deepStrictEqual(recommander([]), []);
assert(recommander([{ id: "doom-eternal" }], { plateformes: ["Switch"] }).every(r => r.jeu.plateformes.includes("Switch")));
console.log("OK\n" + fps.map(r => `${r.score}  ${r.jeu.titre} — ${r.raison}`).join("\n"));

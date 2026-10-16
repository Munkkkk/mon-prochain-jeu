# Mon prochain jeu

Site de suggestions de jeux vidéo : on saisit les jeux déjà joués (avec un avis facultatif : Adoré / Bien / Bof) et le site propose d'autres jeux proches (après un FPS, d'autres FPS).

## Lancer

Site statique, sans dépendance. Le catalogue est chargé depuis `data/jeux.json`, il faut donc un petit serveur local : `python3 -m http.server`, puis ouvrir http://localhost:8000.

## Tests

`node src/test.js`

## Structure

- `data/jeux.json` : catalogue de 168 jeux (genres, mécaniques, tags, studio, éditeur, série, plateformes, note critique, année) et liste `genres_voisins`. Liste écrite à la main, pas d'import IGDB ni Steam ; les notes critiques sont approximatives. Voir `meta` dans le fichier.
- `src/recommend.js` : calcul de ressemblance et classement (`creerMoteur(donnees)`).
- `src/app.js`, `src/style.css`, `index.html` : interface.

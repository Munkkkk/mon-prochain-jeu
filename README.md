# Mon prochain jeu

Site de suggestions de jeux vidéo : on saisit les jeux déjà joués (avec un avis facultatif : Adoré / Bien / Bof) et le site propose d'autres jeux proches (après un FPS, d'autres FPS).

## Lancer

Site statique, sans dépendance : ouvrir `index.html` dans un navigateur (ou `python3 -m http.server`).

## Tests

`node src/test.js`

## Structure

- `src/games.js` : catalogue de démonstration (en dur).
- `src/recommend.js` : calcul de ressemblance et classement.
- `src/app.js`, `src/style.css`, `index.html` : interface.

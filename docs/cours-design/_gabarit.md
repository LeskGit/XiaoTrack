# Gabarit d'un chapitre (à l'usage des rédacteurs)

Chaque chapitre suit exactement ce plan, dans cet ordre, avec ces titres :

```
# NN. Titre du chapitre

> **Prérequis :** chapitres X et Y. **Lecture :** ~N min. **Fichiers concernés :** liste courte.

## 1. Le problème
Une situation concrète (si possible tirée de XiaoTrack) où, sans cette notion, on est coincé ou on écrit
du code moche. Le lecteur doit comprendre POURQUOI la notion existe avant de savoir CE QU'ELLE EST.

## 2. La notion
Explication à partir de zéro. Chaque mot technique est défini à sa première apparition.
Schémas ASCII bienvenus. Pas de jargon non expliqué.

## 3. Exemple minimal
Un bout de code autonome, le plus court possible, qu'on peut coller dans un fichier .html
(ou dans la console) et tester tout de suite. Dire ce qu'on doit observer.

## 4. Dans XiaoTrack
Où et comment la notion est utilisée dans l'app. Pour chaque usage :
- le fichier, en lien markdown relatif depuis docs/cours-design/
  (ex. [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css)), avec le numéro de ligne (l. 42) ;
- l'extrait de code RÉEL (copié du fichier actuel, pas réinventé) ;
- l'explication ligne à ligne de cet extrait.

## 5. Pièges
Les erreurs fréquentes, et celles qu'on a réellement rencontrées dans ce projet s'il y en a.

## 6. À retenir
3 à 5 phrases, pas plus.

## 7. Exercice
Un petit exercice à faire dans le projet, sans rien casser (ou à annuler ensuite avec git),
avec ce qu'on doit observer. La solution dans un bloc <details><summary>Solution</summary> ... </details>.
```

Règles de rédaction :
- Français avec tous les accents, tutoiement, niveau débutant complet en CSS et en animation
  (le lecteur connaît React et TypeScript, pas le CSS moderne).
- Identifiants de code en anglais, tels qu'ils sont dans le projet.
- Exact avant tout : chaque extrait du §4 est vérifié dans le fichier actuel, chaque numéro de ligne aussi.
- Pas de remplissage : un chapitre fait la longueur qu'il faut (en général 120 à 250 lignes).
- Renvois entre chapitres sous la forme « (voir chapitre 03) ».

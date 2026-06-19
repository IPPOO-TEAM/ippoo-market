# Contribuer aux traductions IPPOO

Merci de contribuer aux dictionnaires des langues africaines locales. Aucune compétence technique n'est requise : il suffit d'éditer un fichier JSON.

## Langues réservées (contributions ouvertes)

| Code  | Langue                       | Fichier                          |
|-------|------------------------------|----------------------------------|
| fon   | Fon (Bénin)                  | `src/app/i18n/dict/fon.json`     |
| ff    | Peul (Pulaar/Fulfulde)       | `src/app/i18n/dict/ff.json`      |
| dyu   | Dioula (Jula)                | `src/app/i18n/dict/dyu.json`     |
| sef   | Sénoufo (Cebaara)            | `src/app/i18n/dict/sef.json`     |
| dje   | Djerma (Zarma)               | `src/app/i18n/dict/dje.json`     |

Une langue n'apparaît dans le sélecteur de l'application qu'une fois sa **couverture ≥ 90 %** des clés canoniques (`src/app/i18n/keys.ts`).

## Comment contribuer

1. Ouvrir le fichier JSON de la langue concernée.
2. Conserver le bloc `_meta` tel quel et ajouter votre nom dans `contributors`.
3. Ajouter chaque entrée sous la forme :

```json
{
  "_meta": { ... },
  "Accueil": "...",
  "Connexion": "...",
  "Inscription": "..."
}
```

4. La **clé** est le texte source en français (exact, casse et accents compris).
5. La **valeur** est la traduction validée par un locuteur natif.
6. Ne jamais inventer ou deviner. Une entrée vide ou absente est préférable à une approximation.

## Liste des clés canoniques

Voir `src/app/i18n/keys.ts` (constante `CANONICAL_KEYS`) pour la liste exhaustive des chaînes prioritaires à traduire.

## Validation

- Encodage : UTF-8.
- Format : JSON strict (pas de virgule finale, pas de commentaires).
- Pas de mélange de langues à l'intérieur d'une même valeur.
- Les caractères spéciaux (tons, diacritiques) doivent être conservés.

## Statuts `_meta.status`

- `empty` : aucune entrée utile, dictionnaire à constituer.
- `draft` : entrées en cours, non vérifiées.
- `review` : prêt pour relecture par un second locuteur.
- `ready` : validé, couverture ≥ 90 %.

## Sources recommandées

- SIL International (sil.org) , glossaires libres
- Universités locales (Abdou Moumouni, Abomey-Calavi, Abidjan)
- Ressources communautaires Wikipedia / Wiktionary dans la langue cible

Merci de privilégier la qualité à la quantité.

# MealMate Recipe Catalogue (MVP)

## What is included
- `RecipeCatalog` is separate from the existing user/AI `Recipe` model.
- TheMealDB importer normalizes ingredient names, measures, instructions, cuisine, image and source attribution.
- Preview requests use catalogue recipes first. Existing local templates remain the fallback.
- OpenRouter remains optional: send `useAI: true` with a preview request to explicitly request AI generation.
- Preview nutrition uses the local estimator; USDA enrichment is not on the initial preview critical path.

## Import up to 500 recipes
1. Configure `MONGO_URI` in `backend/.env`.
2. For local development, the importer defaults to TheMealDB test key `1`.
3. Run from the backend directory:

```bash
npm run recipes:import
```

Optional settings:
- `THEMEALDB_API_KEY`: TheMealDB API key (defaults to `1` for development).
- `RECIPE_IMPORT_LIMIT`: import target, capped at 500 (defaults to 500).

The importer uses the official first-letter search endpoints, de-duplicates by TheMealDB meal ID, and upserts records. The provider may return fewer than 500 usable recipes; the importer reports the actual count and does not fabricate data.

## Important source terms
TheMealDB's official API page says the test key is for development/education and that public app releases require a paid supporter key. TheMealDB's terms permit copying/modifying content returned through official API endpoints, but say not to remove copyright/trademark notices. Retain attribution and verify the current terms/key before publishing MealMate:
- https://www.themealdb.com/api.php
- https://www.themealdb.com/terms_of_use.php

## Limitations in this MVP
- Imported recipe quantities are provider-supplied text, not guaranteed to be standardized units.
- Dietary tags are inferred from ingredient names; this is a first-pass filter, not a certified allergen or dietary safety system.
- Strict pantry-only matching can return no catalogue matches when the user's pantry is too small. In that case the existing local fallback is used.
- Recipe catalogue results are selected randomly from valid matches; this MVP does not yet persist per-user impression history.
- Nutrition is estimated locally; imported provider recipes do not carry verified nutrition by default.

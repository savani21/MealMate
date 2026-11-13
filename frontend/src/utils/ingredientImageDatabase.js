// Ingredient image catalogue for TheMealDB's ingredient image collection.
// Keys include common names, Indian names, spelling variants and partial-name aliases.
// Values are canonical TheMealDB ingredient image names.
const entries = [
  ["bell pepper", "capsicum", "capsicum", "bellpepper", "shimla mirch"],
  ["potato", "potatoes", "aloo"], ["tomato", "tomatoes"], ["onion", "onions", "pyaz"],
  ["red onion", "purple onion"], ["spring onion", "scallion", "green onion"],
  ["carrot", "carrots", "gajar"], ["cucumber", "kheera"], ["spinach", "palak"],
  ["broccoli"], ["cauliflower", "gobi"], ["cabbage"], ["red cabbage"],
  ["garlic", "lehsun"], ["ginger", "adrak"], ["green peas", "peas", "matar"],
  ["sweetcorn", "corn", "maize", "makai"], ["mushroom", "mushrooms"],
  ["eggplant", "aubergine", "brinjal", "baingan"], ["zucchini", "courgette"],
  ["bottle gourd", "lauki"], ["bitter gourd", "karela"], ["ridge gourd", "turai"],
  ["okra", "lady finger", "ladyfinger", "bhindi"], ["radish", "mooli"],
  ["beetroot", "beet"], ["sweet potato"], ["pumpkin", "kaddu"],
  ["green beans", "french beans", "beans"], ["long beans"], ["drumstick", "moringa"],
  ["coriander leaves", "cilantro", "fresh coriander", "dhaniya"],
  ["mint", "mint leaves", "pudina"], ["fenugreek", "methi"],
  ["curry leaves", "kadi patta"], ["lettuce"], ["celery"], ["asparagus"],
  ["leek"], ["celeriac"], ["artichoke"], ["jalapeno"], ["green chilli", "green chili", "hari mirch"],
  ["red chilli", "red chili", "dry red chilli"], ["chilli", "chili", "chillies"],
  ["apple", "apples"], ["banana", "bananas", "kela"], ["orange", "oranges"],
  ["mango", "aam"], ["lemon", "nimbu"], ["lime"], ["papaya"], ["pineapple"],
  ["grapes", "grape"], ["strawberry", "strawberries"], ["blueberry", "blueberries"],
  ["raspberry", "raspberries"], ["blackberry", "blackberries"], ["watermelon"],
  ["muskmelon", "cantaloupe"], ["pomegranate", "anar"], ["guava", "amrood"],
  ["pear"], ["peach"], ["plum"], ["kiwi"], ["avocado"], ["coconut", "nariyal"],
  ["dates", "khajoor"], ["fig", "anjeer"], ["jackfruit", "kathal"],
  ["rice", "white rice", "cooked rice", "chawal"], ["basmati rice"],
  ["poha", "flattened rice", "beaten rice"], ["oats", "rolled oats"],
  ["quinoa"], ["pasta", "macaroni", "spaghetti"], ["noodles"],
  ["flour", "plain flour", "all purpose flour", "maida"], ["wheat flour", "atta"],
  ["whole wheat flour"], ["gram flour", "besan", "chickpea flour"],
  ["rice flour"], ["corn flour", "cornstarch"], ["semolina", "sooji", "rava"],
  ["breadcrumbs"], ["bread", "sliced bread"], ["pita bread"], ["tortilla"],
  ["lentils", "masoor dal", "red lentils"], ["moong dal", "mung beans", "green gram"],
  ["toor dal", "arhar dal", "pigeon peas"], ["urad dal", "black gram"],
  ["chickpeas", "chana", "garbanzo beans"], ["kidney beans", "rajma"],
  ["black beans"], ["white beans"], ["soybeans"], ["peanuts", "groundnuts", "moongphali"],
  ["almonds", "badam"], ["cashew", "cashews", "kaju"], ["walnuts", "akhrot"],
  ["pistachio", "pistachios", "pista"], ["raisins", "kishmish"], ["sesame seeds", "til"],
  ["chia seeds"], ["flax seeds", "linseeds"], ["sunflower seeds"], ["pumpkin seeds"],
  ["milk"], ["yogurt", "yoghurt", "curd", "dahi"], ["paneer", "cottage cheese"],
  ["cheese", "cheddar cheese"], ["mozzarella"], ["butter", "makhan"],
  ["cream", "fresh cream"], ["ghee"], ["condensed milk"], ["buttermilk", "chaas"],
  ["egg", "eggs"], ["chicken", "chicken pieces"], ["chicken breast"],
  ["chicken thigh"], ["mutton", "lamb"], ["beef"], ["pork"], ["fish"],
  ["salmon"], ["tuna"], ["prawns", "shrimp"], ["crab"], ["squid"],
  ["tofu"], ["soya chunks", "soy chunks"], ["tempeh"],
  ["turmeric", "haldi"], ["cumin", "jeera"], ["coriander", "coriander powder", "dhania powder"],
  ["black pepper", "pepper"], ["white pepper"], ["cinnamon", "dalchini"],
  ["cloves", "laung"], ["cardamom", "elaichi"], ["green cardamom"],
  ["bay leaf", "bay leaves", "tej patta"], ["mustard seeds", "rai", "sarson"],
  ["fennel seeds", "saunf"], ["fenugreek seeds", "methi seeds"],
  ["carom seeds", "ajwain"], ["asafoetida", "hing"], ["paprika"],
  ["red chilli powder", "chilli powder", "chili powder", "lal mirch powder"],
  ["garam masala"], ["curry powder"], ["saffron", "kesar"], ["nutmeg", "jaiphal"],
  ["star anise"], ["oregano"], ["thyme"], ["rosemary"], ["basil"], ["parsley"],
  ["vanilla"], ["salt"], ["sugar"], ["jaggery", "gur"], ["honey", "shahad"],
  ["oil", "vegetable oil"], ["olive oil"], ["mustard oil"], ["sesame oil"],
  ["vinegar"], ["soy sauce"], ["tomato ketchup", "ketchup"], ["mayonnaise"],
  ["coconut milk"], ["tamarind", "imli"], ["tomato paste"], ["lemon juice"],
  ["water"], ["yeast"], ["baking powder"], ["baking soda"]
];

const normalizeIngredientKey = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const ingredientImageEntries = entries.map(([imageName, ...aliases]) => ({
  imageName,
  keys: [imageName, ...aliases].map(normalizeIngredientKey)
}));

const aliasLookup = new Map();
for (const entry of ingredientImageEntries) {
  for (const key of entry.keys) {
    if (!aliasLookup.has(key)) aliasLookup.set(key, entry.imageName);
  }
}

const singularize = (word) => {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
};

// Exact aliases win. Otherwise match meaningful whole words/phrases, preferring
// the longest match so "green chilli" wins over the generic "chilli" entry.
export function findIngredientImageName(name = "") {
  const key = normalizeIngredientKey(name);
  if (!key) return null;
  if (aliasLookup.has(key)) return aliasLookup.get(key);

  const words = key.split(" ").map(singularize);
  const candidates = [];
  for (const entry of ingredientImageEntries) {
    for (const alias of entry.keys) {
      const aliasWords = alias.split(" ").map(singularize);
      const phrase = aliasWords.join(" ");
      const source = words.join(" ");
      const exactPhrase = source.includes(phrase) || phrase.includes(source);
      const overlap = aliasWords.filter((word) => word.length >= 4 && words.includes(word)).length;
      if (exactPhrase || overlap > 0) {
        candidates.push({
          imageName: entry.imageName,
          score: (exactPhrase ? 100 : 0) + phrase.length + overlap * 8
        });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.imageName || null;
}

const toImageTitle = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

export function getIngredientImageCandidates(name = "") {
  const matched = findIngredientImageName(name);
  const raw = String(name || "").trim().replace(/\s+/g, " ");
  const labels = [...new Set([toImageTitle(matched || ""), toImageTitle(raw)].filter(Boolean))];
  return labels.map(
    (label) => `https://www.themealdb.com/images/ingredients/${encodeURIComponent(label)}-Small.png`
  );
}

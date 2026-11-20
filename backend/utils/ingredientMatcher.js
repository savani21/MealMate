function normalizeIngredientName(value) {
  const cleaned = String(value || "").toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    // Strip recipe quantities and units before comparing ingredient identity.
    .replace(/^\\s*(?:\\d+\\s*\\/\\s*\\d+|\\d+(?:\\.\\d+)?|[½⅓⅔¼¾])\\s*(?:cups?|tbsp|tbsps|tablespoons?|tblspoons?|tsp|tsps|teaspoons?|kg|kgs|kilograms?|g|gm|gms|grm|grms|grams?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|pieces?|pcs?|cloves?|slices?|bunch(?:es)?|packs?|cans?)?\\s*(?:of\\s+)?/i, "")
    .replace(/\\s+(?:\\d+(?:\\.\\d+)?|\\d+\\s*\\/\\s*\\d+)\\s*(?:kg|kgs|g|gm|gms|grams?|ml|l|pieces?|pcs?)?\\s*$/i, "")
    .replace(/\\b(large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional|warm|whole|to taste)\\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim();
  const words = cleaned.split(" ").filter(Boolean);
  const irregularPlurals = {
    tomatoes: "tomato",
    potatoes: "potato",
    leaves: "leaf",
    chilies: "chili",
    chillies: "chilli",
    berries: "berry",
  };
  if (words.length) {
    const last = words[words.length - 1];
    if (irregularPlurals[last]) {
      words[words.length - 1] = irregularPlurals[last];
    } else if (/ies$/.test(last)) {
      words[words.length - 1] = last.slice(0, -3) + "y";
    } else if (/s$/.test(last) && !/ss$/.test(last)) {
      words[words.length - 1] = last.slice(0, -1);
    }
  }
  const name = words.join(" ");
  const aliases = {
    "basmati rice": "rice", "long grain rice": "rice",
    atta: "wheat flour", "whole wheat flour": "wheat flour", "wheat atta": "wheat flour",
    "tuver dal": "toor dal", "tuvar dal": "toor dal", "tur dal": "toor dal", "arhar dal": "toor dal",
    "green chilli": "green chili", "sunflower oil": "oil", "vegetable oil": "oil",
    "whole milk": "milk", "warm milk": "milk", "full cream milk": "milk", "toned milk": "milk", "cooking oil": "oil", "green peas": "peas", "bell pepper": "capsicum", "sweet pepper": "capsicum"
  };
  return aliases[name] || name;
}
module.exports = { normalizeIngredientName };

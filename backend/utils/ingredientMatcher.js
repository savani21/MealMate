function normalizeIngredientName(value) {
  const cleaned = String(value || "").toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional|warm|whole)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length && /s$/.test(words[words.length - 1]) && !/ss$/.test(words[words.length - 1])) {
    words[words.length - 1] = words[words.length - 1].slice(0, -1);
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

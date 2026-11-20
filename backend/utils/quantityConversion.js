const ALIASES = {
 kg:"kg",kgs:"kg",kilogram:"kg",kilograms:"kg",g:"g",gm:"g",gms:"g",gram:"g",grams:"g",
 l:"l",litre:"l",litres:"l",liter:"l",liters:"l",ml:"ml",milliliter:"ml",milliliters:"ml",millilitre:"ml",millilitres:"ml",
 piece:"piece",pieces:"piece",pc:"piece",pcs:"piece",cup:"cup",cups:"cup",tbsp:"tbsp",tbsps:"tbsp",tablespoon:"tbsp",tablespoons:"tbsp",tsp:"tsp",tsps:"tsp",teaspoon:"tsp",teaspoons:"tsp"
};
const FACTORS={kg:["mass",1000,"g"],g:["mass",1,"g"],l:["volume",1000,"ml"],ml:["volume",1,"ml"],piece:["count",1,"piece"],cup:["volume",250,"ml"],tbsp:["volume",15,"ml"],tsp:["volume",5,"ml"]};
function toComparableQuantity(quantity,unit){const key=ALIASES[String(unit||"").toLowerCase().trim()];const amount=Number(quantity);if(!key||!Number.isFinite(amount))return null;const [dimension,factor,baseUnit]=FACTORS[key];return{amount:amount*factor,dimension,unit:baseUnit};}
module.exports={toComparableQuantity};

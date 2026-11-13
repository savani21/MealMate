import AppNavbar from "@/components/AppNavbar";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ChefHat, Plus, Search, Trash2, Pencil, Check, X, Package,
  CalendarClock, AlertTriangle, ArrowRight, Leaf, Refrigerator,
  Carrot, Wheat, Milk, Sparkles, Clock3, ShoppingBasket
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");
const API = `${API_BASE}/user/pantry`;

const ingredientImageAliases = {
  capsicum: "Bell Pepper", bellpepper: "Bell Pepper", "bell pepper": "Bell Pepper",
  potato: "Potatoes", tomato: "Tomato", onion: "Onion", carrot: "Carrots",
  cucumber: "Cucumber", spinach: "Spinach", broccoli: "Broccoli", cauliflower: "Cauliflower",
  cabbage: "Cabbage", garlic: "Garlic", ginger: "Ginger", peas: "Peas",
  "green peas": "Peas", corn: "Sweetcorn", sweetcorn: "Sweetcorn", mushroom: "Mushrooms",
  apple: "Apple", banana: "Banana", orange: "Orange", mango: "Mango",
  lemon: "Lemon", lime: "Lime", papaya: "Papaya", pineapple: "Pineapple",
  grapes: "Grapes", strawberry: "Strawberries", strawberries: "Strawberries",
  rice: "Rice", "basmati rice": "Rice", flour: "Flour", wheat: "Wheat",
  "wheat flour": "Flour", atta: "Flour", oats: "Oats", pasta: "Pasta",
  lentils: "Lentils", dal: "Lentils", chickpeas: "Chickpeas", kidneybeans: "Kidney Beans",
  "kidney beans": "Kidney Beans", milk: "Milk", paneer: "Paneer", cheese: "Cheese",
  butter: "Butter", yogurt: "Yogurt", curd: "Yogurt", cream: "Cream",
  egg: "Egg", eggs: "Eggs", chicken: "Chicken", "chicken breast": "Chicken Breast",
  fish: "Fish", salmon: "Salmon", prawns: "Prawns", shrimp: "Shrimp",
  turmeric: "Turmeric", cumin: "Cumin", coriander: "Coriander", "coriander powder": "Coriander",
  chilli: "Chilli", chili: "Chilli", "green chili": "Green Chilli", "green chilli": "Green Chilli",
  cinnamon: "Cinnamon", cloves: "Cloves", cardamom: "Cardamom", pepper: "Black Pepper",
  "black pepper": "Black Pepper", sugar: "Sugar", salt: "Salt", honey: "Honey",
  oil: "Oil", "cooking oil": "Oil", ghee: "Ghee", coconut: "Coconut",
  "coconut milk": "Coconut Milk", tofu: "Tofu", bread: "Bread", semolina: "Semolina",
  poha: "Poha", "flattened rice": "Poha", quinoa: "Quinoa", avocado: "Avocado",
};
const ingredientImageUrl = (name) => {
  const key = String(name || "").toLowerCase().trim().replace(/\\s+/g, " ");
  const exact = ingredientImageAliases[key] || key.replace(/\\b\\w/g, (letter) => letter.toUpperCase());
  return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(exact)}-Small.png`;
};

function IngredientImage({ name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [name]);
  return (
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#f5f8ef] to-[#e8efdf]">
      {!failed ? (
        <img
          src={ingredientImageUrl(name)}
          alt={name}
          loading="lazy"
          className="h-full w-full object-contain p-3"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-3 text-center text-[#71856d]">
          <Leaf className="h-9 w-9 opacity-60" />
          <span className="mt-2 max-w-full truncate text-xs font-semibold capitalize">{name}</span>
          <span className="mt-0.5 text-[10px] text-[#9aa894]">Image not available</span>
        </div>
      )}
    </div>
  );
}
const groups = [
  { id: "all", label: "All items", icon: Package },
  { id: "vegetables", label: "Vegetables", icon: Carrot },
  { id: "fruits", label: "Fruits", icon: Leaf },
  { id: "grains", label: "Grains", icon: Wheat },
  { id: "dairy", label: "Dairy", icon: Milk },
  { id: "spices", label: "Spices", icon: Sparkles },
];
const classify = (name = "") => {
  const n = name.toLowerCase();
  if (/tomato|potato|onion|capsicum|carrot|spinach|broccoli|cabbage|cucumber|pepper|chilli|chili|vegetable|cauliflower|peas|beans|garlic|ginger/.test(n)) return "vegetables";
  if (/apple|banana|orange|mango|grape|berry|berries|lemon|lime|papaya|fruit|guava/.test(n)) return "fruits";
  if (/rice|wheat|flour|atta|dal|lentil|oat|pasta|bread|poha|semolina|rava|suji|grain/.test(n)) return "grains";
  if (/milk|curd|yogurt|cheese|paneer|butter|cream|ghee/.test(n)) return "dairy";
  if (/spice|salt|sugar|turmeric|cumin|coriander|masala|chilli powder|pepper powder/.test(n)) return "spices";
  return "other";
};
const readJson = async (response) => {
  const raw = await response.text();
  try { return raw ? JSON.parse(raw) : {}; }
  catch {
    const isHtml = /<!doctype html|<html/i.test(raw);
    const hint = isHtml
      ? "The request returned an HTML page instead of the Pantry API. The API is mounted at /api/user/pantry; check that the backend (not the Vite frontend) is running on port 5000 and restart it."
      : "The Pantry server returned an invalid response.";
    throw new Error(`Pantry API ${response.status} at ${response.url}. ${hint}`);
  }
};

export default function Pantry() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("g");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryData, setExpiryData] = useState({ expiringItems: [], recommendations: [] });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const token = () => localStorage.getItem("token");
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

  const load = async () => {
    try {
      const response = await fetch(API, { headers: headers() });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Unable to load pantry");
      setItems(data.items || []);
      const expiryResponse = await fetch(`${API}/expiry-recommendations?days=7`, { headers: headers() });
      const expiryResult = await readJson(expiryResponse);
      if (expiryResponse.ok) setExpiryData({ expiringItems: expiryResult.expiringItems || [], recommendations: expiryResult.recommendations || [] });
    } catch (error) {
      setMessage(error.message);
      if (!token()) setLocation("/login");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetch(`${API_BASE}/recipes`)
      .then(readJson)
      .then((data) => {
        const names = (data.recipes || []).flatMap((recipe) => recipe.ingredients || [])
          .map((ingredient) => String(ingredient).replace(/^\\s*[\\d./-]+\\s*/, "").replace(/\\s*(g|kg|ml|l|cup|cups|tbsp|tsp|pieces?)\\b.*$/i, "").trim())
          .filter(Boolean);
        setSuggestions([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      }).catch(() => {});
  }, []);

  const filtered = useMemo(() => items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === "all" || classify(item.name) === category)
  ), [items, search, category]);

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    const cleanName = name.trim();
    const amount = Number(quantity);
    if (!cleanName || !Number.isFinite(amount) || amount <= 0 || !unit) {
      setMessage("Enter an ingredient, a quantity greater than zero, and a unit.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(editing ? `${API}/${editing}` : API, {
        method: editing ? "PATCH" : "POST", headers: headers(),
        body: JSON.stringify({ name: cleanName, quantity: amount, unit, expiryDate: expiryDate || null }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Could not save ingredient");
      setName(""); setQuantity("1"); setUnit("g"); setExpiryDate(""); setEditing(null);
      setMessage(data.message || "Pantry updated");
      await load();
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  const startEdit = (item) => {
    setEditing(item._id); setName(item.name); setQuantity(String(item.quantity)); setUnit(item.unit);
    setExpiryDate(item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cancelEdit = () => { setEditing(null); setName(""); setQuantity("1"); setUnit("g"); setExpiryDate(""); };
  const remove = async (id) => {
    if (!window.confirm("Remove this ingredient from your pantry?")) return;
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE", headers: headers() });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.message || "Could not remove ingredient");
      setItems((current) => current.filter((item) => item._id !== id));
      setMessage("Ingredient removed from pantry");
    } catch (error) { setMessage(error.message); }
  };

  const expiringCount = expiryData.expiringItems.length;
  const categoriesCount = groups.slice(1).filter((g) => items.some((item) => classify(item.name) === g.id)).length;

  return <div className="min-h-screen bg-[#f7f8f2] text-[#202b22]">
    <AppNavbar />
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 lg:px-8">
      <section className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-[#173f2b] px-5 py-4 text-white shadow-sm sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b9e38e]">My kitchen</p>
          <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">Your Pantry</h1>
          <p className="mt-1 text-xs text-white/75 sm:text-sm">Manage ingredients, track freshness and plan what to cook.</p>
        </div>
        <button onClick={() => document.getElementById("add-pantry-item")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#c8ed9f] px-4 py-2.5 text-xs font-bold text-[#173f2b] transition hover:bg-white"><Plus className="h-4 w-4"/> Add item</button>
      </section>

      <section className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-[#e8ece2] bg-white p-4 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf6e8] text-[#39834b]"><Refrigerator className="h-6 w-6"/></div><div><p className="text-2xl font-extrabold">{items.length}</p><p className="text-xs font-medium text-[#788278]">Ingredients in pantry</p></div></div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#e8ece2] bg-white p-4 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff3df] text-[#c18426]"><CalendarClock className="h-6 w-6"/></div><div><p className="text-2xl font-extrabold">{expiringCount}</p><p className="text-xs font-medium text-[#788278]">Expiring in 7 days</p></div></div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#e8ece2] bg-white p-4 shadow-sm"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0edfb] text-[#7860ae]"><Sparkles className="h-6 w-6"/></div><div><p className="text-2xl font-extrabold">{categoriesCount}</p><p className="text-xs font-medium text-[#788278]">Categories stocked</p></div></div>
      </section>

      <section className="mb-7 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <form id="add-pantry-item" onSubmit={save} className="rounded-[24px] border border-[#e8ece2] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#719077]">{editing ? "Edit your stock" : "Build your pantry"}</p><h2 className="mt-1 text-xl font-extrabold">{editing ? "Update ingredient" : "Add an ingredient"}</h2></div><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e8] text-[#39834b]"><ShoppingBasket className="h-5 w-5"/></span></div>
          <div className="space-y-3">
            <div><label className="mb-1.5 block text-xs font-semibold text-[#59665b]">Ingredient name</label><input list="pantry-ingredient-suggestions" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes, basmati rice..." className="w-full rounded-xl border border-[#e3e9df] bg-[#fbfcf9] px-4 py-3 text-sm outline-none transition focus:border-[#72a66b] focus:ring-4 focus:ring-[#72a66b]/10" required/><datalist id="pantry-ingredient-suggestions">{suggestions.map((item) => <option key={item} value={item}/>)}</datalist></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-xs font-semibold text-[#59665b]">Quantity</label><input type="number" min="0.01" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-xl border border-[#e3e9df] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#72a66b]" required/></div><div><label className="mb-1.5 block text-xs font-semibold text-[#59665b]">Unit</label><select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-xl border border-[#e3e9df] bg-[#fbfcf9] px-3 py-3 text-sm outline-none focus:border-[#72a66b]"><option value="g">Grams (g)</option><option value="kg">Kilograms (kg)</option><option value="ml">Millilitres (ml)</option><option value="l">Litres (l)</option><option value="piece">Pieces</option><option value="cup">Cups</option><option value="tbsp">Tablespoons</option><option value="tsp">Teaspoons</option></select></div></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-[#59665b]">Best before <span className="font-normal text-[#9aa49a]">(optional)</span></label><input type="date" min={new Date().toISOString().slice(0,10)} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-xl border border-[#e3e9df] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#72a66b]"/></div>
          </div>
          <div className="mt-5 flex gap-2"><button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#267342] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1b5e35] disabled:opacity-60">{editing ? <Check className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}{saving ? "Saving..." : editing ? "Save changes" : "Add to pantry"}</button>{editing && <button type="button" onClick={cancelEdit} className="rounded-xl border border-[#e3e9df] px-4 text-[#68766a] hover:bg-[#f7faf4]"><X className="h-4 w-4"/></button>}</div>
          <p className="mt-3 text-[11px] leading-5 text-[#9aa49a]">Adding an existing ingredient with the same unit increases its current quantity.</p>
          {message && <p role="status" className="mt-3 rounded-xl bg-[#f1f7ed] px-3 py-2 text-xs font-medium text-[#39734a]">{message}</p>}
        </form>

        <section className="overflow-hidden rounded-[24px] border border-[#f0e5c9] bg-[#fffdf7] shadow-sm">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#b18439]">Freshness reminder</p><h2 className="mt-1 text-xl font-extrabold">Use it before you lose it.</h2><p className="mt-1 text-xs text-[#8b887b]">Recipes that make the most of ingredients expiring soon.</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff1d6] text-[#bd8129]"><Clock3 className="h-5 w-5"/></span></div>
          {expiringCount === 0 ? <div className="mx-5 mb-5 flex min-h-44 flex-col items-center justify-center rounded-2xl bg-[#fff8e9] px-5 text-center sm:mx-6"><img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=420&auto=format&fit=crop&q=80" alt="Fresh healthy ingredients" className="mb-3 h-20 w-28 rounded-xl object-cover"/><p className="text-sm font-bold text-[#665b42]">Your ingredients are looking fresh!</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#92866e]">Add expiry dates to pantry items and we’ll suggest recipes to use them in time.</p></div> : <div className="px-5 pb-5 sm:px-6"><div className="flex flex-wrap gap-2">{expiryData.expiringItems.map((item) => <span key={item._id} className="rounded-full border border-[#f0dba9] bg-white px-3 py-1.5 text-xs font-semibold text-[#795b25]"><AlertTriangle className="mr-1 inline h-3 w-3"/>{item.name} · {new Date(item.expiryDate).toLocaleDateString()}</span>)}</div>{expiryData.recommendations.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{expiryData.recommendations.map((recipe) => <button key={recipe._id} onClick={() => setLocation("/recipes/" + recipe._id)} className="flex items-center justify-between rounded-xl border border-[#f0e5c9] bg-white p-3 text-left text-sm font-bold hover:border-[#d8b96e]"><span>{recipe.name}<small className="mt-1 block text-xs font-normal text-[#92866e]">Use: {recipe.expiringIngredients.map((i) => i.name).join(", ")}</small></span><ArrowRight className="h-4 w-4 shrink-0 text-[#bd8129]"/></button>)}</div> : <p className="mt-3 text-xs text-[#92866e]">No saved recipes match these ingredients yet.</p>}</div>}
        </section>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#719077]">Your kitchen inventory</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight">Everything in your pantry</h2><p className="mt-1 text-sm text-[#849084]">{items.length} ingredients ready for your next meal</p></div><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa49a]"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your ingredients..." className="w-full rounded-full border border-[#e3e9df] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#72a66b]"/></div></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{groups.map((group) => { const Icon = group.icon; const active = category === group.id; return <button key={group.id} onClick={() => setCategory(group.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${active ? "bg-[#267342] text-white shadow-md shadow-[#267342]/15" : "border border-[#e5eae1] bg-white text-[#718073] hover:border-[#9cbd91]"}`}><Icon className="h-3.5 w-3.5"/>{group.label}{group.id === "all" ? ` · ${items.length}` : ""}</button>; })}</div>
        {loading ? <div className="rounded-3xl bg-white p-14 text-center text-sm text-[#849084]">Loading your pantry...</div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-[#dce5d8] bg-white px-5 py-14 text-center"><Package className="mx-auto h-10 w-10 text-[#a9b8a5]"/><p className="mt-3 font-bold">{search || category !== "all" ? "No ingredients found" : "Your pantry is waiting"}</p><p className="mt-1 text-sm text-[#849084]">Try another category or add ingredients to get started.</p><button onClick={() => {setCategory("all");setSearch("");}} className="mt-4 text-xs font-bold text-[#267342]">Show all ingredients</button></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => { const group = classify(item.name); return <article key={item._id} className="group overflow-hidden rounded-[22px] border border-[#e8ece2] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"><IngredientImage name={item.name}/><span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold capitalize text-[#426b48] backdrop-blur">{group === "other" ? "Pantry staple" : group}</span><div className="absolute right-3 top-3 flex gap-1"><button onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`} className="rounded-full bg-white/90 p-2 text-[#536655] shadow-sm hover:bg-white hover:text-[#267342]"><Pencil className="h-3.5 w-3.5"/></button><button onClick={() => remove(item._id)} aria-label={`Remove ${item.name}`} className="rounded-full bg-white/90 p-2 text-[#8a7771] shadow-sm hover:bg-white hover:text-red-600"><Trash2 className="h-3.5 w-3.5"/></button></div><div className="p-4"><h3 className="truncate text-base font-extrabold capitalize">{item.name}</h3><p className="mt-1 text-sm text-[#7d8b7e]">{item.quantity} {item.unit}</p>{item.expiryDate ? <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#fff5e3] px-2.5 py-1 text-[10px] font-semibold text-[#9a702b]"><CalendarClock className="h-3 w-3"/> Best before {new Date(item.expiryDate).toLocaleDateString()}</p> : <p className="mt-3 text-[10px] text-[#a2aca0]">No expiry date added</p>}</div></article>; })}</div>}
      </section>
    </main>
  </div>;
}

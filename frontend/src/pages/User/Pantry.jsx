import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChefHat, Plus, Search, Trash2, Pencil, Check, X, Package } from "lucide-react";

const API = "http://localhost:5000/api/user/pantry";

export default function Pantry() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("g");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const token = () => localStorage.getItem("token");
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

  const load = async () => {
    try {
      const response = await fetch(API, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load pantry");
      setItems(data.items || []);
    } catch (error) {
      setMessage(error.message);
      if (!token()) setLocation("/login");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetch("http://localhost:5000/api/recipes")
      .then((response) => response.json())
      .then((data) => {
        const names = (data.recipes || []).flatMap((recipe) => recipe.ingredients || [])
          .map((ingredient) => String(ingredient).replace(/^\s*[\d./-]+\s*/, "").replace(/\s*(g|kg|ml|l|cup|cups|tbsp|tsp|pieces?)\b.*$/i, "").trim())
          .filter(Boolean);
        setSuggestions([...new Set(names)].sort((a, b) => a.localeCompare(b)));
      }).catch(() => {});
  }, []);

  const filtered = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [items, search]);

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
        method: editing ? "PATCH" : "POST",
        headers: headers(),
        body: JSON.stringify({ name: cleanName, quantity: amount, unit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save ingredient");
      setName(""); setQuantity("1"); setUnit("g"); setEditing(null);
      setMessage(data.message || "Pantry updated");
      await load();
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  };

  const startEdit = (item) => {
    setEditing(item._id); setName(item.name); setQuantity(String(item.quantity)); setUnit(item.unit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this ingredient from your pantry?")) return;
    try {
      const response = await fetch(`${API}/${id}`, { method: "DELETE", headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove ingredient");
      setItems((current) => current.filter((item) => item._id !== id));
      setMessage("Ingredient removed from pantry");
    } catch (error) { setMessage(error.message); }
  };

  return <div className="min-h-screen bg-[#f7faf7]">
    <header className="bg-white border-b border-gray-100"><div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between">
      <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 font-black text-gray-900"><ChefHat className="w-6 h-6 text-primary" />Meal<span className="text-primary">Mate</span></button>
      <nav className="flex gap-2 text-sm"><button onClick={() => setLocation("/meal-planner")} className="px-3 py-2 rounded-lg hover:bg-green-50">Meal Planner</button><button onClick={() => setLocation("/recipes")} className="px-3 py-2 rounded-lg hover:bg-green-50">Recipes</button></nav>
    </div></header>
    <main className="max-w-5xl mx-auto px-4 py-9">
      <div className="mb-7"><div className="inline-flex items-center gap-2 text-primary text-sm font-semibold"><Package className="w-4 h-4"/> Pantry Management</div><h1 className="text-3xl font-black text-gray-900 mt-2">Your Pantry</h1><p className="text-gray-500 mt-2">Keep ingredient quantities up to date so MealMate can plan around what you actually have.</p></div>
      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">{editing ? "Update ingredient" : "Add ingredients"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_auto] gap-3">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ingredient</label><input list="pantry-ingredient-suggestions" value={name} onChange={(e) => setName(e.target.value)} placeholder="Search or enter ingredient" className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-primary" required/><datalist id="pantry-ingredient-suggestions">{suggestions.map((item) => <option key={item} value={item}/>)}</datalist></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label><input type="number" min="0.01" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-primary" required/></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Unit</label><select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 bg-white outline-none focus:border-primary"><option value="g">Grams (g)</option><option value="kg">Kilograms (kg)</option><option value="ml">Millilitres (ml)</option><option value="l">Litres (l)</option><option value="piece">Pieces</option><option value="cup">Cups</option><option value="tbsp">Tablespoons</option><option value="tsp">Teaspoons</option></select></div>
          <div className="flex items-end gap-2"><button disabled={saving} className="h-[46px] px-4 rounded-xl bg-primary text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60">{editing ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}{saving ? "Saving" : editing ? "Update" : "Add"}</button>{editing && <button type="button" onClick={() => {setEditing(null);setName("");setQuantity("1");setUnit("g");}} className="h-[46px] px-3 rounded-xl border border-gray-200"><X className="w-4 h-4"/></button>}</div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Adding an ingredient that already exists with the same unit increases its current quantity.</p>
        {message && <p role="status" className="text-sm text-primary mt-3">{message}</p>}
      </form>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="font-bold text-gray-900">Available ingredients</h2><p className="text-xs text-gray-500 mt-1">{items.length} pantry items</p></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pantry" className="pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"/></div></div>
        {loading ? <p className="p-8 text-center text-gray-500">Loading pantry...</p> : filtered.length === 0 ? <div className="p-10 text-center"><Package className="w-9 h-9 mx-auto text-gray-300"/><p className="font-semibold text-gray-800 mt-3">{search ? "No matching ingredients" : "Your pantry is empty"}</p><p className="text-sm text-gray-500 mt-1">Add ingredients above to start tracking quantities.</p></div> : <div className="divide-y divide-gray-100">{filtered.map((item) => <div key={item._id} className="px-5 py-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-50 text-primary flex items-center justify-center"><Package className="w-5 h-5"/></div><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 capitalize">{item.name}</p><p className="text-sm text-gray-500">{item.quantity} {item.unit}</p></div><button onClick={() => startEdit(item)} className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-primary" aria-label={`Edit ${item.name}`}><Pencil className="w-4 h-4"/></button><button onClick={() => remove(item._id)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label={`Remove ${item.name}`}><Trash2 className="w-4 h-4"/></button></div>)}</div>}
      </section>
    </main>
  </div>;
}

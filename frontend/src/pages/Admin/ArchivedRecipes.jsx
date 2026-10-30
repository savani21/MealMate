import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { API_BASE_URL } from "../../api/config.js";
import { ArrowLeft, Archive, RotateCcw, Trash2 } from "lucide-react";

export default function ArchivedRecipes() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const loadArchived = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/recipes/archived`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load archive");
      setItems(data.archivedRecipes || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to load archived recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArchived(); }, []);

  const restore = async (item) => {
    try {
      setBusyId(item._id);
      const response = await fetch(`${API_BASE_URL}/api/admin/recipes/archived/${item._id}/restore`, {
        method: "POST", headers: headers(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to restore recipe");
      setItems((current) => current.filter((entry) => entry._id !== item._id));
    } catch (error) {
      alert(error.message || "Unable to restore recipe.");
    } finally {
      setBusyId("");
    }
  };

  const permanentlyDelete = async (item) => {
    if (!window.confirm(`Permanently delete "${item.recipeData?.name || "this recipe"}"? This cannot be undone.`)) return;
    try {
      setBusyId(item._id);
      const response = await fetch(`${API_BASE_URL}/api/admin/recipes/archived/${item._id}`, {
        method: "DELETE", headers: headers(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete recipe");
      setItems((current) => current.filter((entry) => entry._id !== item._id));
    } catch (error) {
      alert(error.message || "Unable to permanently delete recipe.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto h-20 px-4 flex items-center gap-4">
          <button onClick={() => setLocation("/admin/recipes")} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center"><Archive className="w-6 h-6 text-primary" /></div>
          <div><h1 className="text-xl font-black text-gray-900">Archived Recipes</h1><p className="text-xs text-gray-400">{items.length} archived recipes</p></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? <p className="text-gray-500">Loading archive...</p> : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">No archived recipes.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const recipe = item.recipeData || {};
              return <article key={item._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h2 className="font-bold text-lg text-gray-900">{recipe.name || "Untitled recipe"}</h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{recipe.description || "No description"}</p>
                <p className="text-xs text-gray-400 mt-3">Deleted {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : ""} · {item.deletedBy?.name || item.deletedByRole || "Unknown"}</p>
                <div className="flex gap-2 mt-5">
                  <button disabled={busyId === item._id} onClick={() => restore(item)} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary text-white py-2 text-sm font-semibold disabled:opacity-50"><RotateCcw className="w-4 h-4" /> Restore</button>
                  <button disabled={busyId === item._id} onClick={() => permanentlyDelete(item)} className="px-3 rounded-lg border border-red-100 text-red-600 disabled:opacity-50" title="Permanently delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </article>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}

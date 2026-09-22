import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Sparkles,
} from "lucide-react";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "Other",
  diet: "Any",
  ingredients: "",
  instructions: "",
  prepTime: "",
  image: "",
};

export default function Recipes() {
  const [, setLocation] = useLocation();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/recipes", {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load recipes");
        return;
      }

      setRecipes(data.recipes || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (recipe) => {
    setEditingId(recipe._id);
    setForm({
      name: recipe.name || "",
      description: recipe.description || "",
      category: recipe.category || "Other",
      diet: recipe.diet || "Any",
      ingredients: (recipe.ingredients || []).join(", "),
      instructions: (recipe.instructions || []).join("\n"),
      prepTime: recipe.prepTime || "",
      image: recipe.image || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Recipe name is required.");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      diet: form.diet,
      ingredients: form.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
      instructions: form.instructions.split("\n").map((i) => i.trim()).filter(Boolean),
      prepTime: form.prepTime,
      image: form.image,
    };

    try {
      setSaving(true);

      const url = editingId
        ? `http://localhost:5000/api/admin/recipes/${editingId}`
        : "http://localhost:5000/api/admin/recipes";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save recipe");
        return;
      }

      if (editingId) {
        setRecipes((prev) => prev.map((r) => (r._id === editingId ? data.recipe : r)));
      } else {
        setRecipes((prev) => [data.recipe, ...prev]);
      }

      closeForm();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  };

  const removeRecipe = async (recipe) => {
    if (!confirm(`Delete "${recipe.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/recipes/${recipe._id}`,
        { method: "DELETE", headers: authHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to delete recipe");
        return;
      }

      setRecipes((prev) => prev.filter((r) => r._id !== recipe._id));
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">Manage Recipes</h1>
                <p className="text-xs text-gray-400">
                  {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Recipe</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {loading ? (
          <p className="text-gray-400">Loading recipes...</p>
        ) : filteredRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            No recipes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-lg text-gray-900">{recipe.name}</h3>
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-primary bg-green-50 px-2.5 py-1 rounded-full">
                    {recipe.category || "Other"}
                  </span>
                </div>

                {recipe.source === "ai" && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-2 w-fit">
                    <Sparkles className="w-3 h-3" />
                    AI generated
                  </span>
                )}

                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3 flex-1">
                  {recipe.description || "No description provided."}
                </p>

                <div className="flex items-center gap-2 mt-5">
                  <button
                    onClick={() => openEditForm(recipe)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => removeRecipe(recipe)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 border border-red-100 rounded-lg px-3 py-2.5 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Edit Recipe" : "Add Recipe"}
              </h2>
              <button
                onClick={closeForm}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={handleChange("name")}
                  className="input"
                  placeholder="e.g. Veggie Rice Bowl"
                  required
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={handleChange("description")}
                  className="input"
                  rows={3}
                  placeholder="Short description of the recipe"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <input
                    value={form.category}
                    onChange={handleChange("category")}
                    className="input"
                    placeholder="e.g. Breakfast"
                  />
                </Field>

                <Field label="Diet">
                  <input
                    value={form.diet}
                    onChange={handleChange("diet")}
                    className="input"
                    placeholder="e.g. Vegan"
                  />
                </Field>
              </div>

              <Field label="Ingredients (comma-separated)">
                <textarea
                  value={form.ingredients}
                  onChange={handleChange("ingredients")}
                  className="input"
                  rows={2}
                  placeholder="rice, tofu, broccoli, soy sauce"
                />
              </Field>

              <Field label="Instructions (one step per line)">
                <textarea
                  value={form.instructions}
                  onChange={handleChange("instructions")}
                  className="input"
                  rows={4}
                  placeholder={"Cook the rice.\nSauté the tofu.\nCombine and serve."}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Prep Time">
                  <input
                    value={form.prepTime}
                    onChange={handleChange("prepTime")}
                    className="input"
                    placeholder="e.g. 20 mins"
                  />
                </Field>

                <Field label="Image URL">
                  <input
                    value={form.image}
                    onChange={handleChange("image")}
                    className="input"
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s ease;
        }
        .input:focus {
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

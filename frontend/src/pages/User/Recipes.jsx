import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import {
    ArrowLeft,
    Search,
    ChefHat,
    Clock,
    Heart,
    Utensils,
    Sparkles,
    X,
} from "lucide-react";

export default function Recipes() {
    const [, setLocation] = useLocation();
    const initialIngredients = new URLSearchParams(window.location.search).get("ingredients") || "";

    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState(initialIngredients);
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [showGenerator, setShowGenerator] = useState(false);
    const [ingredients, setIngredients] = useState("");
    const [diet, setDiet] = useState("Any");
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/recipes");
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

    const generateRecipe = async () => {
        if (!ingredients.trim()) {
            alert("Enter at least one ingredient.");
            return;
        }

        setGenerating(true);

        try {
            const response = await fetch("http://localhost:5000/api/ai/generate-recipe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ingredients, diet }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to generate recipe");
                return;
            }

            setShowGenerator(false);
            setIngredients("");
            setDiet("Any");
            setRecipes((prev) => [data.recipe, ...prev]);
            setLocation(`/recipes/${data.recipe._id}`);
        } catch (error) {
            console.error(error);
            alert("Unable to generate recipe.");
        } finally {
            setGenerating(false);
        }
    };

    const searchTerms = search.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);

    const filteredRecipes = recipes.filter((recipe) => {
        const searchableText = [
            recipe.name,
            recipe.description,
            ...(recipe.ingredients || []),
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchTerms.length === 0 ||
            searchTerms.some((term) => searchableText.includes(term));

        const matchesCategory = category === "All" || recipe.category === category;

        return matchesSearch && matchesCategory;
    });

    const categories = [
        "All",
        ...new Set(recipes.map((recipe) => recipe.category)),
    ];

    const toggleFavorite = async (recipeId) => {
        try {
            const token = localStorage.getItem("token");
            const isFavorite = favorites.includes(recipeId);

            const response = await fetch(`http://localhost:5000/api/favorites/${recipeId}`, {
                method: isFavorite ? "DELETE" : "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to update favorite");
                return;
            }

            setFavorites(
                isFavorite
                    ? favorites.filter((id) => id !== recipeId)
                    : [...favorites, recipeId]
            );
        } catch (error) {
            console.error(error);
            alert("Unable to update favorite");
        }
    };

    return (
        <div className="min-h-screen bg-[#f7faf7]">
            <header className="bg-white border-b border-gray-100">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-2">
                        <ChefHat className="w-6 h-6 text-primary" />
                        <span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <section className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">
                        <Utensils className="w-4 h-4" />
                        MealMate Recipes
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Discover Delicious Recipes</h1>
                    <p className="text-gray-500 mt-3">Find recipes or create one with AI from your ingredients.</p>
                    <button onClick={() => setShowGenerator(true)} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">
                        <Sparkles className="w-5 h-5" />
                        Generate Recipe with AI
                    </button>
                </section>

                {showGenerator && (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">AI Recipe Generator</h2>
                                <p className="text-sm text-gray-500 mt-1">Tell MealMate what ingredients you have.</p>
                            </div>
                            <button onClick={() => setShowGenerator(false)} className="p-2 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                        </div>
                        <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Example: paneer, tomato, onion, spinach" rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary resize-none" />
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Diet</label>
                            <select value={diet} onChange={(e) => setDiet(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary">
                                <option>Any</option><option>Vegetarian</option><option>Vegan</option><option>High Protein</option>
                            </select>
                        </div>
                        <button onClick={generateRecipe} disabled={generating} className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50">
                            {generating ? "Generating Recipe..." : "Generate Recipe"}
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search recipes or ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-primary" />
                    </div>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary">
                        {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                {searchTerms.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-600">Ingredients:</span>
                        {searchTerms.map((term) => <span key={term} className="px-3 py-1 rounded-full bg-green-50 text-primary text-xs font-semibold">{term}</span>)}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading recipes...</div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <ChefHat className="w-12 h-12 mx-auto text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-900 mt-4">No recipes found</h2>
                        <p className="text-gray-500 mt-2">Try another ingredient or search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRecipes.map((recipe) => (
                            <RecipeCard key={recipe._id} recipe={recipe} onClick={() => setLocation(`/recipes/${recipe._id}`)} isFavorite={favorites.includes(recipe._id)} onFavorite={() => toggleFavorite(recipe._id)} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function RecipeCard({ recipe, onClick, isFavorite, onFavorite }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="h-48 bg-green-50 flex items-center justify-center">
                {recipe.image ? <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" /> : <ChefHat className="w-16 h-16 text-primary" />}
            </div>
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">{recipe.category}</span>
                    <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className="p-1" title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                        <Heart className={`w-5 h-5 transition ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-red-400"}`} />
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-3">{recipe.name}</h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{recipe.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-4"><Clock className="w-4 h-4" />{recipe.prepTime || "Easy"}</div>
                <button onClick={onClick} className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">View Recipe</button>
            </div>
        </div>
    );
}
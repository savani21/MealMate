import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Utensils,
} from "lucide-react";

export default function RecipeDetails() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/recipes/:id");

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchRecipe();
    }
  }, [params?.id]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/recipes/${params.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Recipe not found");
        setLocation("/recipes");
        return;
      }

      setRecipe(data.recipe);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <p className="text-gray-500">Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/recipes")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Recipes
            </button>

            <div className="flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-primary" />

              <span className="text-xl font-black text-gray-900">
                Meal<span className="text-primary">Mate</span>
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Recipe Header */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Image */}
          <div className="h-64 md:h-80 bg-green-50 flex items-center justify-center">

            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefHat className="w-24 h-24 text-primary" />
            )}

          </div>

          {/* Information */}
          <div className="p-6 md:p-10">

            <div className="flex flex-wrap gap-3">

              <span className="px-3 py-1 rounded-full bg-green-50 text-primary text-sm font-semibold">
                {recipe.category || "Other"}
              </span>

              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
                {recipe.diet || "Any"}
              </span>

            </div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-5">
              {recipe.name}
            </h1>

            <p className="text-gray-500 mt-4 max-w-3xl">
              {recipe.description || "A delicious MealMate recipe."}
            </p>

            <div className="flex items-center gap-2 text-gray-500 mt-5">
              <Clock className="w-5 h-5 text-primary" />
              <span>{recipe.prepTime || "Preparation time not specified"}</span>
            </div>

          </div>

        </section>

        {/* Ingredients */}
        <section className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>

            <h2 className="text-2xl font-black text-gray-900">
              Ingredients
            </h2>

          </div>

          {recipe.ingredients?.length > 0 ? (
            <ul className="space-y-3">

              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 text-gray-700"
                >
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {ingredient}
                </li>
              ))}

            </ul>
          ) : (
            <p className="text-gray-500">
              No ingredients available.
            </p>
          )}

        </section>

        {/* Instructions */}
        <section className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">

          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Instructions
          </h2>

          {recipe.instructions?.length > 0 ? (
            <div className="space-y-5">

              {recipe.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex gap-4"
                >

                  <div className="w-9 h-9 shrink-0 rounded-full bg-green-50 text-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </div>

                  <p className="text-gray-700 leading-relaxed pt-1">
                    {instruction}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <p className="text-gray-500">
              No instructions available.
            </p>
          )}

        </section>

      </main>
    </div>
  );
}
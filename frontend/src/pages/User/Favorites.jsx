import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ChefHat,
  Heart,
  Trash2,
} from "lucide-react";

export default function Favorites() {
  const [, setLocation] = useLocation();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/favorites",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load favorites");
        return;
      }

      setFavorites(data.favorites || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipeId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/favorites/${recipeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to remove favorite");
        return;
      }

      setFavorites((prev) =>
        prev.filter((recipe) => recipe._id !== recipeId)
      );
    } catch (error) {
      console.error(error);
      alert("Unable to remove favorite.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <p className="text-gray-500">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Dashboard
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="mb-8">

          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />

            <h1 className="text-3xl md:text-4xl font-black text-gray-900">
              My Favorites
            </h1>
          </div>

          <p className="text-gray-500 mt-2">
            Your saved recipes in one place.
          </p>

        </div>

        {favorites.length === 0 ? (

          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">

            <Heart className="w-14 h-14 mx-auto text-gray-300" />

            <h2 className="text-xl font-bold text-gray-900 mt-5">
              No favorite recipes yet
            </h2>

            <p className="text-gray-500 mt-2">
              Save recipes you love and find them here.
            </p>

            <button
              onClick={() => setLocation("/recipes")}
              className="mt-6 px-5 py-3 rounded-xl bg-primary text-white font-semibold"
            >
              Browse Recipes
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {favorites.map((recipe) => (

              <div
                key={recipe._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition"
              >

                {/* Image */}
                <div className="h-48 bg-green-50 flex items-center justify-center">

                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ChefHat className="w-16 h-16 text-primary" />
                  )}

                </div>

                {/* Content */}
                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {recipe.name}
                      </h2>

                      <p className="text-sm text-primary font-semibold mt-1">
                        {recipe.category || "Recipe"}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFavorite(recipe._id)}
                      className="p-2 rounded-lg hover:bg-red-50 transition"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>

                  </div>

                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {recipe.description ||
                      "A delicious MealMate recipe."}
                  </p>

                  <button
                    onClick={() =>
                      setLocation(`/recipes/${recipe._id}`)
                    }
                    className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition"
                  >
                    View Recipe
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>
    </div>
  );
}
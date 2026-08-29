import { useEffect, useState } from "react";
import { useLocation } from "wouter";

import {
    ArrowLeft,
    Search,
    ChefHat,
    Clock,
    Heart,
    Utensils,
} from "lucide-react";

export default function Recipes() {
    const [, setLocation] = useLocation();

    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/recipes"
            );

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

    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch =
            recipe.name
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesCategory =
            category === "All" ||
            recipe.category === category;

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

            const response = await fetch(
                `http://localhost:5000/api/favorites/${recipeId}`,
                {
                    method: isFavorite ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to update favorite");
                return;
            }

            if (isFavorite) {
                setFavorites(
                    favorites.filter((id) => id !== recipeId)
                );
            } else {
                setFavorites([...favorites, recipeId]);
            }

        } catch (error) {
            console.error(error);
            alert("Unable to update favorite");
        }
    };

    return (
        <div className="min-h-screen bg-[#f7faf7]">

            {/* Header */ }

            <header className="bg-white border-b border-gray-100">

                <div className="w-full px-4 sm:px-6 lg:px-8">

                    <button
                        onClick={ () => setLocation("/dashboard") }
                        className="
              flex
              items-center
              gap-2
              text-gray-600
              hover:text-primary
              transition
            "
                    >
                        <ArrowLeft className="w-5 h-5" />

                        Back to Dashboard
                    </button>


                    <div className="flex items-center gap-2">

                        <ChefHat className="w-6 h-6 text-primary" />

                        <span className="
              text-xl
              font-black
              text-gray-900
            ">
                            Meal<span className="text-primary">Mate</span>
                        </span>

                    </div>

                </div>

            </header>


            {/* Main */ }

            <main className="
        max-w-7xl
        mx-auto
        px-4
        sm:px-6
        lg:px-8
        py-10
      ">

                {/* Title */ }

                <section className="text-center mb-8">

                    <div className="
            inline-flex
            items-center
            gap-2
            px-4
            py-2
            rounded-full
            bg-green-50
            text-primary
            text-sm
            font-semibold
          ">
                        <Utensils className="w-4 h-4" />

                        MealMate Recipes
                    </div>

                    <h1 className="
            text-3xl
            md:text-4xl
            font-black
            text-gray-900
            mt-4
          ">
                        Discover Delicious Recipes
                    </h1>

                    <p className="
            text-gray-500
            mt-3
          ">
                        Find recipes that match your preferences.
                    </p>

                </section>


                {/* Search */ }

                <div className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          p-4
          mb-8
          flex
          flex-col
          md:flex-row
          gap-4
        ">

                    <div className="
            relative
            flex-1
          ">

                        <Search className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              w-5
              h-5
              text-gray-400
            " />

                        <input
                            type="text"
                            placeholder="Search recipes..."
                            value={ search }
                            onChange={ (e) => setSearch(e.target.value) }
                            className="
                w-full
                pl-12
                pr-4
                py-3
                rounded-xl
                border
                border-gray-200
                outline-none
                focus:border-primary
              "
                        />

                    </div>


                    {/* Category */ }

                    <select
                        value={ category }
                        onChange={ (e) => setCategory(e.target.value) }
                        className="
              px-4
              py-3
              rounded-xl
              border
              border-gray-200
              bg-white
              outline-none
              focus:border-primary
            "
                    >

                        { categories.map((item) => (
                            <option key={ item } value={ item }>
                                { item }
                            </option>
                        )) }

                    </select>

                </div>


                {/* Recipes */ }

                { loading ? (

                    <div className="
            text-center
            py-20
            text-gray-500
          ">
                        Loading recipes...
                    </div>

                ) : filteredRecipes.length === 0 ? (

                    <div className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-12
            text-center
          ">

                        <ChefHat className="
              w-12
              h-12
              mx-auto
              text-gray-300
            " />

                        <h2 className="
              text-xl
              font-bold
              text-gray-900
              mt-4
            ">
                            No recipes found
                        </h2>

                        <p className="
              text-gray-500
              mt-2
            ">
                            Try another search or category.
                        </p>

                    </div>

                ) : (

                    <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-3
            gap-6
          ">

                        { filteredRecipes.map((recipe) => (
                            <RecipeCard
                                key={ recipe._id }
                                recipe={ recipe }
                                onClick={ () =>
                                    setLocation(`/recipes/${recipe._id}`)
                                }
                                isFavorite={ favorites.includes(recipe._id) }
                                onFavorite={ () => toggleFavorite(recipe._id) }
                            />

                        )) }

                    </div>

                ) }

            </main>

        </div>
    );
}


/* =====================================================
   RECIPE CARD
===================================================== */

function RecipeCard({
    recipe,
    onClick,
    isFavorite,
    onFavorite,
}) {
    return (
        <div className="
      bg-white
      rounded-2xl
      border
      border-gray-100
      overflow-hidden
      shadow-sm
      hover:shadow-lg
      hover:-translate-y-1
      transition-all
      duration-300
    ">

            {/* Image */ }

            <div className="
        h-48
        bg-green-50
        flex
        items-center
        justify-center
      ">

                { recipe.image ? (

                    <img
                        src={ recipe.image }
                        alt={ recipe.name }
                        className="
              w-full
              h-full
              object-cover
            "
                    />

                ) : (

                    <ChefHat className="
            w-16
            h-16
            text-primary
          " />

                ) }

            </div>


            {/* Content */ }

            <div className="p-6">

                <div className="
          flex
          items-center
          justify-between
        ">

                    <span className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-primary
          ">
                        { recipe.category }
                    </span>


                    <button
                        onClick={ (e) => {
                            e.stopPropagation();
                            onFavorite();
                        } }
                        className="p-1"
                        title={ isFavorite ? "Remove from favorites" : "Add to favorites" }
                    >
                        <Heart
                            className={ `w-5 h-5 transition ${isFavorite
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-300 hover:text-red-400"
                                }` }
                        />
                    </button>

                </div>


                <h2 className="
          text-xl
          font-bold
          text-gray-900
          mt-3
        ">
                    { recipe.name }
                </h2>


                <p className="
          text-sm
          text-gray-500
          mt-2
          line-clamp-2
        ">
                    { recipe.description }
                </p>


                <div className="
          flex
          items-center
          gap-2
          text-sm
          text-gray-400
          mt-4
        ">

                    <Clock className="w-4 h-4" />

                    { recipe.prepTime || "Easy" }

                </div>


                <button
                    onClick={ onClick }
                    className="
            w-full
            mt-5
            py-3
            rounded-xl
            bg-primary
            text-white
            font-semibold
            hover:opacity-90
            transition
          "
                >
                    View Recipe
                </button>

            </div>

        </div>
    );
}
import {
  ChefHat,
  CalendarDays,
  Heart,
  TrendingUp,
  ShoppingBasket,
  Sparkles,
  ArrowRight,
  Clock,
  Flame,
  Beef,
  Leaf,
} from "lucide-react";

export default function UserSection() {
  return (
    <div className="space-y-8">

      {/* ================= WELCOME ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-green-50 border border-green-100 p-8 md:p-10">

        <div className="relative z-10 max-w-2xl">

          <p className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">
            Your MealMate Kitchen
          </p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            Eat better.
            <br />
            <span className="text-primary">
              Live healthier.
            </span>
          </h1>

          <p className="text-gray-600 mt-4 text-base md:text-lg max-w-xl">
            Plan your meals, discover delicious recipes and stay on track
            with your nutrition — all in one place.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">

            <button className="bg-primary text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition">
              <CalendarDays className="w-5 h-5" />
              Plan My Meals
            </button>

            <button className="bg-white text-gray-700 px-5 py-3 rounded-xl font-semibold border border-gray-200 flex items-center gap-2 hover:shadow-md transition">
              <ChefHat className="w-5 h-5 text-primary" />
              Find a Recipe
            </button>

          </div>

        </div>

        {/* Decorative element */}
        <div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/60" />
        <div className="absolute right-10 top-8 w-20 h-20 rounded-full bg-green-100/70" />

      </section>


      {/* ================= QUICK STATS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Calories */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Today's Calories
              </p>

              <h3 className="text-2xl font-black text-gray-900 mt-1">
                1,540
                <span className="text-sm font-normal text-gray-400">
                  {" "}/ 2,000 kcal
                </span>
              </h3>
            </div>

            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>

          </div>

          <div className="mt-5 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[77%]" />
          </div>

        </div>


        {/* Protein */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Protein
              </p>

              <h3 className="text-2xl font-black text-gray-900 mt-1">
                82g
                <span className="text-sm font-normal text-gray-400">
                  {" "}/ 120g
                </span>
              </h3>
            </div>

            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <Beef className="w-6 h-6 text-primary" />
            </div>

          </div>

          <div className="mt-5 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[68%]" />
          </div>

        </div>


        {/* Meals */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Meals Planned
              </p>

              <h3 className="text-2xl font-black text-gray-900 mt-1">
                3
                <span className="text-sm font-normal text-gray-400">
                  {" "}meals today
                </span>
              </h3>
            </div>

            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>

          </div>

          <p className="text-xs text-gray-400 mt-5">
            Breakfast • Lunch • Dinner
          </p>

        </div>

      </section>


      {/* ================= TODAY'S MEALS ================= */}
      <section>

        <div className="flex items-end justify-between mb-5">

          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide">
              Your plan
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
              Today's Meals
            </h2>

            <p className="text-gray-500 mt-1">
              Delicious meals planned for your day.
            </p>
          </div>

          <button className="hidden sm:flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all">
            View meal plan
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Breakfast */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

            <div className="h-36 bg-green-50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <ChefHat className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Breakfast
              </p>

              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Healthy Oat Bowl
              </h3>

              <div className="flex items-center gap-2 text-gray-400 text-sm mt-3">
                <Clock className="w-4 h-4" />
                8:00 AM
              </div>

            </div>

          </div>


          {/* Lunch */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

            <div className="h-36 bg-green-50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Lunch
              </p>

              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Veggie Rice Bowl
              </h3>

              <div className="flex items-center gap-2 text-gray-400 text-sm mt-3">
                <Clock className="w-4 h-4" />
                1:00 PM
              </div>

            </div>

          </div>


          {/* Dinner */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

            <div className="h-36 bg-green-50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <ShoppingBasket className="w-8 h-8 text-primary" />
              </div>
            </div>

            <div className="p-5">

              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Dinner
              </p>

              <h3 className="text-lg font-bold text-gray-900 mt-2">
                Protein Veggie Bowl
              </h3>

              <div className="flex items-center gap-2 text-gray-400 text-sm mt-3">
                <Clock className="w-4 h-4" />
                8:00 PM
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= AI ASSISTANT ================= */}
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">

        <div className="p-6 md:p-8">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="flex gap-4">

              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>

              <div>

                <p className="text-primary font-semibold text-sm uppercase tracking-wide">
                  Powered by AI
                </p>

                <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-1">
                  Your AI Kitchen Assistant
                </h2>

                <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl">
                  You have spinach and tomatoes available. Use them today
                  to create a healthy meal before they expire.
                </p>

              </div>

            </div>

            <button className="bg-primary text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition shrink-0">
              Get AI Recipe
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </section>


      {/* ================= FEATURE CARDS ================= */}
      <section>

        <div className="mb-5">

          <p className="text-primary font-semibold text-sm uppercase tracking-wide">
            Explore MealMate
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
            Everything you need
          </h2>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* Meal Planner */}
          <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-gray-900">
              Meal Planner
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Plan breakfast, lunch and dinner for your week.
            </p>

            <button className="text-primary font-semibold text-sm mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Plan meals
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>


          {/* AI Recipes */}
          <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-gray-900">
              AI Recipes
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Turn your available ingredients into delicious recipes.
            </p>

            <button className="text-primary font-semibold text-sm mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              Get recipe
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>


          {/* Grocery */}
          <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
              <ShoppingBasket className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-gray-900">
              Smart Grocery
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Manage your grocery list and avoid unnecessary spending.
            </p>

            <button className="text-primary font-semibold text-sm mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              View grocery
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>


          {/* Favorites */}
          <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">

            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
              <Heart className="w-6 h-6 text-primary" />
            </div>

            <h3 className="font-bold text-gray-900">
              Favorites
            </h3>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Quickly access your favorite meals and recipes.
            </p>

            <button className="text-primary font-semibold text-sm mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              View favorites
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}
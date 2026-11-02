import { Navbar } from '@/components/sections/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { AIFeaturesSection } from '@/components/sections/AIFeaturesSection';
import { AppPreviewSection } from '@/components/sections/AppPreviewSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/sections/Footer';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Search, ChefHat, Clock, Star, ArrowRight, Leaf, Flame } from 'lucide-react';
export default function Home() {
    return (<div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <RecipeDiscoverySection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AIFeaturesSection />
        <AppPreviewSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>);
}

function RecipeDiscoverySection() {
  const [, setLocation] = useLocation();
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("http://localhost:5000/api/recipes")
      .then((response) => response.json())
      .then((data) => { if (active) setRecipes(data.recipes || []); })
      .catch((error) => console.error("Home recipe discovery:", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const popularRecipes = [...recipes]
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0) || (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 4);
  const openRecipes = (query = "") => setLocation(query ? `/recipes?search=${encodeURIComponent(query)}` : "/recipes");
  const categories = [
    { label: "Breakfast", detail: "Start your day right", icon: "☀️" },
    { label: "Lunch", detail: "Fresh midday ideas", icon: "🥗" },
    { label: "Dinner", detail: "Make tonight delicious", icon: "🍲" },
    { label: "Vegetarian", detail: "Plant-forward meals", icon: "🌿" },
  ];
  const images = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=85",
  ];

  return (
    <section id="recipes" className="bg-[#fbfcf8] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-primary">MEALMATE RECIPE COLLECTION</p>
          <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">What do you want to cook?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-500">Discover easy meal ideas, explore recipes by category, and find something delicious for today.</p>
          <form onSubmit={(event) => { event.preventDefault(); openRecipes(search.trim()); }} className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-200/60">
            <Search className="ml-3 h-5 w-5 shrink-0 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipes or ingredients..." className="min-w-0 flex-1 border-0 bg-transparent px-2 py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400" />
            <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">Search</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Quick meals", "Paneer", "Chicken", "High protein", "Healthy"].map((tag) => (
              <button key={tag} onClick={() => openRecipes(tag)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary hover:text-primary">{tag}</button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">START BROWSING</p><h3 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">What are you in the mood for?</h3></div>
            <button onClick={() => openRecipes()} className="hidden items-center gap-2 text-sm font-bold text-primary hover:gap-3 sm:flex">All recipes <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {categories.map((item) => (
              <button key={item.label} onClick={() => openRecipes(item.label === "Vegetarian" ? "vegetarian" : item.label)} className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md sm:p-6">
                <span className="text-3xl">{item.icon}</span><h4 className="mt-4 font-extrabold text-gray-900 group-hover:text-primary">{item.label}</h4><p className="mt-1 text-xs text-gray-500">{item.detail}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">Explore <ArrowRight className="h-3 w-3" /></span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-600"><Flame className="h-4 w-4" /> POPULAR RIGHT NOW</p><h3 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">Recipes worth trying</h3></div>
            <button onClick={() => openRecipes()} className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3">View all <ArrowRight className="h-4 w-4" /></button>
          </div>
          {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl bg-gray-100" />)}</div> : popularRecipes.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularRecipes.map((recipe, index) => (
                <button key={recipe._id} onClick={() => setLocation(`/recipes/${recipe._id}`)} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative h-48 overflow-hidden bg-green-50"><img src={images[index % images.length]} alt={recipe.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase text-green-800">{recipe.category || "Recipe"}</span></div>
                  <div className="p-4"><h4 className="line-clamp-2 min-h-12 font-extrabold text-gray-900 group-hover:text-primary">{recipe.name}</h4><div className="mt-3 flex items-center justify-between text-xs text-gray-500"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{recipe.prepTime || "Cooking time varies"}</span><span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(recipe.averageRating || 0).toFixed(1)}</span></div></div>
                </button>
              ))}
            </div>
          ) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Recipes will appear here when they are available.</div>}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#173f2b] to-[#367c4e] p-7 text-white sm:flex-row sm:px-10">
          <div><p className="text-xs font-bold uppercase tracking-widest text-green-100">COOK WITH WHAT YOU HAVE</p><h3 className="mt-2 text-2xl font-black">Turn your ingredients into a great meal.</h3><p className="mt-2 text-sm text-green-50">Search recipes by the ingredients already in your kitchen.</p></div>
          <button onClick={() => openRecipes()} className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-green-900 transition hover:bg-green-50">Explore all recipes <ArrowRight className="ml-2 inline h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

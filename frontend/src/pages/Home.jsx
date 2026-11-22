import { Navbar } from '@/components/sections/Navbar';
import { HeroSection } from '@/components/sections/HeroSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { AIFeaturesSection } from '@/components/sections/AIFeaturesSection';
import { FeaturedFoodsSection } from '@/components/sections/FeaturedFoodsSection';
import { AppPreviewSection } from '@/components/sections/AppPreviewSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { Footer } from '@/components/sections/Footer';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Clock, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <RecipeDiscoverySection />
        <HowItWorksSection />
        <AIFeaturesSection />
        <FeaturedFoodsSection />
        <AppPreviewSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function RecipeDiscoverySection() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/recipes")
      .then((response) => response.json())
      .then((data) => { if (active) setRecipes(data.recipes || []); })
      .catch((error) => console.error("Home recipe discovery:", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Show the highest-rated recipes first; use likes to break rating ties.
  const popularRecipes = [...recipes]
    .sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0) || (Number(b.likesCount) || 0) - (Number(a.likesCount) || 0))
    .slice(0, 4);
  const openRecipes = () => {
    if (authLoading) return;
    const canBrowseAllRecipes = user && ["user", "admin"].includes(user.role);
    setLocation(canBrowseAllRecipes ? "/recipes" : "/login");
  };

  return (
    <section id="recipes" className="bg-[#faf9f6] py-8 sm:py-10">
      <div className="mx-auto w-full max-w-screen-2xl px-5 sm:px-8 lg:px-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">TOP RATED</p>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#24221f] sm:text-4xl">Top-rated recipes to try next</h2>
          </div>
          <button onClick={openRecipes} className="mb-1 hidden shrink-0 items-center gap-1 text-xs font-bold text-gray-700 hover:text-primary sm:inline-flex">VIEW ALL <ArrowRight className="h-3.5 w-3.5" /></button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-6">{[1,2,3,4,5,6,7,8].map((n) => <div key={n}><div className="aspect-[4/5] animate-pulse bg-gray-200" /><div className="mt-2 h-3 w-4/5 animate-pulse bg-gray-200" /></div>)}</div>
        ) : popularRecipes.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-6">
            {popularRecipes.map((recipe) => (
              <button key={recipe._id} onClick={() => setLocation(`/recipes/${recipe._id}`)} className="group min-w-0 text-left">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#eeeae3]">
                  <img src={recipe.imageUrl || recipe.image || recipe.imageURL || "/images/recipe-placeholder.svg"} alt={recipe.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/images/recipe-placeholder.svg"; }} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-[1.35] text-[#292722] group-hover:text-primary sm:text-sm">{recipe.name}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-gray-500">
                  <span>{recipe.prepTime || "Time varies"}</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(recipe.averageRating || 0).toFixed(1)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-500">Recipes will appear here when they are available.</div>
        )}
        <button onClick={openRecipes} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary sm:hidden">VIEW ALL RECIPES <ArrowRight className="h-3.5 w-3.5" /></button>
      </div>
    </section>
  );
}

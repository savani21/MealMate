import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";

export function TestimonialsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/stats")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load public MealMate statistics");
        return response.json();
      })
      .then((data) => { if (active) setStats(data); })
      .catch((error) => console.error("Public statistics:", error));
    return () => { active = false; };
  }, []);

  const average = Number(stats?.averageRecipeRating || 0);
  const reviewCount = Number(stats?.recipeRatingCount || 0);
  const ratingLabel = reviewCount
    ? `${average.toFixed(1)} out of 5 from ${reviewCount} recipe ratings`
    : "Be the first to rate a MealMate recipe";

  return (
    <section className="bg-gray-50 py-20 md:py-28" id="testimonials">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="text-4xl font-black text-gray-900 md:text-5xl">Real MealMate community activity</h2>
          <p className="mt-3 text-sm text-gray-500">Live figures from recipes and ratings submitted on MealMate.</p>
        </AnimatedSection>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <AnimatedSection>
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="text-4xl font-black text-gray-900">{stats ? Number(stats.recipes || 0).toLocaleString() : "—"}</p>
              <p className="mt-2 text-sm font-semibold text-gray-500">Recipes available</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="text-4xl font-black text-gray-900">{stats ? Number(stats.registeredUsers || 0).toLocaleString() : "—"}</p>
              <p className="mt-2 text-sm font-semibold text-gray-500">Registered members</p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <p className="text-4xl font-black text-gray-900">{reviewCount ? average.toFixed(1) : "—"}</p>
                <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
              </div>
              <p className="mt-2 text-sm font-semibold text-gray-500">Average recipe rating</p>
              <p className="mt-1 text-xs text-gray-400">{ratingLabel}</p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

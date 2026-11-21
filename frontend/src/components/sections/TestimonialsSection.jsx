import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";

export function TestimonialsSection() {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load community reviews");
        return response.json();
      })
      .then((data) => setReviews(Array.isArray(data.recentReviews) ? data.recentReviews : []))
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Community reviews:", error);
      })
      .finally(() => setLoaded(true));
    return () => controller.abort();
  }, []);

  return (
    <section className="bg-gray-50 py-20 md:py-28" id="testimonials">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="text-4xl font-black text-gray-900 md:text-5xl">What cooks are saying</h2>
          <p className="mt-3 text-sm text-gray-500">Recent ratings and feedback submitted by MealMate members.</p>
        </AnimatedSection>
        {reviews.length ? (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((review, index) => (
              <AnimatedSection key={`${review.recipe}-${review.reviewer}-${review.createdAt}-${index}`} delay={index * 0.1}>
                <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
                  <div className="mb-4 flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                    <span className="ml-2 text-xs font-semibold text-gray-500">{review.rating}/5</span>
                  </div>
                  <p className="flex-1 text-base italic leading-relaxed text-gray-700">“{review.feedback}”</p>
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <p className="font-bold text-gray-900">{review.reviewer}</p>
                    <p className="mt-1 text-xs text-gray-500">Reviewed {review.recipe}</p>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-gray-500">
            {loaded ? "No written reviews yet. Cook a recipe and share your feedback to appear here." : "Loading recent community reviews..."}
          </div>
        )}
      </div>
    </section>
  );
}

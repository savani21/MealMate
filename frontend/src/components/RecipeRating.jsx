import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const API = "http://localhost:5000";

export default function RecipeRating({ recipeId }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const fetchRatings = async () => {
    try {
      const response = await fetch(`${API}/api/recipe-reviews/${recipeId}`);
      const data = await response.json();
      if (response.ok) {
        setAverageRating(data.averageRating || 0);
        setRatingCount(data.ratingCount || 0);
        setReviews(data.reviews || []);
      }

      if (token) {
        const mineResponse = await fetch(`${API}/api/recipe-reviews/${recipeId}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mineData = await mineResponse.json();
        if (mineResponse.ok && mineData.review) {
          setRating(mineData.review.rating);
          setFeedback(mineData.review.feedback || "");
        }
      }
    } catch (error) {
      console.error("Load recipe ratings error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipeId) fetchRatings();
  }, [recipeId]);

  const submitRating = async () => {
    if (!token) {
      alert("Please log in to rate this recipe.");
      return;
    }

    if (!rating) {
      alert("Please select a star rating.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API}/api/recipe-reviews/${recipeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, feedback }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save rating.");
        return;
      }

      await fetchRatings();
      alert("Your rating and feedback have been saved.");
    } catch (error) {
      console.error("Save recipe rating error:", error);
      alert("Unable to save your rating.");
    } finally {
      setSaving(false);
    }
  };

  const displayedRating = hoveredRating || rating;

  return (
    <section className="mt-8 pt-7 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recipe Rating</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`w-5 h-5 ${value <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-800">
              {averageRating ? averageRating.toFixed(1) : "No rating"}
            </span>
            <span className="text-sm text-gray-500">
              ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-sm font-bold text-gray-800">Rate this recipe</p>
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 rounded-lg hover:bg-white transition"
              aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 transition ${value <= displayedRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
              />
            </button>
          ))}
          {rating > 0 && <span className="text-sm text-gray-500 ml-2">{rating}/5</span>}
        </div>

        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Share your feedback about this recipe..."
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
        />

        <div className="flex items-center justify-between gap-3 mt-2">
          <span className="text-xs text-gray-400">
            {token ? "Your rating is shared with the MealMate community." : "Log in to submit a rating."}
          </span>
          <button
            type="button"
            onClick={submitRating}
            disabled={saving || loading || !token}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : "Submit Rating"}
          </button>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-gray-900 mb-3">Community Feedback</h3>
          <div className="space-y-3">
            {reviews.slice(0, 8).map((review) => (
              <article key={review._id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    {review.user?.name || "MealMate User"}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`w-4 h-4 ${value <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                {review.feedback && (
                  <p className="text-sm text-gray-600 mt-2">{review.feedback}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const API = "http://localhost:5000";

export default function RecipeRating({ recipeId }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadMyRating = async () => {
      if (!recipeId) return;

      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API}/api/recipe-reviews/${recipeId}/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();

        if (response.ok && data.review) {
          setRating(data.review.rating);
          setFeedback(data.review.feedback || "");
        }
      } catch (error) {
        console.error("Load my recipe rating error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMyRating();
  }, [recipeId, token]);

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

      alert("Your rating and feedback have been saved.");
    } catch (error) {
      console.error("Save recipe rating error:", error);
      alert("Unable to save your rating.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 pt-7 border-t border-gray-100">
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-900">Rate this recipe</h2>
        <p className="text-sm text-gray-500 mt-1">
          Share your rating and feedback with MealMate.
        </p>

        <div className="flex items-center gap-1 mt-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              disabled={loading || saving || !token}
              className="p-1 rounded-lg hover:bg-white transition disabled:opacity-50"
              aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-7 h-7 ${
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-gray-500 ml-2">{rating}/5</span>
          )}
        </div>

        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Share your feedback about this recipe..."
          disabled={loading || saving || !token}
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary resize-none disabled:bg-gray-100"
        />

        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-xs text-gray-400">
            {token
              ? "You can update your rating anytime."
              : "Log in to submit a rating."}
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
    </section>
  );
}

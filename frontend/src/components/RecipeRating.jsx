import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

const API = "http://localhost:5000";

export default function RecipeRating({ recipeId }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

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
          setHasRated(true);
          setShowFeedback(Boolean(data.review.feedback));
        }
      } catch (error) {
        console.error("Load my recipe rating error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMyRating();
  }, [recipeId, token]);

  const submitRating = async (selectedRating) => {
    if (!token) {
      alert("Please log in to rate this recipe.");
      return;
    }

    try {
      setSaving(true);
      setRating(selectedRating);

      const response = await fetch(`${API}/api/recipe-reviews/${recipeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: selectedRating, feedback }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRating(0);
        alert(data.message || "Failed to save rating.");
        return;
      }

      setHasRated(true);
    } catch (error) {
      setRating(0);
      console.error("Save recipe rating error:", error);
      alert("Unable to save your rating.");
    } finally {
      setSaving(false);
    }
  };

  const submitFeedback = async () => {
    if (!token || !rating || !feedback.trim()) return;

    try {
      setSaving(true);

      const response = await fetch(`${API}/api/recipe-reviews/${recipeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, feedback: feedback.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save feedback.");
        return;
      }

      setHasRated(true);
      setShowFeedback(true);
    } catch (error) {
      console.error("Save recipe feedback error:", error);
      alert("Unable to save feedback.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 pt-7 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {hasRated ? "Thanks for your rating!" : "How was this recipe?"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {hasRated
              ? "Your feedback helps MealMate improve your recommendations."
              : "A quick rating helps us recommend recipes you’ll enjoy."}
          </p>
        </div>

        {!hasRated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submitRating(5)}
              disabled={loading || saving || !token}
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition disabled:opacity-50"
              aria-label="Like this recipe"
              title="Like"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => submitRating(1)}
              disabled={loading || saving || !token}
              className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50"
              aria-label="Dislike this recipe"
              title="Dislike"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-2 text-sm font-semibold text-green-700">
            {rating === 5 ? (
              <ThumbsUp className="w-4 h-4" />
            ) : (
              <ThumbsDown className="w-4 h-4" />
            )}
            {rating === 5 ? "You liked this recipe" : "You disliked this recipe"}
          </div>
        )}
      </div>

      {hasRated && (
        <div className="mt-4">
          {!showFeedback ? (
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Add a comment (optional)
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Tell us what you liked or disliked..."
                disabled={saving}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={saving || !feedback.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Feedback"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!token && (
        <p className="text-xs text-gray-400 mt-3">
          Log in to rate this recipe.
        </p>
      )}
    </section>
  );
}

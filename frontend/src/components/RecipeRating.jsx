import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

const API = "";

export default function RecipeRating({ recipeId, promptOpen = false, onPromptClose }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    if (promptOpen) setPromptVisible(true);
  }, [promptOpen]);

  const closePrompt = () => {
    setPromptVisible(false);
    onPromptClose?.();
  };

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
          API + "/api/recipe-reviews/" + recipeId + "/me",
          { headers: { Authorization: "Bearer " + token } }
        );

        const data = await response.json();

        if (response.ok && data.review) {
          setRating(data.review.rating);
          setFeedback(data.review.feedback || "");
          setHasRated(true);
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

      const response = await fetch(
        API + "/api/recipe-reviews/" + recipeId,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            rating,
            feedback: feedback.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to save rating.");
        return;
      }

      setRating(data.review?.rating || rating);
      setFeedback(data.review?.feedback || feedback.trim());
      setHasRated(true);
      closePrompt();
    } catch (error) {
      console.error("Save recipe rating error:", error);
      alert("Unable to save your rating.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {promptVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="recipe-rating-dialog-title">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button type="button" onClick={closePrompt} className="absolute right-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close rating popup">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            </div>
            <h2 id="recipe-rating-dialog-title" className="text-center text-xl font-black text-gray-900">
              {hasRated ? "Thanks for rating this recipe!" : "How was your cooking experience?"}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Your honest rating helps other MealMate users choose recipes.
            </p>
            {loading ? (
              <p className="mt-6 text-center text-sm text-gray-500">Checking your previous rating...</p>
            ) : hasRated ? (
              <>
                <div className="mt-6 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} className={"h-9 w-9 " + (value <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                  ))}
                </div>
                <p className="mt-3 text-center text-sm text-gray-600">You have already rated this recipe.</p>
                <button type="button" onClick={closePrompt} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">Done</button>
              </>
            ) : !token ? (
              <>
                <p className="mt-5 text-center text-sm text-gray-600">Please log in to submit a rating.</p>
                <button type="button" onClick={closePrompt} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white">Close</button>
              </>
            ) : (
              <>
                <div className="mt-6 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-label={value + " stars"} className="rounded-lg p-1">
                      <Star className={"h-9 w-9 " + (value <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
                    </button>
                  ))}
                </div>
                <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={1000} rows={3} placeholder="Share a quick tip or what you liked (optional)..." className="mt-5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                <button type="button" onClick={submitRating} disabled={saving || !rating} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {saving ? "Submitting..." : "Submit rating"}
                </button>
                <button type="button" onClick={closePrompt} className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50">Maybe later</button>
              </>
            )}
          </div>
        </div>
      )}
      <section className="mt-8 pt-7 border-t border-gray-100">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          {hasRated ? "Your rating" : "Rate this recipe"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {hasRated
            ? "Thanks! Your rating and feedback have been saved."
            : "Select a rating and optionally add a comment."}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => !hasRated && setRating(value)}
            disabled={loading || saving || hasRated || !token}
            className="p-1 disabled:cursor-default"
            aria-label={value + " star" + (value > 1 ? "s" : "")}
          >
            <Star
              className={
                "w-7 h-7 transition " +
                (value <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300")
              }
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-gray-600">
            {rating}/5
          </span>
        )}
      </div>

      {!hasRated && (
        <div className="mt-4 space-y-3">
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell us what you liked or disliked (optional)..."
            disabled={saving || !token}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {feedback.length}/1000
            </span>
            <button
              type="button"
              onClick={submitRating}
              disabled={saving || loading || !token || !rating}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Submit Rating"}
            </button>
          </div>
        </div>
      )}

      {hasRated && feedback && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-500 mb-1">Your comment</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback}</p>
        </div>
      )}

      {!token && (
        <p className="text-xs text-gray-400 mt-3">
          Log in to rate this recipe.
        </p>
      )}
      </section>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ShoppingBasket,
  Check,
  Sparkles,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";

const API = "http://localhost:5000";

export default function GroceryList() {
  const [, setLocation] = useLocation();
  const [groceryLists, setGroceryLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    fetchGroceryLists();
  }, []);

  const fetchGroceryLists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLocation("/login");
        return;
      }

      const response = await fetch(`${API}/api/user/grocery`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load grocery lists");
      setGroceryLists(data.groceryLists || []);
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateList = async (list) => {
    if (!list?.mealPlan?._id) return;
    try {
      setRegeneratingId(list._id);
      const response = await fetch(`${API}/api/user/grocery`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId: list.mealPlan._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to regenerate grocery list");
      setGroceryLists((previous) =>
        previous.map((current) => (current._id === list._id ? data.groceryList : current))
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to connect to server.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const toggleItem = async (list, item) => {
    const nextChecked = !item.checked;

    setGroceryLists((previous) =>
      previous.map((current) =>
        current._id !== list._id
          ? current
          : {
              ...current,
              items: current.items.map((currentItem) =>
                currentItem._id === item._id
                  ? { ...currentItem, checked: nextChecked }
                  : currentItem
              ),
            }
      )
    );

    try {
      const response = await fetch(
        `${API}/api/user/grocery/${list._id}/items/${item._id}`,
        {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ checked: nextChecked }),
        }
      );

      if (!response.ok) throw new Error("Failed to update item");
    } catch (error) {
      setGroceryLists((previous) =>
        previous.map((current) =>
          current._id !== list._id
            ? current
            : {
                ...current,
                items: current.items.map((currentItem) =>
                  currentItem._id === item._id
                    ? { ...currentItem, checked: item.checked }
                    : currentItem
                ),
              }
        )
      );
      console.error(error);
    }
  };

  const shopMissingItems = (list) => {
    const missing = list.items.filter((item) => !item.checked);
    if (!missing.length) {
      alert("All ingredients for this meal plan are already checked.");
      return;
    }
    setLocation(`/grocery-store?listId=${encodeURIComponent(list._id)}`);
  };

  const groupItems = (items) => {
    const mealOrder = { Breakfast: 0, Lunch: 1, Snack: 2, Dinner: 3 };
    const groups = new Map();

    for (const item of items) {
      const key = `${item.day || ""}|${item.mealType || ""}|${item.mealName || ""}`;
      if (!groups.has(key)) {
        groups.set(key, {
          day: item.day,
          mealType: item.mealType || "Meal",
          mealName: item.mealName || "Meal",
          items: [],
        });
      }
      groups.get(key).items.push(item);
    }

    return [...groups.values()].sort((a, b) => {
      if ((a.day || 0) !== (b.day || 0)) return (a.day || 0) - (b.day || 0);
      const orderA = mealOrder[a.mealType] ?? 99;
      const orderB = mealOrder[b.mealType] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.mealName).localeCompare(String(b.mealName));
    });
  };

  const totalMissing = useMemo(
    () => groceryLists.reduce(
      (total, list) => total + list.items.filter((item) => !item.checked).length,
      0
    ),
    [groceryLists]
  );

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-lg font-black text-gray-900">
                Meal<span className="text-primary">Mate</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-primary text-xs font-bold">
              <ShoppingBasket className="w-3.5 h-3.5" /> Smart Grocery List
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-3">
              My Grocery List
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Ingredients are linked directly to your generated meals.
            </p>
          </div>

          {!loading && groceryLists.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400">
                Total to buy
              </p>
              <p className="text-xl font-black text-primary">
                {totalMissing} <span className="text-xs font-semibold text-gray-500">items</span>
              </p>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12 text-sm text-gray-500">
            Loading your grocery lists...
          </div>
        )}

        {!loading && groceryLists.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <ShoppingBasket className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900">No grocery lists yet</h2>
            <p className="text-sm text-gray-500 mt-1">Generate one from your meal plan.</p>
            <button
              onClick={() => setLocation("/my-meal-plans")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold"
            >
              View My Meal Plans
            </button>
          </div>
        )}

        {!loading && groceryLists.length > 0 && (
          <div className="space-y-5">
            {groceryLists.map((list) => {
              const missingItems = list.items.filter((item) => !item.checked);
              const groups = groupItems(list.items);
              const pantryIngredients = String(list.mealPlan?.availableIngredients || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
              const recommendedIngredients = String(list.mealPlan?.recommendedIngredients || "")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

              return (
                <section
                  key={list._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-gray-900">
                            Meal Plan Grocery List
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-green-50 text-primary text-[11px] font-bold">
                            {missingItems.length} to buy
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Checked items stay attached to their original meal.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => regenerateList(list)}
                          disabled={regeneratingId === list._id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === list._id ? "animate-spin" : ""}`} />
                          {regeneratingId === list._id ? "Refreshing..." : "Refresh"}
                        </button>

                        {missingItems.length > 0 && (
                          <button
                            onClick={() => shopMissingItems(list)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Shop Missing
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                        <p className="text-[10px] uppercase tracking-wide font-bold text-gray-400">
                          Ingredients you added
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {pantryIngredients.length > 0 ? pantryIngredients.map((item) => (
                            <span
                              key={`pantry-${item}`}
                              className="px-2 py-1 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-700"
                            >
                              {item}
                            </span>
                          )) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>
                      </div>

                      {recommendedIngredients.length > 0 && (
                        <div className="rounded-xl bg-green-50/70 border border-green-100 px-3.5 py-3">
                          <p className="text-[10px] uppercase tracking-wide font-bold text-primary">
                            Recommended ingredients allowed
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {recommendedIngredients.map((item) => (
                              <span
                                key={`recommended-${item}`}
                                className="px-2 py-1 rounded-full bg-white border border-green-100 text-[11px] font-semibold text-gray-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {groups.length === 0 ? (
                    <div className="px-5 py-7 text-center">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-primary">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="mt-2 text-sm font-bold text-gray-800">
                        You already have everything required for this meal plan.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        No ingredients need to be purchased.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 md:p-5 space-y-3">
                      {groups.map((group) => (
                        <div
                          key={`${group.day}-${group.mealType}-${group.mealName}`}
                          className="rounded-xl border border-gray-100 overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-2.5">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                Day {group.day} · {group.mealType}
                              </p>
                              <h3 className="text-sm font-black text-gray-900 truncate mt-0.5">
                                {group.mealName}
                              </h3>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                              {group.items.filter((item) => !item.checked).length} to buy
                            </span>
                          </div>

                          <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {group.items.map((item) => (
                              <button
                                key={item._id}
                                onClick={() => toggleItem(list, item)}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition ${
                                  item.checked
                                    ? "border-green-100 bg-green-50/70"
                                    : "border-amber-100 bg-amber-50/30 hover:border-amber-300"
                                }`}
                              >
                                <div
                                  className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center border ${
                                    item.checked
                                      ? "bg-primary border-primary text-white"
                                      : "border-amber-300 bg-white"
                                  }`}
                                >
                                  {item.checked && <Check className="w-3.5 h-3.5" />}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-semibold capitalize truncate ${
                                      item.checked
                                        ? "text-gray-400 line-through"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {item.name}
                                  </p>
                                  {item.quantity && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      {item.quantity}
                                    </p>
                                  )}
                                </div>

                                {item.checked && (
                                  <span className="ml-auto text-[10px] font-bold text-primary">
                                    Checked
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  RefreshCw,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Utensils,
} from "lucide-react";

const API = "http://localhost:5000";

export default function GroceryList() {
  const [, setLocation] = useLocation();
  const [groceryLists, setGroceryLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState(null);

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

      const response = await fetch(`${API}/api/user/grocery`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load grocery lists");
        return;
      }

      setGroceryLists(data.groceryLists || []);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateList = async (list) => {
    if (!list?.mealPlan?._id) return;

    try {
      setRefreshingId(list._id);

      const response = await fetch(`${API}/api/user/grocery`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mealPlanId: list.mealPlan._id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to refresh grocery list");

      setGroceryLists((previous) =>
        previous.map((current) => (current._id === list._id ? data.groceryList : current))
      );
    } catch (error) {
      alert(error.message || "Unable to refresh grocery list");
    } finally {
      setRefreshingId(null);
    }
  };

  const toggleItem = async (list, item) => {
    const checked = !item.checked;

    setGroceryLists((previous) =>
      previous.map((current) =>
        current._id !== list._id
          ? current
          : {
              ...current,
              items: current.items.map((entry) =>
                entry._id === item._id ? { ...entry, checked } : entry
              ),
            }
      )
    );

    try {
      const response = await fetch(
        `${API}/api/user/grocery/${list._id}/items/${item._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ checked }),
        }
      );

      if (!response.ok) throw new Error("Unable to save item status");
    } catch (error) {
      setGroceryLists((previous) =>
        previous.map((current) =>
          current._id !== list._id
            ? current
            : {
                ...current,
                items: current.items.map((entry) =>
                  entry._id === item._id ? { ...entry, checked: item.checked } : entry
                ),
              }
        )
      );
      alert(error.message);
    }
  };

  const shopMissingItems = (list) => {
    const missing = list.items.filter((item) => !item.checked);

    if (!missing.length) {
      alert("All items in this grocery list are already checked.");
      return;
    }

    setLocation(`/grocery-store?listId=${encodeURIComponent(list._id)}`);
  };

  const groupByDay = (items) =>
    items.reduce((groups, item) => {
      const day = item.day || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(item);
      return groups;
    }, {});

  const groupByRecipe = (items) =>
    items.reduce((groups, item) => {
      const key = `${item.mealType || "Meal"}|${item.mealName || "Recipe"}`;

      if (!groups[key]) {
        groups[key] = {
          mealType: item.mealType || "Meal",
          mealName: item.mealName || "Recipe",
          items: [],
        };
      }

      groups[key].items.push(item);
      return groups;
    }, {});

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">
                Meal<span className="text-primary">Mate</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">
            <ShoppingBasket className="w-4 h-4" />
            Smart Grocery List
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">
            My Grocery List
          </h1>

          <p className="text-gray-500 mt-3">
            Your missing ingredients, organized recipe by recipe.
          </p>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading your grocery lists...
          </div>
        )}

        {!loading && groceryLists.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <ShoppingBasket className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No grocery lists yet</h2>
            <p className="text-gray-500 mt-2">
              Create a grocery list from your meal plan.
            </p>

            <button
              onClick={() => setLocation("/my-meal-plans")}
              className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90"
            >
              View My Meal Plans
            </button>
          </div>
        )}

        {!loading && groceryLists.length > 0 && (
          <div className="space-y-8">
            {groceryLists.map((list) => {
              const missingCount = list.items.filter((item) => !item.checked).length;
              const days = groupByDay(list.items);

              return (
                <section
                  key={list._id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">
                        Meal Plan Grocery List
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {missingCount} ingredients to buy · {list.items.length} total
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => regenerateList(list)}
                        disabled={refreshingId === list._id}
                        className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-green-200 hover:text-primary disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${refreshingId === list._id ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </button>

                      {missingCount > 0 && (
                        <button
                          onClick={() => shopMissingItems(list)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Shop Missing
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {Object.entries(days).map(([day, dayItems]) => {
                      const recipes = groupByRecipe(dayItems);

                      return (
                        <div key={day}>
                          <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-black text-gray-900">
                              Day {day}
                            </h3>
                          </div>

                          <div className="space-y-4">
                            {Object.values(recipes).map((recipe) => (
                              <div
                                key={`${day}-${recipe.mealType}-${recipe.mealName}`}
                                className="rounded-2xl border border-gray-100 overflow-hidden"
                              >
                                <div className="px-5 py-4 bg-gray-50 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                    <Utensils className="w-5 h-5 text-primary" />
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                                      {recipe.mealType}
                                    </p>
                                    <h4 className="font-black text-gray-900 mt-0.5">
                                      {recipe.mealName}
                                    </h4>
                                  </div>
                                </div>

                                <div className="divide-y divide-gray-100">
                                  {recipe.items.map((item) => (
                                    <button
                                      key={item._id}
                                      onClick={() => toggleItem(list, item)}
                                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition"
                                    >
                                      <div
                                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                                          item.checked
                                            ? "bg-primary border-primary text-white"
                                            : "border-gray-300 bg-white"
                                        }`}
                                      >
                                        {item.checked && <Check className="w-4 h-4" />}
                                      </div>

                                      <div className="flex-1">
                                        <p
                                          className={`font-semibold ${
                                            item.checked
                                              ? "line-through text-gray-400"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {item.name}
                                        </p>

                                        {item.quantity && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Needed: {item.quantity}
                                          </p>
                                        )}
                                      </div>

                                      <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                          item.checked
                                            ? "bg-green-50 text-green-600"
                                            : "bg-amber-50 text-amber-700"
                                        }`}
                                      >
                                        {item.checked ? "Have it" : "Need to buy"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

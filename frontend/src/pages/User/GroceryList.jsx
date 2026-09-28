import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ShoppingBasket,
  Check,
  Sparkles,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
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
      previous.map((l) =>
        l._id !== list._id
          ? l
          : { ...l, items: l.items.map((i) => (i._id === item._id ? { ...i, checked: nextChecked } : i)) }
      )
    );

    try {
      const response = await fetch(`${API}/api/user/grocery/${list._id}/items/${item._id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ checked: nextChecked }),
      });
      if (!response.ok) throw new Error("Failed to update item");
    } catch (error) {
      setGroceryLists((previous) =>
        previous.map((l) =>
          l._id !== list._id
            ? l
            : { ...l, items: l.items.map((i) => (i._id === item._id ? { ...i, checked: item.checked } : i)) }
        )
      );
    }
  };

  const shopMissingItems = (list) => {
    const missing = list.items.filter((item) => !item.checked);
    if (!missing.length) {
      alert("All missing ingredients are already checked.");
      return;
    }
    // The store reads the same grocery list, so meal/day context is preserved.
    setLocation(`/grocery-store?listId=${encodeURIComponent(list._id)}`);
  };

  const groupItems = (items) => {
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
      return `${a.mealType}${a.mealName}`.localeCompare(`${b.mealType}${b.mealName}`);
    });
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between">
            <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-primary transition">
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-black text-gray-900">Meal<span className="text-primary">Mate</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-primary text-sm font-semibold">
            <ShoppingBasket className="w-4 h-4" /> Smart Grocery List
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">My Grocery List</h1>
          <p className="text-gray-500 mt-3">Only ingredients you do not already have, organized by the meal that needs them.</p>
        </div>

        {loading && <div className="text-center py-16 text-gray-500">Loading your grocery lists...</div>}

        {!loading && groceryLists.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
            <ShoppingBasket className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No grocery lists yet</h2>
            <p className="text-gray-500 mt-2">Generate one from your meal plan.</p>
            <button onClick={() => setLocation("/my-meal-plans")} className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-bold">View My Meal Plans</button>
          </div>
        )}

        {!loading && groceryLists.length > 0 && (
          <div className="space-y-8">
            {groceryLists.map((list) => {
              const missingItems = list.items.filter((item) => !item.checked);
              const haveItems = list.items.filter((item) => item.checked);
              const groups = groupItems(list.items);

              return (
                <section key={list._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4 mb-7 flex-wrap">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Meal Plan Grocery List</h2>
                      <p className="text-sm text-gray-500 mt-1">{missingItems.length} ingredients still need to be purchased</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => regenerateList(list)} disabled={regeneratingId === list._id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-60">
                        <RefreshCw className={`w-4 h-4 ${regeneratingId === list._id ? "animate-spin" : ""}`} />
                        {regeneratingId === list._id ? "Refreshing..." : "Refresh List"}
                      </button>
                      {missingItems.length > 0 && (
                        <button onClick={() => shopMissingItems(list)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold">
                          <ShoppingCart className="w-4 h-4" /> Shop Missing Ingredients
                        </button>
                      )}
                    </div>
                  </div>

                  {missingItems.length === 0 ? (
                    <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center text-green-700 font-semibold">
                      You already have everything required for this meal plan.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {groups.map((group) => {
                        const missing = group.items.filter((item) => !item.checked);
                        if (!missing.length) return null;
                        return (
                          <div key={`${group.day}-${group.mealType}-${group.mealName}`} className="rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-5 py-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-primary">Day {group.day} · {group.mealType}</p>
                              <h3 className="font-black text-gray-900 mt-1">{group.mealName}</h3>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {missing.map((item) => (
                                <button key={item._id} onClick={() => toggleItem(list, item)} className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/40 text-left hover:border-amber-300 transition">
                                  <div className="w-7 h-7 rounded-lg border border-amber-300 shrink-0" />
                                  <div>
                                    <p className="font-semibold text-gray-900 capitalize">{item.name}</p>
                                    {item.quantity && <p className="text-xs text-gray-500 mt-1">{item.quantity}</p>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {haveItems.length > 0 && (
                    <div className="mt-7 pt-6 border-t border-gray-100">
                      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-3">Checked / Already Have ({haveItems.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {haveItems.map((item) => (
                          <button key={item._id} onClick={() => toggleItem(list, item)} className="flex items-center gap-4 p-4 rounded-xl border border-green-100 bg-green-50 text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary text-white shrink-0"><Check className="w-4 h-4" /></div>
                            <div>
                              <p className="font-semibold line-through text-gray-400 capitalize">{item.name}</p>
                              <p className="text-xs text-gray-400">{item.mealName} · Day {item.day}</p>
                            </div>
                          </button>
                        ))}
                      </div>
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

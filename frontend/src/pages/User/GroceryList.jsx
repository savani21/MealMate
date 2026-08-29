import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ShoppingBasket,
  Check,
  Sparkles,
} from "lucide-react";

export default function GroceryList() {
  const [, setLocation] = useLocation();

  const [groceryLists, setGroceryLists] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const response = await fetch(
        "http://localhost:5000/api/user/grocery",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const toggleItem = (listIndex, itemIndex) => {
    setGroceryLists((previous) =>
      previous.map((list, i) => {
        if (i !== listIndex) return list;

        return {
          ...list,
          items: list.items.map((item, j) =>
            j === itemIndex
              ? { ...item, checked: !item.checked }
              : item
          ),
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f7faf7]">

      {/* Header */}

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


      {/* Main */}

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
            Keep track of the items you need for your meal plans.
          </p>

        </div>


        {/* Loading */}

        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading your grocery lists...
          </div>
        )}


        {/* Empty */}

        {!loading && groceryLists.length === 0 && (

          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">

            <ShoppingBasket className="w-12 h-12 text-primary mx-auto mb-4" />

            <h2 className="text-xl font-bold text-gray-900">
              No grocery lists yet
            </h2>

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


        {/* Grocery Lists */}

        {!loading && groceryLists.length > 0 && (

          <div className="space-y-8">

            {groceryLists.map((list, listIndex) => (

              <section
                key={list._id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8"
              >

                <div className="flex items-center gap-4 mb-6">

                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">

                    <ShoppingBasket className="w-6 h-6 text-primary" />

                  </div>

                  <div>

                    <h2 className="text-xl font-black text-gray-900">
                      Grocery List
                    </h2>

                    <p className="text-sm text-gray-500">
                      {list.items.length} items
                    </p>

                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {list.items.map((item, itemIndex) => (

                    <button
                      key={itemIndex}
                      onClick={() =>
                        toggleItem(listIndex, itemIndex)
                      }
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition ${
                        item.checked
                          ? "bg-green-50 border-green-100"
                          : "bg-white border-gray-100 hover:border-green-200"
                      }`}
                    >

                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                          item.checked
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300"
                        }`}
                      >

                        {item.checked && (
                          <Check className="w-4 h-4" />
                        )}

                      </div>


                      <div>

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
                            {item.quantity}
                          </p>
                        )}

                      </div>

                    </button>

                  ))}

                </div>

              </section>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}
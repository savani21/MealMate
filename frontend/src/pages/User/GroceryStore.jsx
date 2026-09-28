import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

const API = "http://localhost:5000";

export default function GroceryStore() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const listId = params.get("listId");
  const requestedIngredientsFromUrl = (params.get("ingredients") || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const [requestedItems, setRequestedItems] = useState([]);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLocation("/login");
      return;
    }

    loadCart();

    if (listId) {
      loadRequestedGroceryList();
    } else {
      loadStore(requestedIngredientsFromUrl);
    }
  }, [listId]);

  const loadRequestedGroceryList = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/api/user/grocery`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load grocery list");
      }

      const list = (data.groceryLists || []).find(
        (item) => item._id === listId
      );

      if (!list) {
        throw new Error("Grocery list not found");
      }

      const missingItems = (list.items || []).filter(
        (item) => !item.checked
      );

      setRequestedItems(missingItems);

      const ingredientNames = [
        ...new Set(
          missingItems
            .map((item) => String(item.name || "").trim().toLowerCase())
            .filter(Boolean)
        ),
      ];

      // Pass the freshly loaded ingredient names directly.
      // Do not wait for React state to update before searching the store.
      await loadStore(ingredientNames);
    } catch (error) {
      console.error("Grocery context loading error:", error);
      setLoading(false);
      alert(error.message || "Unable to load grocery list");
    }
  };

  const requestedIngredients = requestedItems.length
    ? [
        ...new Set(
          requestedItems
            .map((item) => String(item.name || "").trim().toLowerCase())
            .filter(Boolean)
        ),
      ]
    : requestedIngredientsFromUrl;

  const matchingProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      return requestedIngredients.some((ingredient) => {
        const name = String(ingredient || "").toLowerCase();
        return productName.includes(name) || name.includes(productName);
      });
    });
  }, [products, requestedIngredients]);

  const addAllMissing = async () => {
    for (const product of matchingProducts) {
      await addToCart(product._id);
    }
  };

  const loadStore = async (ingredientNames = []) => {
    try {
      const names = [
        ...new Set(
          (ingredientNames || [])
            .map((item) => String(item || "").trim().toLowerCase())
            .filter(Boolean)
        ),
      ];

      const response = await fetch(
        `${API}/api/store/products${names.length ? `?search=${encodeURIComponent(names.join(","))}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load store products");
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error("Store loading error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const response = await fetch(`${API}/api/store/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCart(data.cart || { items: [] });
    } catch (error) {
      console.error("Cart loading error:", error);
    }
  };

  const addToCart = async (productId) => {
    const response = await fetch(`${API}/api/store/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    if (response.ok) setCart(data.cart);
    else alert(data.message || "Unable to add item");
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);

    const response = await fetch(`${API}/api/store/cart/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (response.ok) setCart(data.cart);
  };

  const removeFromCart = async (productId) => {
    const response = await fetch(`${API}/api/store/cart/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) setCart(data.cart);
  };

  const visibleProducts = useMemo(() => {
    const value = searchText.trim().toLowerCase();
    if (!value) return products;
    return products.filter((product) =>
      `${product.name} ${product.category}`.toLowerCase().includes(value)
    );
  }, [products, searchText]);

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <button
            onClick={() => setLocation("/user/grocery")}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Grocery List
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {cartCount > 0 && (
              <span className="min-w-6 h-6 px-1 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {requestedItems.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white border border-green-100 p-5">
            <div className="mb-4">
              <p className="font-bold text-gray-900">Ingredients you need to buy</p>
              <p className="text-sm text-gray-500 mt-1">Grouped by the meal that needs each ingredient.</p>
            </div>
            <div className="space-y-3">
              {Object.values(requestedItems.reduce((groups, item) => {
                const key = `${item.day || ""}|${item.mealType || ""}|${item.mealName || ""}`;
                if (!groups[key]) groups[key] = { day: item.day, mealType: item.mealType, mealName: item.mealName, items: [] };
                groups[key].items.push(item);
                return groups;
              }, {})).map((group) => (
                <div key={`${group.day}-${group.mealType}-${group.mealName}`} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Day {group.day} · {group.mealType}</p>
                    <p className="font-bold text-gray-900 mt-1">{group.mealName}</p>
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={item._id} className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold">
                        {item.name}{item.quantity ? ` · ${item.quantity}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <p className="text-primary font-semibold text-sm">MealMate Grocery Store</p>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">
            Buy what your meal plan needs
          </h1>
          <p className="text-gray-500 mt-2">
            Purchase ingredients you do not currently have.
          </p>
        </div>

        {requestedIngredients.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white border border-green-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-gray-900">Missing ingredients from your meal plan</p>
                <p className="text-sm text-gray-500 mt-1">Matching products are shown first. Add only what you still need.</p>
              </div>
              {matchingProducts.length > 0 && (
                <button
                  onClick={addAllMissing}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add All Missing ({matchingProducts.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {requestedIngredients.map((ingredient) => {
                const available = matchingProducts.some((product) => {
                  const productName = String(product.name || "").toLowerCase();
                  return productName.includes(ingredient) || ingredient.includes(productName);
                });
                return (
                  <span
                    key={ingredient}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${available ? "bg-green-50 text-primary" : "bg-amber-50 text-amber-700"}`}
                  >
                    {ingredient}{!available ? " (Not In Store)" : ""}
                  </span>
                );
              })}
            </div>

            {requestedIngredients.some((ingredient) =>
              !matchingProducts.some((product) => {
                const productName = String(product.name || "").toLowerCase();
                return productName.includes(ingredient) || ingredient.includes(productName);
              })
            ) && (
              <p className="text-xs text-amber-700 mt-3">
                Some requested ingredients are not in the catalog. Use the search below to look for an alternative.
              </p>
            )}
          </div>
        )}

        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search ingredients..."
          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-primary mb-8"
        />

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading store...</div>
        ) : visibleProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            No matching ingredients found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl border border-green-100 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-primary font-semibold uppercase">{product.category}</p>
                  {matchingProducts.some((item) => item._id === product._id) && (
                    <span className="px-2 py-1 rounded-full bg-green-50 text-primary text-xs font-semibold">Needed</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-2">{product.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{product.unit}</p>
                <p className="text-xl font-black text-gray-900 mt-4">₹{product.price}</p>
                <button
                  onClick={() => addToCart(product._id)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => setCartOpen(false)}>
          <aside className="w-full max-w-md bg-white h-full p-6 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-500">Close</button>
            </div>

            {cart.items?.length === 0 ? (
              <p className="text-gray-500 py-10 text-center">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">₹{item.product.price} / {item.product.unit}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.product._id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold">₹{item.product.price * item.quantity}</p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-5 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="text-2xl font-black text-gray-900">₹{cartTotal}</span>
                </div>

                <button
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold"
                  onClick={() => alert("Checkout can be connected when the payment/order module is added.")}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

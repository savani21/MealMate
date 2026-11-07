import AppNavbar from "@/components/AppNavbar";
import PageHeroBanner from "@/components/PageHeroBanner";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ShoppingBasket,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Receipt,
  X,
  Printer,
  Clock,
  History,
} from "lucide-react";

const API = "http://localhost:5000";

function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  const masked = "*".repeat(Math.max(local.length - 2, 3));
  return `${visible}${masked}@${domain}`;
}

function formatDateTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function GroceryStore() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const listId = params.get("listId");
  let requestedIngredientsFromUrl = [];
  try {
    const structured = JSON.parse(params.get("ingredientsJson") || "null");
    if (Array.isArray(structured)) requestedIngredientsFromUrl = structured.map((item) => String(item || "").trim()).filter(Boolean);
  } catch { requestedIngredientsFromUrl = []; }
  // Backward compatibility for older links that used comma-separated values.
  if (!requestedIngredientsFromUrl.length) {
    requestedIngredientsFromUrl = (params.get("ingredients") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  const recipeNameFromUrl = params.get("recipeName") || "Selected recipe";
  let allRecipeIngredientsFromUrl = [];
  try { const parsed = JSON.parse(params.get("allIngredients") || "[]"); if (Array.isArray(parsed)) allRecipeIngredientsFromUrl = parsed.filter((item) => item && item.name); } catch { allRecipeIngredientsFromUrl = []; }

  const [requestedItems, setRequestedItems] = useState([]);
  const [neededItemsOpen, setNeededItemsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [lastAddedProduct, setLastAddedProduct] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (!token) {
      setLocation("/login");
      return;
    }
    loadCart();
    if (listId) loadRequestedGroceryList();
    else loadStore(requestedIngredientsFromUrl);
  }, [listId]);

  const loadRequestedGroceryList = async () => {
    try {
      const response = await fetch(`${API}/api/user/grocery`, { headers: authHeaders() });
      const data = await response.json();
      if (response.ok) {
        const list = (data.groceryLists || []).find((item) => item._id === listId);
        const missingItems = (list?.items || []).filter((item) => !item.checked);
        setRequestedItems(missingItems);
        await loadStore([...new Set(missingItems.map((item) => String(item.name || "").trim().toLowerCase()).filter(Boolean))]);
      }
    } catch (error) {
      console.error("Grocery context loading error:", error);
    }
  };

  const loadStore = async (requested = []) => {
    try {
      const response = await fetch(`${API}/api/store/products`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) setProducts(data.products || []);
    } catch (error) {
      console.error("Store loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const response = await fetch(`${API}/api/store/cart`, {
        headers: authHeaders(),
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
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await response.json();
    if (response.ok) {
      setCart(data.cart);
      const added = data.cart?.items?.find(
        (item) => item.product?._id === productId
      );
      setLastAddedProduct(added?.product?.name || "Item");
      setCartNotice("Added to cart");
      window.clearTimeout(window.__mealMateCartNoticeTimer);
      window.__mealMateCartNoticeTimer = window.setTimeout(
        () => setCartNotice(""),
        2200
      );
    } else {
      alert(data.message || "Unable to add item");
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);

    const response = await fetch(`${API}/api/store/cart/${productId}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (response.ok) setCart(data.cart);
  };

  const removeFromCart = async (productId) => {
    const response = await fetch(`${API}/api/store/cart/${productId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (response.ok) setCart(data.cart);
  };

  const placeOrder = async () => {
    if (!cart.items?.length) return;

    try {
      setPlacingOrder(true);

      const response = await fetch(`${API}/api/store/checkout`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to place order");
        return;
      }

      setCart({ items: [] });
      setCartOpen(false);
      // Refresh the selected meal-plan list after checkout so purchased
      // ingredients disappear immediately instead of being offered again.
      if (listId) await loadRequestedGroceryList();
      setReceipt({ order: data.order, user: data.user });
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const openOrders = async () => {
    setOrdersOpen(true);
    setOrdersLoading(true);

    try {
      const response = await fetch(`${API}/api/store/orders`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openReceiptForOrder = async (orderId) => {
    try {
      const response = await fetch(`${API}/api/store/orders/${orderId}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setOrdersOpen(false);
        setReceipt({ order: data.order, user: data.user });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const requestedIngredients = useMemo(() => {
    if (requestedItems.length) {
      return [...new Set(requestedItems.map((item) => item.name.toLowerCase()))];
    }
    return requestedIngredientsFromUrl;
  }, [requestedItems, requestedIngredientsFromUrl.join(",")]);

  const requestedGroups = useMemo(() => {
    const groups = new Map();
    requestedItems.forEach((item) => {
      const key = `${item.day || ""}|${item.mealType || ""}|${item.mealName || ""}`;
      if (!groups.has(key)) {
        groups.set(key, { day: item.day, mealType: item.mealType, mealName: item.mealName, items: [] });
      }
      groups.get(key).items.push(item);
    });
    return [...groups.values()].sort((a, b) => (a.day || 0) - (b.day || 0));
  }, [requestedItems]);

  const visibleProducts = useMemo(() => {
    const value = searchText.trim().toLowerCase();
    const filtered = value
      ? products.filter((product) =>
          `${product.name} ${product.category}`.toLowerCase().includes(value)
        )
      : products;

    // Put products that directly satisfy a missing ingredient first.
    return [...filtered].sort((a, b) => {
      const aMatch = requestedIngredients.some((ingredient) =>
        a.name.toLowerCase().includes(ingredient) || ingredient.includes(a.name.toLowerCase())
      );
      const bMatch = requestedIngredients.some((ingredient) =>
        b.name.toLowerCase().includes(ingredient) || ingredient.includes(b.name.toLowerCase())
      );
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchText, requestedIngredients.join(",")]);

  const normalizeSearchIngredient = (value) => {
    const cleaned = String(value || "")
      .toLowerCase()
      .replace(/^as\s+needed\s*[:,-]?\s*/i, "")
      .replace(/^\s*\d+(?:\s*\/\s*\d+)?\s*/, "")
      .replace(/\b(?:cups?|tbsp|tblspoons?|tablespoons?|tsp|teaspoons?|kg|g|gm|gms|grm|grms|grams?|ml|litres?|liters?|pieces?|pcs?|cloves?|slices?)\b/gi, " ")
      .replace(/\b(?:large|medium|small|chopped|diced|minced|sliced|grated|finely|roughly|cooked|boiled|fresh|warm|whole|to taste)\b/gi, " ")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/ies$/, "y")
      .replace(/s$/, "");
    const aliases = {
      "whole milk": "milk",
      "warm milk": "milk",
      "full cream milk": "milk",
      "toned milk": "milk",
      "basmati rice": "rice",
      "long grain rice": "rice",
      "atta": "wheat flour",
      "whole wheat flour": "wheat flour",
      "wheat atta": "wheat flour",
      "green chilli": "green chili",
      "sunflower oil": "oil",
      "vegetable oil": "oil"
    };
    return aliases[cleaned] || cleaned;
  };

  const productMatchesIngredient = (product, ingredient) => {
    const productName = normalizeSearchIngredient(product?.name);
    const ingredientName = normalizeSearchIngredient(ingredient);
    if (!productName || !ingredientName) return false;
    if (productName === ingredientName || productName.includes(ingredientName) || ingredientName.includes(productName)) return true;
    const ignored = new Set(["and", "or", "whole", "white", "fresh"]);
    const productTokens = productName.split(" ").filter((token) => token.length > 2 && !ignored.has(token));
    const ingredientTokens = ingredientName.split(" ").filter((token) => token.length > 2 && !ignored.has(token));
    return ingredientTokens.some((token) => productTokens.includes(token)) &&
      ingredientTokens.filter((token) => productTokens.includes(token)).length >= Math.min(1, ingredientTokens.length);
  };

  const isRequestedProduct = (product) =>
    requestedIngredients.some((ingredient) => productMatchesIngredient(product, ingredient));

  const isProductInCart = (product) =>
    (cart.items || []).some((item) =>
      String(item.product?._id || item.product || item.productId || "") === String(product._id)
    );

  // Only show products that are still missing from the cart.
  const matchedRequestedProducts = useMemo(
    () => products.filter((product) => isRequestedProduct(product) && !isProductInCart(product)),
    [products, requestedIngredients.join(","), cart.items]
  );

  const unmatchedRequestedIngredients = requestedIngredients.filter((ingredient) => {
    const normalized = normalizeSearchIngredient(ingredient);
    return normalized && !products.some((product) => productMatchesIngredient(product, ingredient));
  });

  const [addingRequested, setAddingRequested] = useState(false);
  const [requestedAddMessage, setRequestedAddMessage] = useState("");

  const addAllRequested = async () => {
    const productsToAdd = matchedRequestedProducts;
    if (!productsToAdd.length || addingRequested) return;
    setAddingRequested(true);
    setRequestedAddMessage("");
    const failed = [];
    for (const product of productsToAdd) {
      try {
        const response = await fetch(`${API}/api/store/cart`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id, quantity: 1 }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not add item");
        if (data.cart) setCart(data.cart);
      } catch (error) {
        failed.push(product.name);
      }
    }
    await loadCart();
    setRequestedAddMessage(failed.length
      ? `Added available items. Could not add: ${failed.join(", ")}.`
      : `Successfully added ${productsToAdd.length} missing item(s) to your cart.`);
    setAddingRequested(false);
    setCartOpen(true);
  };

  const autoAddFromRecipe = new URLSearchParams(search).get("autoAdd") === "1";
  const [autoAddHandled, setAutoAddHandled] = useState(false);

  useEffect(() => {
    if (!autoAddFromRecipe || autoAddHandled || loading || !products.length) return;
    setAutoAddHandled(true);
    (async () => {
      try {
        const cartResponse = await fetch(`${API}/api/store/cart`, { headers: authHeaders() });
        const cartData = await cartResponse.json();
        const existingIds = new Set((cartData.cart?.items || []).map((item) => String(item.product?._id || item.product || "")));
        const requested = requestedIngredientsFromUrl;
        const matches = products.filter((product) =>
          requested.some((ingredient) => productMatchesIngredient(product, ingredient)) &&
          !existingIds.has(String(product._id))
        );
        const failures = [];
        for (const product of matches) {
          const response = await fetch(`${API}/api/store/cart`, {
            method: "POST",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product._id, quantity: 1 }),
          });
          const data = await response.json();
          if (!response.ok) failures.push(product.name);
          else if (data.cart) setCart(data.cart);
        }
        await loadCart();
        setCartOpen(true);
        setRequestedAddMessage(failures.length
          ? `Some ingredients could not be added: ${failures.join(", ")}. Please add them manually.`
          : matches.length
            ? `Added ${matches.length} matching ingredient(s) to your cart.`
            : "No matching store products were found, or all matching items are already in your cart.");
      } catch (error) {
        console.error("Recipe grocery auto-add error:", error);
        setRequestedAddMessage("Could not automatically add items. Please add them from the store.");
      }
    })();
  }, [autoAddFromRecipe, autoAddHandled, loading, products]);

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <AppNavbar>
        <button onClick={openOrders} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          <History className="h-5 w-5" /><span>My Orders</span>
        </button>
        <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">
          <ShoppingCart className="h-5 w-5" />Cart
          {cartCount > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">{cartCount}</span>}
        </button>
      </AppNavbar>
      <PageHeroBanner title="Grocery Store" description="Find and purchase the ingredients your meal plan needs." eyebrow="GROCERY MARKET" icon={ShoppingBasket} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {(allRecipeIngredientsFromUrl.length > 0 || requestedIngredients.length > 0) && (
          <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-primary">
                <ShoppingBasket className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">Recipe items needed</p>
                <p className="text-sm text-gray-500">
                  {recipeNameFromUrl !== "Selected recipe" ? recipeNameFromUrl : "Review ingredients from your meal plan"}
                  {" · "}{allRecipeIngredientsFromUrl.length || requestedIngredients.length} ingredients
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNeededItemsOpen(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <ShoppingBasket className="h-4 w-4" />
              View Items Needed
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {allRecipeIngredientsFromUrl.length || requestedIngredients.length}
              </span>
            </button>
          </section>
        )}

        {neededItemsOpen && (
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-3 sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setNeededItemsOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="needed-items-title"
              className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Grocery checklist</p>
                  <h2 id="needed-items-title" className="mt-1 text-xl font-black text-gray-900">Items Needed</h2>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    {recipeNameFromUrl !== "Selected recipe" ? recipeNameFromUrl : "Ingredients required by your meal plan"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNeededItemsOpen(false)}
                  aria-label="Close items needed"
                  className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 px-5 py-3 text-center sm:px-6">
                <div className="rounded-xl bg-white p-2">
                  <p className="text-lg font-black text-gray-900">{allRecipeIngredientsFromUrl.length || requestedIngredients.length}</p>
                  <p className="text-[11px] font-semibold text-gray-500">Total ingredients</p>
                </div>
                <div className="rounded-xl bg-white p-2">
                  <p className="text-lg font-black text-amber-600">{requestedIngredients.length}</p>
                  <p className="text-[11px] font-semibold text-gray-500">To purchase</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                {requestedGroups.length > 0 ? requestedGroups.map((group) => (
                  <section key={`${group.day}-${group.mealType}-${group.mealName}`} className="overflow-hidden rounded-2xl border border-gray-100">
                    <div className="bg-gray-50 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">Day {group.day} · {group.mealType}</p>
                      <p className="mt-0.5 font-bold text-gray-900">{group.mealName}</p>
                    </div>
                    <div className="space-y-2 p-3">
                      {group.items.map((item) => {
                        const matched = products.some((product) => productMatchesIngredient(product, item.name));
                        return (
                          <div key={item._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                            <span className="min-w-0 text-sm font-medium text-gray-800">{item.name}</span>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${matched ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                              {matched ? "Need to buy" : "Not in store"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )) : allRecipeIngredientsFromUrl.length > 0 ? (
                  <section className="space-y-2">
                    {allRecipeIngredientsFromUrl.map((item, index) => {
                      const available = item.status === "available";
                      const storeMatch = products.some((product) => productMatchesIngredient(product, item.name));
                      const statusLabel = available ? "In pantry" : storeMatch ? "Need to buy" : "Not in store";
                      return (
                        <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-3">
                          <span className="min-w-0 text-sm font-medium text-gray-800">{item.name}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${available ? "bg-green-50 text-green-700" : storeMatch ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })}
                  </section>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {requestedIngredients.map((ingredient) => (
                      <span key={ingredient} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold capitalize text-amber-700">{ingredient}</span>
                    ))}
                  </div>
                )}

                {unmatchedRequestedIngredients.length > 0 && (
                  <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                    These ingredients are not available in the store catalog: {unmatchedRequestedIngredients.join(", ")}. You can search for alternatives on the store page.
                  </p>
                )}
                {requestedAddMessage && <p role="status" className="text-sm font-semibold text-primary">{requestedAddMessage}</p>}
              </div>

              <footer className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
                <button
                  type="button"
                  onClick={() => setNeededItemsOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
                {matchedRequestedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={addAllRequested}
                    disabled={addingRequested}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {addingRequested ? "Adding..." : `Add All Missing (${matchedRequestedProducts.length})`}
                  </button>
                )}
              </footer>
            </section>
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
              <div
                key={product._id}
                className={`bg-white rounded-2xl border p-5 transition ${
                  isRequestedProduct(product)
                    ? "border-primary/30 ring-1 ring-primary/10"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-primary font-semibold uppercase">{product.category}</p>
                  {isProductInCart(product) ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      In Cart
                    </span>
                  ) : isRequestedProduct(product) ? (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-50 text-primary">
                      Needed
                    </span>
                  ) : null}
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

      {/* ================= CART DRAWER ================= */}
      {cartCount > 0 && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(380px,calc(100vw-2rem))]">
          {cartNotice && (
            <div className="mb-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
              ✓ {lastAddedProduct} {cartNotice}
            </div>
          )}

          <div className="rounded-2xl bg-white border border-gray-200 shadow-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  Your cart
                </p>
                <p className="text-lg font-black text-gray-900">
                  {cartCount} {cartCount === 1 ? "item" : "items"} · ₹{cartTotal}
                </p>
              </div>

              <button
                onClick={() => setCartOpen(true)}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[9999] isolate bg-black/40 flex justify-end" onClick={() => setCartOpen(false)}>
          <aside className="relative z-[10000] w-full max-w-md !bg-white h-full p-6 overflow-y-auto shadow-2xl" onClick={(event) => event.stopPropagation()}>
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
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
                  disabled={placingOrder}
                  onClick={placeOrder}
                >
                  {placingOrder ? "Placing Order..." : "Proceed to Checkout"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ================= ORDER HISTORY DRAWER ================= */}
      {ordersOpen && (
        <div className="fixed inset-0 z-[9999] isolate bg-black/40 flex justify-end" onClick={() => setOrdersOpen(false)}>
          <aside className="relative z-[10000] w-full max-w-md !bg-white h-full p-6 overflow-y-auto shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">My Orders</h2>
              <button onClick={() => setOrdersOpen(false)} className="text-gray-500">Close</button>
            </div>

            {ordersLoading ? (
              <p className="text-gray-500 py-10 text-center">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-gray-500 py-10 text-center">You haven't placed any orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order._id}
                    onClick={() => openReceiptForOrder(order._id)}
                    className="w-full text-left border border-gray-100 rounded-2xl p-4 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900">{order.orderId}</p>
                      <p className="font-bold text-primary">₹{order.totalAmount}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.createdAt)}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className={`text-[11px] font-bold rounded-full px-2 py-1 ${order.status === "delivered" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{order.status === "delivered" ? "Delivered · Added to pantry" : "On the way · Pantry pending"}</span>
                      <span className="text-[11px] text-gray-500">ETA {formatDateTime(order.deliveryTime)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ================= RECEIPT MODAL ================= */}
      {receipt && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" id="receipt-print-area">
            <div className="bg-primary text-white p-6 text-center">
              <Receipt className="w-8 h-8 mx-auto mb-2" />
              <h2 className="text-xl font-black">{receipt.order.status === "delivered" ? "Delivered to Pantry!" : "Order Placed!"}</h2>
              <p className="text-white/80 text-sm mt-1">{receipt.order.status === "delivered" ? "Your ordered ingredients have been added to your pantry." : "Your groceries will be added to your pantry after delivery."}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-b border-dashed border-gray-200 pb-4 space-y-1.5 text-sm">
                <Row label="Order ID" value={receipt.order.orderId} />
                <Row label="Date & Time" value={formatDateTime(receipt.order.createdAt)} />
                <Row label="Name" value={receipt.user?.name} />
                <Row label="Email" value={maskEmail(receipt.user?.email)} />
                <Row
                  label="Delivery Time"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(receipt.order.deliveryTime)}
                    </span>
                  }
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {receipt.order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 flex items-center justify-between">
                <span className="font-bold text-gray-700">Total Paid</span>
                <span className="text-2xl font-black text-gray-900">₹{receipt.order.totalAmount}</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => setReceipt(null)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800">{value || "--"}</span>
    </div>
  );
}

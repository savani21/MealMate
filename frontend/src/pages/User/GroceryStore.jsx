import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
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

  const loadStore = async () => {
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

  const isRequestedProduct = (product) =>
    requestedIngredients.some((ingredient) =>
      product.name.toLowerCase().includes(ingredient) || ingredient.includes(product.name.toLowerCase())
    );

  const matchedRequestedProducts = useMemo(
    () => products.filter(isRequestedProduct),
    [products, requestedIngredients.join(",")]
  );

  const unmatchedRequestedIngredients = requestedIngredients.filter(
    (ingredient) =>
      !products.some(
        (product) =>
          product.name.toLowerCase().includes(ingredient) ||
          ingredient.includes(product.name.toLowerCase())
      )
  );

  const addAllRequested = async () => {
    if (!matchedRequestedProducts.length) return;
    for (const product of matchedRequestedProducts) {
      await addToCart(product._id);
    }
  };

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

          <div className="flex items-center gap-3">
            <button
              onClick={openOrders}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">My Orders</span>
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <p className="font-bold text-gray-900">Ingredients you need to buy</p>
                <p className="text-sm text-gray-500 mt-1">Only missing ingredients are shown, organized by the meal that needs them.</p>
              </div>
              {matchedRequestedProducts.length > 0 && (
                <button onClick={addAllRequested} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition">
                  <ShoppingCart className="w-4 h-4" /> Add All Missing ({matchedRequestedProducts.length})
                </button>
              )}
            </div>

            {requestedGroups.length > 0 ? (
              <div className="space-y-3">
                {requestedGroups.map((group) => (
                  <div key={`${group.day}-${group.mealType}-${group.mealName}`} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">Day {group.day} · {group.mealType}</p>
                      <p className="font-bold text-gray-900 mt-1">{group.mealName}</p>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const matched = products.some((product) => product.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(product.name.toLowerCase()));
                        return (
                          <span key={item._id} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${matched ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                            {item.name}{item.quantity ? ` · ${item.quantity}` : ""}{!matched ? " (Not in store)" : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {requestedIngredients.map((ingredient) => <span key={ingredient} className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold capitalize">{ingredient}</span>)}
              </div>
            )}

            {unmatchedRequestedIngredients.length > 0 && (
              <p className="text-xs text-amber-600 mt-4">Some required ingredients are not currently in the store catalog. Use the search box below for alternatives.</p>
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
                  {isRequestedProduct(product) && (
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-green-50 text-primary">
                      Needed
                    </span>
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
        <div className="fixed inset-0 z-50 bg-black/30 flex justify-end" onClick={() => setOrdersOpen(false)}>
          <aside className="w-full max-w-md bg-white h-full p-6 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
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
              <h2 className="text-xl font-black">Order Placed!</h2>
              <p className="text-white/80 text-sm mt-1">Your grocery order is confirmed</p>
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

import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

const API = "http://localhost:5000";

export default function GroceryStore() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const requestedIngredients = (params.get("ingredients") || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

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
    loadStore();
    loadCart();
  }, []);

  const loadStore = async () => {
    try {
      const response = await fetch(
        `${API}/api/store/products${requestedIngredients.length ? `?search=${encodeURIComponent(requestedIngredients.join(","))}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
            <p className="font-bold text-gray-900">Missing ingredients from your meal plan</p>
            <p className="text-sm text-gray-500 mt-1">The store is showing matching ingredients first.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {requestedIngredients.map((ingredient) => (
                <span key={ingredient} className="px-3 py-1.5 rounded-full bg-green-50 text-primary text-sm font-semibold capitalize">
                  {ingredient}
                </span>
              ))}
            </div>
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
              <div key={product._id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="text-xs text-primary font-semibold uppercase">{product.category}</p>
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

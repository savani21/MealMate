const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getProducts,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../../controllers/user/storeController");

const {
  checkout,
  getMyOrders,
  getOrderById,
} = require("../../controllers/user/orderController");

router.get("/products", auth, getProducts);
router.get("/cart", auth, getCart);
router.post("/cart", auth, addToCart);
router.patch("/cart/:productId", auth, updateCartItem);
router.delete("/cart/:productId", auth, removeFromCart);

router.post("/checkout", auth, checkout);
router.get("/orders", auth, getMyOrders);
router.get("/orders/:id", auth, getOrderById);

module.exports = router;

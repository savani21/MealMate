const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getProducts,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require("../../controllers/user/storeController");

router.get("/products", auth, getProducts);
router.get("/cart", auth, getCart);
router.post("/cart", auth, addToCart);
router.patch("/cart/:productId", auth, updateCartItem);
router.delete("/cart/:productId", auth, removeFromCart);

module.exports = router;

const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require("../../controllers/admin/userController");

router.get("/", auth, admin, getUsers);
router.get("/:id", auth, admin, getUserById);
router.patch("/:id/role", auth, admin, updateUserRole);
router.delete("/:id", auth, admin, deleteUser);

module.exports = router;

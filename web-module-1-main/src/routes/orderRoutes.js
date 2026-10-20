const { Router } = require("express");
const {
  healthCheck,
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
} = require("../controllers/orderController");

const router = Router();

router.get("/health", healthCheck);
router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.delete("/orders/:id", deleteOrder);

module.exports = router;
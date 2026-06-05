import express from "express";
import {
  createOrder,
  getAnalyticsSummary,
  getCustomers,
  getMyOrders,
  getOrders,
  downloadMyOrder,
  getTransactions,
} from "../controllers/businessController.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/orders", auth, createOrder);
router.get("/me/orders", auth, getMyOrders);
router.get("/me/orders/:orderId/download", auth, downloadMyOrder);
router.get("/admin/orders", auth, requireRole("admin"), getOrders);
router.get("/admin/customers", auth, requireRole("admin"), getCustomers);
router.get("/admin/transactions", auth, requireRole("admin"), getTransactions);
router.get("/admin/analytics", auth, requireRole("admin"), getAnalyticsSummary);

export default router;

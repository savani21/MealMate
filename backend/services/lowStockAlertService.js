const StoreProduct = require("../models/store/StoreProduct");
const { createAdminAlert } = require("./adminAlertService");

async function checkLowStockAlerts() {
  const products = await StoreProduct.find({ isActive: true }).select("_id name stock lowStockAlerted").lean();
  let created = 0;
  for (const product of products) {
    const isLow = Number(product.stock) <= 5;
    if (isLow && !product.lowStockAlerted) {
      const alert = await createAdminAlert({
        type: "low-stock",
        severity: Number(product.stock) === 0 ? "critical" : "warning",
        title: Number(product.stock) === 0 ? "Store product is out of stock" : "Store product running low",
        message: `${product.name} has ${product.stock} unit(s) remaining.`,
        source: "Grocery store inventory",
        referenceId: String(product._id),
        actionUrl: "/admin/reports",
        dedupeKey: `low-stock:${product._id}`,
      });
      if (alert) created += 1;
      await StoreProduct.updateOne({ _id: product._id }, { $set: { lowStockAlerted: true } });
    } else if (!isLow && product.lowStockAlerted) {
      await StoreProduct.updateOne({ _id: product._id }, { $set: { lowStockAlerted: false } });
    }
  }
  return { created };
}

module.exports = { checkLowStockAlerts };

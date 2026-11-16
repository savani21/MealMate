const mongoose = require("mongoose");
const AdminAlert = require("../../models/AdminAlert");

exports.getAlerts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const [alerts, unreadCount] = await Promise.all([
      AdminAlert.find().sort({ createdAt: -1 }).limit(limit).lean(),
      AdminAlert.countDocuments({ read: false }),
    ]);
    res.json({ success: true, alerts, unreadCount });
  } catch (error) {
    console.error("Admin alerts load failed:", error);
    res.status(500).json({ success: false, message: "Failed to load admin alerts" });
  }
};

exports.markRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid alert id" });
    const alert = await AdminAlert.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true, readAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    res.json({ success: true, alert });
  } catch (error) {
    console.error("Admin alert update failed:", error);
    res.status(500).json({ success: false, message: "Failed to update alert" });
  }
};

exports.markAllRead = async (_req, res) => {
  try {
    await AdminAlert.updateMany({ read: false }, { $set: { read: true, readAt: new Date() } });
    res.json({ success: true, message: "All admin alerts marked as read" });
  } catch (error) {
    console.error("Admin alerts update failed:", error);
    res.status(500).json({ success: false, message: "Failed to update alerts" });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid alert id" });
    const result = await AdminAlert.deleteOne({ _id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: "Alert not found" });
    res.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    console.error("Admin alert deletion failed:", error);
    res.status(500).json({ success: false, message: "Failed to delete alert" });
  }
};

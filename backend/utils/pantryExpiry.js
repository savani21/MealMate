function getLocalDayStartUtc(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function isPantryItemExpired(item, now = new Date()) {
  if (!item?.expiryDate) return false;
  const expiry = new Date(item.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const expiryDay = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  return expiryDay < getLocalDayStartUtc(now).getTime();
}

function activePantryQuery(userId, now = new Date()) {
  return {
    user: userId,
    $or: [
      { expiryDate: null },
      { expiryDate: { $gte: getLocalDayStartUtc(now) } },
    ],
  };
}

module.exports = { getLocalDayStartUtc, isPantryItemExpired, activePantryQuery };

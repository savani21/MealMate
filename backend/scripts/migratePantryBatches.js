require("dotenv").config();
const mongoose = require("mongoose");

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from backend/.env");
  await mongoose.connect(process.env.MONGO_URI);
  const collection = mongoose.connection.collection("pantryitems");
  const indexes = await collection.indexes();
  const legacyUnique = indexes.find((index) =>
    index.unique &&
    index.key?.user === 1 &&
    index.key?.name === 1 &&
    Object.keys(index.key).length === 2
  );
  if (legacyUnique) {
    await collection.dropIndex(legacyUnique.name);
    console.log(`Dropped legacy unique index: ${legacyUnique.name}`);
  }
  await collection.createIndex(
    { user: 1, name: 1, expiryDate: 1 },
    { name: "user_1_name_1_expiryDate_1" }
  );
  console.log("Pantry batch index is ready. Existing records were preserved as individual batches.");
}

migrate()
  .catch((error) => {
    console.error("Pantry batch migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

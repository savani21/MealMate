export default function UserSection() {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Meal Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Today's Meals" desc="View and log what you've eaten today" />
        <Card title="Suggested Recipes" desc="Personalized meal suggestions" />
        <Card title="Nutrition Summary" desc="Track calories and macros" />
        <Card title="Profile Settings" desc="Update your dietary preferences" />
      </div>
    </section>
  );
}

function Card({ title, desc }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
      <h3 className="font-medium text-gray-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </div>
  );
}

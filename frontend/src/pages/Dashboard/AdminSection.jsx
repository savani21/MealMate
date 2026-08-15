export default function AdminSection() {
  return (
    <section className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Controls</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Manage Users" desc="View, edit, or remove user accounts" />
        <Card title="Manage Meal Plans" desc="Add or update meal plan templates" />
        <Card title="Reports" desc="View platform usage and activity reports" />
        <Card title="Feedback" desc="Review user feedback and support tickets" />
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

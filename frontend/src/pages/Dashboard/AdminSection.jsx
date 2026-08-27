import {
  Users,
  ChefHat,
  Utensils,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Sparkles,
} from "lucide-react";

export default function AdminSection() {
  return (
    <div className="space-y-8">

      {/* ================= ADMIN WELCOME ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-green-50 border border-green-100 p-8 md:p-10">

        <div className="relative z-10 max-w-2xl">

          <p className="text-primary font-semibold tracking-wide uppercase text-sm mb-3">
            MealMate Administration
          </p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
            Manage MealMate.
            <br />
            <span className="text-primary">
              Keep everything healthy.
            </span>
          </h1>

          <p className="text-gray-600 mt-4 text-base md:text-lg max-w-xl">
            Monitor users, manage recipes and keep the MealMate platform
            running smoothly from one place.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">

            <button className="bg-primary text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 transition">
              <Users className="w-5 h-5" />
              Manage Users
            </button>

            <button className="bg-white text-gray-700 px-5 py-3 rounded-xl font-semibold border border-gray-200 flex items-center gap-2 hover:shadow-md transition">
              <ChefHat className="w-5 h-5 text-primary" />
              Manage Recipes
            </button>

          </div>

        </div>

        {/* Decorative circles */}
        <div className="absolute -right-12 -bottom-16 w-56 h-56 rounded-full bg-white/60" />

        <div className="absolute right-10 top-8 w-20 h-20 rounded-full bg-green-100/70" />

      </section>


      {/* ================= ADMIN STATS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <AdminStat
          icon={<Users className="w-6 h-6 text-primary" />}
          label="Total Users"
          value="--"
          description="Registered users"
        />

        <AdminStat
          icon={<ChefHat className="w-6 h-6 text-primary" />}
          label="Recipes"
          value="--"
          description="Available recipes"
        />

        <AdminStat
          icon={<Utensils className="w-6 h-6 text-primary" />}
          label="Meals Planned"
          value="--"
          description="Meal plans created"
        />

        <AdminStat
          icon={<Activity className="w-6 h-6 text-primary" />}
          label="Platform Activity"
          value="--"
          description="Current activity"
        />

      </section>


      {/* ================= MANAGEMENT ================= */}
      <section>

        <div className="mb-5">

          <p className="text-primary font-semibold text-sm uppercase tracking-wide">
            Administration
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-1">
            Manage MealMate
          </h2>

          <p className="text-gray-500 mt-1">
            Manage the platform and monitor important activities.
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Users */}
          <AdminCard
            icon={<Users className="w-6 h-6 text-primary" />}
            title="User Management"
            description="View registered users, manage accounts and control user access."
            button="Manage Users"
          />

          {/* Recipes */}
          <AdminCard
            icon={<ChefHat className="w-6 h-6 text-primary" />}
            title="Recipe Management"
            description="Add, update and manage recipes available on MealMate."
            button="Manage Recipes"
          />

          {/* Meal Plans */}
          <AdminCard
            icon={<ClipboardList className="w-6 h-6 text-primary" />}
            title="Meal Plans"
            description="Monitor meal plans created by users across the platform."
            button="View Meal Plans"
          />

          {/* Analytics */}
          <AdminCard
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
            title="Analytics"
            description="View platform usage and understand how users interact with MealMate."
            button="View Analytics"
          />

          {/* AI */}
          <AdminCard
            icon={<Sparkles className="w-6 h-6 text-primary" />}
            title="AI Features"
            description="Monitor AI-powered recipes, meal recommendations and nutrition features."
            button="Manage AI"
          />

          {/* Security */}
          <AdminCard
            icon={<ShieldCheck className="w-6 h-6 text-primary" />}
            title="Security"
            description="Manage access, roles and security settings for the platform."
            button="Security Settings"
          />

        </div>

      </section>


      {/* ================= RECENT ACTIVITY ================= */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">

        <div className="flex items-center justify-between mb-6">

          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wide">
              Platform
            </p>

            <h2 className="text-2xl font-black text-gray-900 mt-1">
              Recent Activity
            </h2>
          </div>

          <Activity className="w-6 h-6 text-primary" />

        </div>


        <div className="space-y-4">

          <ActivityItem
            icon={<UserPlus className="w-5 h-5 text-primary" />}
            title="New user registered"
            description="A new user joined MealMate."
          />

          <ActivityItem
            icon={<ChefHat className="w-5 h-5 text-primary" />}
            title="Recipe activity"
            description="Users are exploring AI-powered recipes."
          />

          <ActivityItem
            icon={<Utensils className="w-5 h-5 text-primary" />}
            title="Meal planning activity"
            description="Users are creating personalized meal plans."
          />

        </div>

      </section>

    </div>
  );
}


/* ================= ADMIN STAT ================= */

function AdminStat({ icon, label, value, description }) {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {label}
          </p>

          <p className="text-3xl font-black text-gray-900 mt-2">
            {value}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {description}
          </p>

        </div>

        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* ================= ADMIN CARD ================= */

function AdminCard({ icon, title, description, button }) {
  return (
    <div className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">

      <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="font-bold text-lg text-gray-900">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>

      <button className="text-primary font-semibold text-sm mt-5 flex items-center gap-1 group-hover:gap-2 transition-all">
        {button}
        <ArrowRight className="w-4 h-4" />
      </button>

    </div>
  );
}


/* ================= ACTIVITY ITEM ================= */

function ActivityItem({ icon, title, description }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 transition">

      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold text-gray-800">
          {title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      </div>

    </div>
  );
}
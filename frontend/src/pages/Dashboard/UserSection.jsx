import {
  CalendarDays,
  ChefHat,
  ShoppingBasket,
  Heart,
  ArrowRight,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function UserSection() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="space-y-8">

      {/* =====================================================
          USER WELCOME SECTION
      ===================================================== */}

      <section className="
        bg-green-50
        border
        border-green-100
        rounded-3xl
        p-8
        md:p-10
      ">

        <p className="
          text-primary
          font-semibold
          text-sm
          uppercase
          tracking-wide
        ">
          Welcome to MealMate
        </p>

        <h1 className="
          text-3xl
          md:text-4xl
          font-black
          text-gray-900
          mt-2
        ">
          Eat better.
          <br />
          <span className="text-primary">
            Live healthier.
          </span>
        </h1>

        <p className="
          text-gray-600
          mt-4
          max-w-xl
        ">
          Welcome back, { user?.name || "User" }!
          Plan your meals, manage your saved plans
          and organize your groceries.
        </p>

      </section>


      {/* =====================================================
          USER QUICK ACTIONS
      ===================================================== */}

      <section>

        <div className="mb-5">

          <p className="
            text-primary
            font-semibold
            text-sm
            uppercase
            tracking-wide
          ">
            Your MealMate
          </p>

          <h2 className="
            text-2xl
            md:text-3xl
            font-black
            text-gray-900
            mt-1
          ">
            What would you like to do?
          </h2>

        </div>


        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-5
        ">

          {/* =================================================
              MEAL PLANNER
          ================================================== */}

          <ActionCard
            icon={
              <CalendarDays className="w-6 h-6 text-primary" />
            }
            title="Meal Planner"
            description="Create a personalized meal plan."
            onClick={ () => setLocation("/meal-planner") }
          />


          {/* =================================================
              MY MEAL PLANS
          ================================================== */}

          <ActionCard
            icon={
              <ClipboardList className="w-6 h-6 text-primary" />
            }
            title="My Meal Plans"
            description="View your saved meal plans."
            onClick={ () => setLocation("/my-meal-plans") }
          />


          {/* =================================================
              GROCERY LIST
          ================================================== */}

          <ActionCard
            icon={
              <ShoppingBasket className="w-6 h-6 text-primary" />
            }
            title="Grocery List"
            description="View and manage your grocery list."
            onClick={ () => setLocation("/user/grocery") }
          />


          {/* =================================================
              FAVORITES
          ================================================== */}

          <ActionCard
            icon={
              <Heart className="w-6 h-6 text-primary" />
            }
            title="Favorites"
            description="View your saved favorite recipes."
            onClick={ () => setLocation("/favorites") }
          />

        </div>

      </section>


      {/* =====================================================
          AI RECIPE SECTION
      ===================================================== */}

      <section className="
        bg-white
        rounded-3xl
        border
        border-gray-100
        shadow-sm
        p-7
        md:p-8
      ">

        <div className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-5
        ">

          <div className="flex items-start gap-4">

            <div className="
              w-12
              h-12
              rounded-xl
              bg-green-50
              flex
              items-center
              justify-center
              shrink-0
            ">
              <Sparkles className="
                w-6
                h-6
                text-primary
              " />
            </div>


            <div>

              <p className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-primary
              ">
                MealMate AI
              </p>

              <h2 className="
                text-xl
                font-black
                text-gray-900
                mt-1
              ">
                Need a meal idea?
              </h2>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">
                Get personalized recipe recommendations
                based on your preferences.
              </p>

            </div>

          </div>


          <button
            onClick={ () => setLocation("/recipes") }
            className="
              flex
              items-center
              justify-center
              gap-2
              bg-primary
              text-white
              px-5
              py-3
              rounded-xl
              font-semibold
              hover:opacity-90
              transition
              whitespace-nowrap
            "
          >
            <ChefHat className="w-5 h-5" />
            Find Recipes
          </button>

        </div>

      </section>


      {/* =====================================================
          TODAY'S MEALS
      ===================================================== */}

      <section>

        <div className="
          flex
          items-center
          justify-between
          mb-5
        ">

          <div>

            <p className="
              text-primary
              font-semibold
              text-sm
              uppercase
              tracking-wide
            ">
              Today's Plan
            </p>

            <h2 className="
              text-2xl
              md:text-3xl
              font-black
              text-gray-900
              mt-1
            ">
              Your Meals Today
            </h2>

          </div>


          <button
            onClick={ () => setLocation("/my-meal-plans") }
            className="
              hidden
              sm:flex
              items-center
              gap-1
              text-primary
              font-semibold
              text-sm
              hover:gap-2
              transition-all
            "
          >
            View Plan
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>


        <div className="
          grid
          grid-cols-1
          md:grid-cols-3
          gap-5
        ">

          <MealCard
            type="Breakfast"
            time="8:00 AM"
            meal="Healthy Oat Bowl"
            description="Oats, banana, berries and almonds"
          />

          <MealCard
            type="Lunch"
            time="1:00 PM"
            meal="Veggie Rice Bowl"
            description="Rice, vegetables, tofu and herbs"
          />

          <MealCard
            type="Dinner"
            time="8:00 PM"
            meal="Protein Veggie Bowl"
            description="Mixed vegetables, paneer and quinoa"
          />

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={ onClick }
      className="
        text-left
        bg-white
        rounded-2xl
        border
        border-gray-100
        p-6
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        transition-all
        duration-300
        group
      "
    >

      <div className="
        w-12
        h-12
        rounded-xl
        bg-green-50
        flex
        items-center
        justify-center
        mb-5
      ">
        { icon }
      </div>


      <h3 className="
        font-bold
        text-lg
        text-gray-900
      ">
        { title }
      </h3>


      <p className="
        text-sm
        text-gray-500
        mt-2
      ">
        { description }
      </p>


      <div className="
        flex
        items-center
        gap-1
        text-primary
        text-sm
        font-semibold
        mt-4
        group-hover:gap-2
        transition-all
      ">
        Open
        <ArrowRight className="w-4 h-4" />
      </div>

    </button>
  );
}


/* =========================================================
   MEAL CARD
========================================================= */

function MealCard({
  type,
  time,
  meal,
  description,
}) {
  return (
    <div className="
      bg-white
      rounded-2xl
      border
      border-gray-100
      overflow-hidden
      shadow-sm
      hover:shadow-lg
      hover:-translate-y-1
      transition-all
      duration-300
    ">

      <div className="
        h-28
        bg-green-50
        flex
        items-center
        justify-center
      ">
        <div className="text-4xl">
          🍽️
        </div>
      </div>


      <div className="p-6">

        <div className="
          flex
          items-center
          justify-between
        ">

          <p className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-primary
          ">
            { type }
          </p>

          <span className="
            text-xs
            text-gray-400
          ">
            { time }
          </span>

        </div>


        <h3 className="
          text-lg
          font-bold
          text-gray-900
          mt-3
        ">
          { meal }
        </h3>


        <p className="
          text-sm
          text-gray-500
          mt-2
          leading-relaxed
        ">
          { description }
        </p>

      </div>

    </div>
  );
}
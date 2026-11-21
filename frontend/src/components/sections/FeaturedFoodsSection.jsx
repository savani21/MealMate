import { AnimatedSection } from '../AnimatedSection';

const featuredFoods = [
  {
    name: 'Aloo Paratha with Curd',
    category: 'COMFORTING BREAKFAST',
    description: 'Golden, pan-roasted potato-stuffed parathas served with cool, creamy curd.',
    image: 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy%2Cf_auto%2Cq_auto%2Cw_300%2Ch_300%2Ce_grayscale%2Cc_fit/FOOD_CATALOG/IMAGES/CMS/2025/9/25/6911add1-fe29-4cbc-9b56-696cc21cf690_4ebc8491-3e03-42a9-9717-acc2aff49fee.jpg',
    alt: 'Golden aloo parathas served with a bowl of curd',
  },
  {
    name: 'Poha',
    category: 'LIGHT & FLAVORFUL',
    description: 'A homestyle bowl of soft, fluffy poha with peanuts, herbs and a hint of lemon.',
    image: 'https://media-assets.swiggy.com/swiggy/image/upload/f_auto%2Cq_auto%2Cfl_lossy/irzppvkxey1twvbbljze',
    alt: 'Indian poha with peanuts, herbs and lemon',
  },
  {
    name: 'Paneer Rice Bowl',
    category: 'WHOLESOME MEAL',
    description: 'A satisfying bowl of fluffy rice topped with paneer, fresh vegetables and herbs.',
    image: 'https://protibowls.com/wp-content/uploads/2025/03/Highcompressed_854332699.jpg',
    alt: 'Paneer rice bowl with vegetables and fresh herbs',
  },
  {
    name: 'Rasmalai',
    category: 'SWEET FINISH',
    description: 'Soft, delicate rasmalai served in creamy saffron milk with pistachio.',
    image: 'https://www.ajantasweets.com/images/carousel/ras-malai.webp',
    alt: 'Rasmalai in saffron milk garnished with pistachios',
  },
];

export function FeaturedFoodsSection() {
  return (
    <section id="recipes" className="py-20 md:py-28 bg-[#fffdf8]">
      <div className="container mx-auto px-4 md:px-6">
        <AnimatedSection className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <span className="mb-3 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold tracking-[0.18em] text-orange-700">
            A TASTE OF MEALMATE
          </span>
          <h2 className="mb-5 text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
            Good food. <span className="text-primary">Made simple.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
            From a comforting breakfast to a sweet little treat, discover a few delicious ideas to inspire your next meal.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {featuredFoods.map((food, index) => (
            <AnimatedSection key={food.name} delay={index * 0.08}>
              <article className="group h-full overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-orange-50">
                  <img
                    src={food.image}
                    alt={food.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-primary">
                    {food.category}
                  </p>
                  <h3 className="mb-2 text-xl font-extrabold text-gray-900">{food.name}</h3>
                  <p className="text-sm leading-6 text-gray-600">{food.description}</p>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

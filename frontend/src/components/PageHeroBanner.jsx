export default function PageHeroBanner({ title }) {
  return (
    <div className="mx-auto mb-4 max-w-6xl px-4 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-r from-[#173f2b] to-[#287348] px-5 py-4 text-white shadow-sm sm:px-6">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      </section>
    </div>
  );
}

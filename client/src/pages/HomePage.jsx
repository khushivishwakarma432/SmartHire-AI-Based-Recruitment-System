function HomePage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
          AI-Based Recruitment System
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          SmartHire
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
        Frontend foundation for a clean and minimal recruitment platform.
        </p>
        <div className="mt-8 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          Tailwind CSS is configured and ready.
        </div>
      </div>
    </section>
  );
}

export default HomePage;

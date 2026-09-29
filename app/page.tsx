import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#1a1a1a]">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Akaibi" className="h-7 w-auto" />
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[#4a4a4a] md:flex">
          <a href="#producto" className="hover:text-[#1a1a1a]">
            Producto
          </a>
          <a href="#como-funciona" className="hover:text-[#1a1a1a]">
            Cómo funciona
          </a>
          <a href="#contacto" className="hover:text-[#1a1a1a]">
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#4a4a4a] hover:text-[#1a1a1a] sm:block"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#bc002d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9c0026]"
          >
            Comenzar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-16 px-6 pt-12 pb-24 md:grid-cols-2 md:items-center md:pt-20">
        {/* Left: copy */}
        <div>
          <p className="mb-5 text-sm font-medium text-[#bc002d]">
            Gestión documental para empresas
          </p>

          <h1 className="text-[2.75rem] leading-[1.08] font-semibold tracking-tight text-[#1a1a1a] sm:text-6xl">
            Tus documentos,
            <br />
            siempre en orden.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#5a5a5a]">
            Facturas, contratos, fotos de obra y más — digitalizados,
            indexados y listos para que tu equipo y tus clientes los
            encuentren en segundos.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-[#1a1a1a] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
            >
              Ver una demo
            </Link>
            <a
              href="#contacto"
              className="text-sm font-medium text-[#1a1a1a] underline decoration-[#bc002d] decoration-2 underline-offset-4"
            >
              Hablar con nosotros
            </a>
          </div>
        </div>

        {/* Right: document-stack visual, built from real UI elements instead of a stock photo */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[#f0ece6]" />

          <div className="relative rounded-2xl border border-[#e8e4dd] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-[#efece6] pb-4">
              <span className="text-sm font-medium text-[#1a1a1a]">
                Facturas
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#e9f7ee] px-2.5 py-1 text-xs font-medium text-[#1f7a44]">
                <span className="size-1.5 rounded-full bg-[#1f7a44]" />
                Indexado
              </span>
            </div>

            {[
              { name: 'Factura-00251.pdf', meta: '20/3/2026 · Bs. 13,311.87' },
              { name: 'Factura-00098.pdf', meta: '28/3/2026 · Bs. 1,748.80' },
              { name: 'Cotización-004.pdf', meta: '2/4/2026 · Bs. 4,220.00' },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-3 border-b border-[#f2efe9] py-3 last:border-0"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#fbeaee]">
                  <div className="h-3.5 w-2.5 rounded-[1px] border border-[#bc002d]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1a1a1a]">
                    {doc.name}
                  </p>
                  <p className="truncate text-xs text-[#8a8a8a]">
                    {doc.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* small floating badge, tucked behind the card corner */}
          <div className="absolute -right-4 -bottom-4 rounded-xl border border-[#e8e4dd] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-xs text-[#8a8a8a]">Búsqueda instantánea</p>
            <p className="text-sm font-medium text-[#1a1a1a]">
              &lt; 1 segundo
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

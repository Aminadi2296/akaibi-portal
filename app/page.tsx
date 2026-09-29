'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Files, ScanText, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Quiero saber más sobre Akaibi Portal — ${name || 'Sin nombre'}`,
    );
    const body = encodeURIComponent(
      `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
    );
    window.location.href = `mailto:contacto@akaibiportal.com?subject=${subject}&body=${body}`;
  }
  return (
    <main className="min-h-screen bg-[#faf9f7] text-[#1a1a1a]">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src="/akaibi-logo.svg" alt="Akaibi" className="h-7 w-auto" />
        </div>

        <nav className="hidden items-center gap-8 text-sm text-[#4a4a4a] md:flex">
          <a
            href="#servicios"
            className="relative hover:text-[#1a1a1a] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#bc002d] after:transition-transform after:duration-200 hover:after:scale-x-100"
          >
            Servicios
          </a>
          <a
            href="#contacto"
            className="relative hover:text-[#1a1a1a] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#bc002d] after:transition-transform after:duration-200 hover:after:scale-x-100"
          >
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
            Organiza tus archivos en la nube y garantiza que cada documento esté
            a un clic de distancia.
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
                  <p className="truncate text-xs text-[#8a8a8a]">{doc.meta}</p>
                </div>
              </div>
            ))}
          </div>

          {/* small floating badge, tucked behind the card corner */}
          <div className="absolute -right-4 -bottom-4 rounded-xl border border-[#e8e4dd] bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-xs text-[#8a8a8a]">Búsqueda instantánea</p>
            <p className="text-sm font-medium text-[#1a1a1a]">&lt; 1 segundo</p>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-t border-[#efece6] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-lg">
            <p className="mb-4 text-sm font-medium text-[#bc002d]">Servicios</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#1a1a1a] sm:text-4xl">
              Todo lo que tus documentos necesitan, en un solo lugar.
            </h2>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {/* Plataforma */}
            <div>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#fbeaee]">
                <Files className="size-5 text-[#bc002d]" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-medium text-[#1a1a1a]">Plataforma</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[#5a5a5a]">
                Ver tus documentos en cualquier momento y desde cualquier lugar,
                con búsqueda instantánea, filtros y etiquetas para encontrarlos
                en segundos reemplazando horas de búsqueda manual en archivos
                físicos.
              </p>
            </div>

            {/* Digitalización */}
            <div>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#fbeaee]">
                <ScanText className="size-5 text-[#bc002d]" strokeWidth={1.8} />
              </div>
              <h3 className="text-lg font-medium text-[#1a1a1a]">
                Digitalización
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[#5a5a5a]">
                Convertimos tus archivos físicos en documentos digitales
                organizados, aplicando procesamiento OCR según el tipo de
                documento y tus necesidades, sin que tu equipo pierda horas
                escaneando y clasificando.
              </p>
            </div>

            {/* Custodia */}
            <div>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#f2efe9]">
                <ShieldCheck
                  className="size-5 text-[#8a8a8a]"
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-[#1a1a1a]">Custodia</h3>
                <span className="rounded-full bg-[#f2efe9] px-2 py-0.5 text-xs font-medium text-[#8a8a8a]">
                  Próximamente
                </span>
              </div>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[#5a5a5a]">
                Resguardo físico y digital de tus documentos originales con
                altos estándares de seguridad con trazabilidad completa de quién
                accede y cuándo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="border-t border-[#efece6]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-4 text-sm font-medium text-[#bc002d]">
                Contacto
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[#1a1a1a] sm:text-4xl">
                Hablemos sobre tus documentos.
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5a5a5a]">
                Cuéntanos qué tipo de documentos manejas y te mostramos cómo se
                vería organizado en Akaibi.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 rounded-2xl border border-[#e8e4dd] bg-white p-8"
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1.5 block text-xs font-medium text-[#5a5a5a]"
                >
                  Nombre
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-lg border border-[#e8e4dd] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder:text-[#a8a8a8] focus:border-[#bc002d]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-xs font-medium text-[#5a5a5a]"
                >
                  Correo
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  className="w-full rounded-lg border border-[#e8e4dd] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder:text-[#a8a8a8] focus:border-[#bc002d]"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-xs font-medium text-[#5a5a5a]"
                >
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos qué documentos manejas..."
                  className="w-full resize-none rounded-lg border border-[#e8e4dd] bg-[#faf9f7] px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none placeholder:text-[#a8a8a8] focus:border-[#bc002d]"
                />
              </div>

              <button
                type="submit"
                className="mt-1 rounded-full bg-[#bc002d] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#9c0026]"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

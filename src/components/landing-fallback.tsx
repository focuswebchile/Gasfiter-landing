type LandingFallbackProps = {
  showNotice?: boolean;
};

const landingHtml = String.raw`
    <!-- COMPONENTE: NAV -->
    <nav class="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#inicio" class="flex items-center gap-2">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <!-- CAMBIO FACIL: LOGO -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </span>
          <span class="font-display text-lg font-bold text-ink">Gasfiter</span>
        </a>
        <div class="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a class="transition hover:text-primary" href="#servicios">Servicios</a>
          <a class="transition hover:text-primary" href="#proceso">Proceso</a>
          <a class="transition hover:text-primary" href="#testimonios">Testimonios</a>
          <a class="transition hover:text-primary" href="#faq">FAQ</a>
        </div>
        <a
          href="#contacto"
          class="hidden rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:scale-[1.02] md:inline-flex"
        >
          Solicitar Cotización
        </a>
      </div>
    </nav>

    <!-- COMPONENTE: HERO -->
    <section id="inicio" class="relative overflow-hidden">
      <div class="absolute inset-0 grid-pattern opacity-50"></div>
      <div class="relative mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div class="space-y-6">
            <div class="reveal inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm badge" data-anim="slide-right">
              <span class="font-semibold">5 Estrellas</span>
              <span class="text-xs text-slate-600"><!-- CAMBIO FACIL: BADGE HERO -->+120 reseñas verificadas</span>
            </div>
            <h1 class="reveal font-display text-4xl font-bold leading-tight text-ink md:text-5xl lg:text-6xl" data-anim="fade">
              <!-- CAMBIO FACIL: TITULO HERO -->
              Gasfitería profesional 24/7 para tu hogar y negocio
            </h1>
            <p class="reveal max-w-xl text-lg text-slate-600" data-anim="fade">
              <!-- CAMBIO FACIL: SUBTITULO HERO -->
              Resolvemos fugas, destapes e instalaciones con rapidez, limpieza y garantía. Llega un técnico certificado en menos de 60 minutos.
            </p>
            <div class="reveal flex flex-col gap-3 sm:flex-row" data-anim="slide-right">
              <a
                href="#contacto"
                class="btn-primary inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold shadow-soft transition"
              >
                Llamar Ahora
              </a>
              <a
                href="#whatsapp"
                class="btn-secondary inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition"
              >
                Contactar por WhatsApp
              </a>
            </div>
            <div class="reveal flex flex-wrap items-center gap-6 text-sm text-slate-500" data-anim="fade">
              <span><!-- <Replace with Phone> -->Teléfono: +56 9 1234 5678</span>
              <span><!-- <Replace with Email> -->Email: contacto@gasfiter.cl</span>
              <span><!-- <Replace with Hours> -->Horario: 24/7</span>
            </div>
          </div>
          <div class="reveal rounded-3xl bg-white/70 p-4 shadow-soft backdrop-blur" data-anim="zoom">
            <img
              class="h-80 w-full rounded-2xl object-cover"
              src="/images/gasfiter-hero.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN HERO -->Gasfiter revisando una instalación"
            />
            <div class="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div>
                <p class="text-sm font-semibold text-ink">Respuesta inmediata</p>
                <p class="text-xs text-slate-500">En tu domicilio en menos de 60 minutos</p>
              </div>
              <span class="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: SERVICIOS (BENTO GRID 3x3) -->
    <section id="servicios" class="mx-auto max-w-6xl px-6 py-20">
      <div class="mb-12 max-w-2xl space-y-4">
        <h2 class="reveal font-display text-3xl font-bold text-ink md:text-4xl" data-anim="fade">
          <!-- CAMBIO FACIL: TITULO SERVICIOS -->
          Servicios de gasfitería 24/7 en tu comuna
        </h2>
        <p class="reveal text-base text-slate-600" data-anim="fade">
          <!-- CAMBIO FACIL: SUBTITULO SERVICIOS -->
          Soluciones rápidas para hogares y negocios. Diagnóstico claro, precio transparente y garantía escrita.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[420px]" data-anim="slide-right">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-fugas.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Reparación de fugas"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Detección y reparación de fugas</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Tecnología termográfica para ubicar la fuga sin romper más de lo necesario.</p>
          </div>
        </article>
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[400px]" data-anim="slide-left">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-destape.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Destape de cañerías"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Destape de cañerías</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Equipos de presión y cámaras endoscópicas.</p>
          </div>
        </article>
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[420px]" data-anim="slide-left">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-griferia.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Instalación de grifería"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Instalación de griferías</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Cambio completo con prueba de sellado.</p>
          </div>
        </article>
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[400px]" data-anim="slide-right">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-mantencion.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Mantención preventiva"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Mantención preventiva</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Planes para condominios y locales.</p>
          </div>
        </article>
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[420px]" data-anim="slide-right">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-calefont.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Instalación de calefont"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Instalación de calefont</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Con certificación y puesta en marcha segura.</p>
          </div>
        </article>
        <article class="reveal bento-card group overflow-hidden rounded-3xl shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl lg:min-h-[400px]" data-anim="slide-right">
          <div class="h-44 w-full">
            <img
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src="/images/gasfiter-emergencias.webp"
              alt="<!-- CAMBIO FACIL: IMAGEN SERVICIO -->Emergencias"
            />
          </div>
          <div class="relative p-8">
            <h3 class="mt-6 text-2xl font-semibold text-ink"><!-- CAMBIO FACIL: TÍTULO DEL SERVICIO -->Emergencias 24/7</h3>
            <p class="mt-3 text-base text-slate-500"><!-- CAMBIO FACIL: DESCRIPCIÓN DEL SERVICIO -->Atención urgente en menos de 60 minutos.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- COMPONENTE: POR QUE ELEGIRNOS -->
    <section class="bg-blue-50 py-20">
      <div class="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <div class="reveal order-2 lg:order-1" data-anim="slide-right">
          <img
            class="w-full rounded-3xl shadow-soft"
            src="/images/gasfiter-why.webp"
            alt="<!-- CAMBIO FACIL: IMAGEN POR QUE ELEGIRNOS -->Gasfiter profesional trabajando"
          />
        </div>
        <div class="order-1 lg:order-2">
          <h2 class="reveal font-display text-3xl font-bold text-blue-900 md:text-5xl" data-anim="fade">
            ¿Por Qué Elegirnos?
          </h2>
          <div class="mt-8 space-y-6">
            <div class="reveal flex items-start gap-4" data-anim="slide-left">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              <div>
                <h3 class="text-xl font-semibold text-blue-900"><!-- CAMBIO FACIL: TITULO BENEFICIO -->Experiencia Comprobada</h3>
                <p class="text-base text-slate-600"><!-- CAMBIO FACIL: TEXTO BENEFICIO -->Más de 10 años atendiendo clientes en toda la región.</p>
              </div>
            </div>
            <div class="reveal flex items-start gap-4" data-anim="slide-left">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              <div>
                <h3 class="text-xl font-semibold text-blue-900"><!-- CAMBIO FACIL: TITULO BENEFICIO -->Certificación Profesional</h3>
                <p class="text-base text-slate-600"><!-- CAMBIO FACIL: TEXTO BENEFICIO -->Certificación SEC vigente y cumplimiento de normativas.</p>
              </div>
            </div>
            <div class="reveal flex items-start gap-4" data-anim="slide-left">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              <div>
                <h3 class="text-xl font-semibold text-blue-900"><!-- CAMBIO FACIL: TITULO BENEFICIO -->Precio Justo y Transparente</h3>
                <p class="text-base text-slate-600"><!-- CAMBIO FACIL: TEXTO BENEFICIO -->Cotización detallada antes de iniciar cualquier trabajo.</p>
              </div>
            </div>
            <div class="reveal flex items-start gap-4" data-anim="slide-left">
              <span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              <div>
                <h3 class="text-xl font-semibold text-blue-900"><!-- CAMBIO FACIL: TITULO BENEFICIO -->Garantía en Todos los Trabajos</h3>
                <p class="text-base text-slate-600"><!-- CAMBIO FACIL: TEXTO BENEFICIO -->6 meses de garantía en mano de obra y materiales.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: TESTIMONIOS -->
    <section id="testimonios" class="py-20">
      <div class="mx-auto max-w-5xl px-6">
        <div class="reveal text-center" data-anim="fade">
          <h2 class="font-display text-3xl font-bold text-blue-900 md:text-5xl">Lo Que Dicen Nuestros Clientes</h2>
          <p class="mt-4 text-lg text-slate-600">Más de 200 clientes satisfechos respaldan nuestro trabajo.</p>
        </div>
        <div class="mt-12 grid gap-6 md:grid-cols-3">
          <article class="reveal rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-soft" data-anim="slide-up">
            <div class="flex justify-center gap-1 text-accent">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
            </div>
            <p class="mt-4 text-sm italic text-slate-700">
              “Excelente servicio, llegaron rápido y solucionaron la fuga en menos de 2 horas.”
            </p>
            <div class="mt-5 flex flex-col items-center gap-2">
              <img class="h-14 w-14 rounded-full object-cover shadow-soft" src="/images/gasfiter-testimonial.webp" alt="Cliente satisfecho" />
              <p class="text-sm font-semibold text-blue-900">María González</p>
              <p class="text-xs text-slate-500">Las Condes</p>
            </div>
          </article>
          <article class="reveal rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-soft" data-anim="slide-up">
            <div class="flex justify-center gap-1 text-accent">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
            </div>
            <p class="mt-4 text-sm italic text-slate-700">
              “Trabajo impecable, muy profesionales y puntuales. Volvería a contratar sin dudar.”
            </p>
            <div class="mt-5 flex flex-col items-center gap-2">
              <img class="h-14 w-14 rounded-full object-cover shadow-soft" src="/images/gasfiter-testimonial-2.webp" alt="Cliente satisfecho" />
              <p class="text-sm font-semibold text-blue-900">Camila R.</p>
              <p class="text-xs text-slate-500">Providencia</p>
            </div>
          </article>
          <article class="reveal rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-soft" data-anim="slide-up">
            <div class="flex justify-center gap-1 text-accent">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a.53.53 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
            </div>
            <p class="mt-4 text-sm italic text-slate-700">
              “Muy buena comunicación y soluciones rápidas. Dejaron todo limpio.”
            </p>
            <div class="mt-5 flex flex-col items-center gap-2">
              <img class="h-14 w-14 rounded-full object-cover shadow-soft" src="/images/gasfiter-testimonial-3.webp" alt="Cliente satisfecho" />
              <p class="text-sm font-semibold text-blue-900">Jorge M.</p>
              <p class="text-xs text-slate-500">Ñuñoa</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: PROCESO DE TRABAJO -->
    <section id="proceso" class="bg-slate-50 py-20">
      <div class="mx-auto max-w-6xl px-6">
        <div class="reveal text-center" data-anim="fade">
          <h2 class="font-display text-3xl font-bold text-ink md:text-5xl">
            <!-- CAMBIO FACIL: TITULO PROCESO -->Nuestro Proceso de Trabajo
          </h2>
          <p class="mt-4 text-base text-slate-600 md:text-lg">
            <!-- CAMBIO FACIL: SUBTITULO PROCESO -->Simple, rápido y efectivo. Así resolvemos tus problemas.
          </p>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <article class="reveal space-y-3 rounded-3xl bg-white p-6 shadow-soft" data-anim="slide-right">
            <div class="text-4xl font-semibold text-blue-200">01</div>
            <h3 class="text-lg font-semibold text-ink"><!-- CAMBIO FACIL: TITULO PASO -->Contacto</h3>
            <p class="text-sm text-slate-500">
              <!-- CAMBIO FACIL: DESCRIPCION PASO -->Llámanos o escríbenos por WhatsApp. Te atendemos 24/7.
            </p>
          </article>
          <article class="reveal space-y-3 rounded-3xl bg-white p-6 shadow-soft" data-anim="slide-right">
            <div class="text-4xl font-semibold text-blue-200">02</div>
            <h3 class="text-lg font-semibold text-ink"><!-- CAMBIO FACIL: TITULO PASO -->Diagnóstico</h3>
            <p class="text-sm text-slate-500">
              <!-- CAMBIO FACIL: DESCRIPCION PASO -->Evaluamos tu problema y entregamos una cotización transparente.
            </p>
          </article>
          <article class="reveal space-y-3 rounded-3xl bg-white p-6 shadow-soft" data-anim="slide-right">
            <div class="text-4xl font-semibold text-blue-200">03</div>
            <h3 class="text-lg font-semibold text-ink"><!-- CAMBIO FACIL: TITULO PASO -->Ejecución</h3>
            <p class="text-sm text-slate-500">
              <!-- CAMBIO FACIL: DESCRIPCION PASO -->Realizamos el trabajo con profesionalismo y eficiencia.
            </p>
          </article>
          <article class="reveal space-y-3 rounded-3xl bg-white p-6 shadow-soft" data-anim="slide-right">
            <div class="text-4xl font-semibold text-blue-200">04</div>
            <h3 class="text-lg font-semibold text-ink"><!-- CAMBIO FACIL: TITULO PASO -->Garantía</h3>
            <p class="text-sm text-slate-500">
              <!-- CAMBIO FACIL: DESCRIPCION PASO -->Te entregamos garantía por escrito en todos los trabajos.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: CTA PRINCIPAL -->
    <section id="contacto" class="bg-gradient-to-r from-orange-600 to-orange-700 py-20 text-white">
      <div class="mx-auto max-w-5xl px-6 text-center">
        <h2 class="reveal font-display text-3xl font-bold md:text-5xl" data-anim="fade">
          ¿Necesitas un Gasfiter Ahora?
        </h2>
        <p class="reveal mt-4 text-lg text-white/90" data-anim="fade">
          Atención de emergencias 24/7. Llámanos y resolvemos tu problema hoy mismo.
        </p>
        <div class="reveal mt-8 flex flex-col justify-center gap-4 sm:flex-row" data-anim="zoom">
          <a
            href="tel:+56912345678"
            class="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-lg font-semibold text-orange-600 shadow-soft transition hover:scale-[1.02]"
          >
            Llamar Ahora: +56 9 1234 5678
          </a>
          <a
            id="whatsapp"
            href="https://wa.me/56912345678"
            class="inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-3 text-lg font-semibold text-white shadow-soft transition hover:bg-white hover:text-orange-600"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: FAQ -->
    <section id="faq" class="py-20">
      <div class="mx-auto max-w-4xl px-6">
        <div class="reveal text-center" data-anim="fade">
          <h2 class="font-display text-3xl font-bold text-blue-900 md:text-5xl">Preguntas Frecuentes</h2>
          <p class="mt-4 text-lg text-slate-600">Resolvemos tus dudas sobre nuestros servicios.</p>
        </div>
        <div class="mt-10 space-y-4">
          <details class="reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-soft" data-anim="slide-right">
            <summary class="cursor-pointer text-lg font-semibold text-blue-900">¿Cuánto tiempo demoran en llegar?</summary>
            <p class="mt-3 text-base text-slate-600"><!-- CAMBIO FACIL: RESPUESTA FAQ -->En promedio 60 minutos dentro del área metropolitana.</p>
          </details>
          <details class="reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-soft" data-anim="slide-right">
            <summary class="cursor-pointer text-lg font-semibold text-blue-900">¿Tienen certificación para trabajos de gas?</summary>
            <p class="mt-3 text-base text-slate-600">Contamos con certificación SEC vigente y técnicos acreditados.</p>
          </details>
          <details class="reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-soft" data-anim="slide-right">
            <summary class="cursor-pointer text-lg font-semibold text-blue-900">¿Hacen cotizaciones sin costo?</summary>
            <p class="mt-3 text-base text-slate-600">Sí, la cotización es gratuita y sin compromiso.</p>
          </details>
          <details class="reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-soft" data-anim="slide-right">
            <summary class="cursor-pointer text-lg font-semibold text-blue-900">¿Qué formas de pago aceptan?</summary>
            <p class="mt-3 text-base text-slate-600">Aceptamos transferencia, tarjeta y efectivo.</p>
          </details>
          <details class="reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-soft" data-anim="slide-right">
            <summary class="cursor-pointer text-lg font-semibold text-blue-900">¿Los trabajos tienen garantía?</summary>
            <p class="mt-3 text-base text-slate-600">Garantía de 6 meses en mano de obra y materiales.</p>
          </details>
        </div>
      </div>
    </section>

    <!-- COMPONENTE: CONTACTO RAPIDO -->
    <section id="contacto-rapido" class="py-20">
      <div class="mx-auto max-w-4xl px-6">
        <div class="reveal text-center" data-anim="fade">
          <h2 class="font-display text-3xl font-bold text-blue-900 md:text-5xl">
            <!-- CAMBIO FACIL: TITULO CONTACTO -->
            ¿En qué te podemos ayudar?
          </h2>
          <p class="mt-4 text-lg text-slate-600">
            <!-- CAMBIO FACIL: SUBTITULO CONTACTO -->
            Cuéntanos tu problema y te contactamos en minutos.
          </p>
        </div>
        <form class="reveal mt-10 grid gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft md:grid-cols-2" data-anim="slide-up">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-blue-900" for="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Tu nombre"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 focus:border-primary focus:outline-none"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-blue-900" for="telefono">Número de contacto</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="+56 9 1234 5678"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 focus:border-primary focus:outline-none"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-semibold text-blue-900" for="problema">¿Cuál es tu problema?</label>
            <textarea
              id="problema"
              name="problema"
              rows="4"
              placeholder="Describe brevemente tu problema"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-700 focus:border-primary focus:outline-none"
            ></textarea>
          </div>
          <div class="md:col-span-2">
            <button
              type="submit"
              class="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-ink shadow-soft transition hover:brightness-95"
            >
              Solicitar Cotización
            </button>
          </div>
          <p class="md:col-span-2 text-center text-xs text-slate-500">
            <!-- CAMBIO FACIL: TEXTO NOTA -->
            Respuesta rápida en horario laboral. Emergencias 24/7 por teléfono o WhatsApp.
          </p>
        </form>
      </div>
    </section>

    <!-- COMPONENTE: WHATSAPP FLOTANTE -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <div class="hidden md:block">
        <div class="reveal max-w-xs rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-soft" data-anim="slide-up">
          <p class="font-semibold text-ink">¡Hola! 👋 Aquí no hay robots, solo personas listas para ayudarte.</p>
          <p class="mt-1 text-xs text-slate-500">Asistente • Ahora</p>
        </div>
      </div>
      <a
        href="https://wa.me/56912345678"
        class="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-soft transition hover:-translate-y-0.5 md:inline-flex"
      >
        Tengo una pregunta sobre los servicios
      </a>
      <a
        href="https://wa.me/56912345678"
        class="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:-translate-y-0.5 md:inline-flex"
      >
        Soy cliente y necesito ayuda
      </a>
      <a
        href="https://wa.me/56912345678"
        class="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-soft transition hover:scale-105"
        aria-label="Contactar por WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.52 15.23L2 22l4.92-1.48A10 10 0 1 0 12 2Zm5.5 14.2c-.23.64-1.18 1.23-1.63 1.28-.44.05-.99.08-1.6-.1-.37-.12-.86-.28-1.48-.56-2.6-1.13-4.29-3.75-4.42-3.92-.13-.17-1.06-1.42-1.06-2.7 0-1.28.67-1.92.91-2.18.23-.26.51-.32.68-.32.17 0 .34 0 .5.01.16.01.37-.06.58.44.23.55.79 1.92.86 2.06.07.14.11.31.02.5-.09.19-.13.31-.26.48-.13.17-.27.38-.38.51-.13.15-.26.31-.11.59.15.29.68 1.12 1.46 1.81 1 .89 1.84 1.17 2.13 1.31.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.64.77 1.92.91.28.14.46.21.53.33.07.12.07.69-.16 1.33Z"/>
        </svg>
      </a>
    </div>

    <!-- COMPONENTE: FOOTER -->
    <footer class="bg-blue-950 py-12 text-white">
      <div class="mx-auto max-w-6xl px-6">
        <div class="grid gap-12 md:grid-cols-3">
          <div class="reveal" data-anim="fade">
            <div class="flex items-center gap-2">
              <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <span class="text-2xl font-bold">Gasfiter</span>
            </div>
            <p class="mt-4 text-sm text-blue-200">
              <!-- CAMBIO FACIL: DESCRIPCION FOOTER -->
              Servicios profesionales de gasfitería con certificación SEC y garantía en todos nuestros trabajos.
            </p>
          </div>
          <div class="reveal" data-anim="fade">
            <h3 class="text-xl font-semibold text-accent">Contacto</h3>
            <div class="mt-4 space-y-3 text-sm text-blue-100">
              <p><!-- <Replace with Phone> -->+56 9 1234 5678</p>
              <p><!-- <Replace with WhatsApp> -->WhatsApp: +56 9 1234 5678</p>
              <p><!-- <Replace with Hours> -->Lun-Vie: 8:00-20:00, Sáb: 9:00-18:00</p>
            </div>
          </div>
          <div class="reveal" data-anim="fade">
            <h3 class="text-xl font-semibold text-accent">Enlaces Rápidos</h3>
            <div class="mt-4 space-y-2 text-sm text-blue-100">
              <a class="block transition hover:text-accent" href="#servicios">Servicios</a>
              <a class="block transition hover:text-accent" href="#testimonios">Testimonios</a>
              <a class="block transition hover:text-accent" href="#faq">Preguntas Frecuentes</a>
              <a class="block transition hover:text-accent" href="#contacto">Solicitar Cotización</a>
            </div>
          </div>
        </div>
        <p class="mt-10 border-t border-blue-800 pt-6 text-center text-xs text-blue-200">
          © 2025 Gasfiter. Todos los derechos reservados. <span class="text-blue-100">Web diseñada por Focus Web Chile.</span>
        </p>
      </div>
    </footer>
`;

export default function LandingFallback({ showNotice }: LandingFallbackProps) {
  return (
    <div className="bg-atmosphere text-ink">
      {showNotice ? (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
          Agrega <span className="font-semibold">NEXT_PUBLIC_BUILDER_API_KEY</span> en tu entorno
          para habilitar la edición en Builder.io.
        </div>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: landingHtml }} />
    </div>
  );
}

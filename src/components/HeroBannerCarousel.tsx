import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * HeroBannerCarousel — carrossel de banners no topo da Landing.
 *
 * REGRA DE OURO (evita corte): o container do slide tem a proporção
 * EXATA da imagem. Com isso, object-cover não corta nada.
 *   - desktop: 16:9 (banners cadastrados em 3840×2160)
 *   - mobile : 4:5 (versões retrato 3240×4050) via <picture>
 * Se o banner não tiver versão mobile, usamos 16:9 também no celular
 * (a desktop encaixa sem corte).
 *
 * Largura limitada a max-w-7xl (alinha com o resto da landing) → altura
 * fica ~675px no desktop, sem dominar o viewport. Vazio = não renderiza.
 */

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  image_url_mobile: string | null;
  cta_label: string;
  cta_link: string;
  link_target: "same" | "new";
  audience: "all" | "visitors" | "free" | "paid";
  ordem: number;
}

interface HeroBannerCarouselProps {
  /** Filtro de público. 'visitors' = não logado (Landing pública). */
  audience?: "visitors" | "free" | "paid";
  /** Intervalo de autoplay em ms. 0 = desativado. Default 6000. */
  autoplayMs?: number;
}

export default function HeroBannerCarousel({
  audience = "visitors",
  autoplayMs = 6000,
}: HeroBannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("landing_banners")
        .select("id, title, subtitle, image_url, image_url_mobile, cta_label, cta_link, link_target, audience, ordem")
        .order("ordem", { ascending: true });
      if (cancelled) return;
      if (error) { setBanners([]); return; }
      const filtered = (data as Banner[]).filter((b) => b.audience === "all" || b.audience === audience);
      setBanners(filtered);
    })();
    return () => { cancelled = true; };
  }, [audience]);

  useEffect(() => {
    if (!banners || banners.length < 2 || autoplayMs <= 0 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, autoplayMs);
    return () => window.clearInterval(t);
  }, [banners, autoplayMs, paused]);

  // Garante que o index nunca fica fora do range se a lista mudar
  useEffect(() => {
    if (banners && index >= banners.length) setIndex(0);
  }, [banners, index]);

  const current = useMemo(() => (banners && banners[index]) || null, [banners, index]);

  if (!banners || banners.length === 0 || !current) return null;

  const goBanner = (b: Banner) => {
    if (b.link_target === "new") {
      window.open(b.cta_link, "_blank", "noopener,noreferrer");
      return;
    }
    if (b.cta_link.startsWith("/")) navigate(b.cta_link);
    else window.location.href = b.cta_link;
  };

  const goTo = (i: number) => setIndex(((i % banners.length) + banners.length) % banners.length);

  // Proporção do container = proporção da imagem (sem corte).
  const hasMobile = !!current.image_url_mobile;
  const aspectClass = hasMobile ? "aspect-[4/5] sm:aspect-[16/9]" : "aspect-[16/9]";

  return (
    <section className="w-full px-4 sm:px-6 md:px-10 pt-5 sm:pt-7" aria-label="Destaques">
      <div className="max-w-7xl mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-[0_10px_40px_-14px_rgba(0,61,50,0.45)] ring-1 ring-black/5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-roledescription="carousel"
        >
          {/* Slide atual — a imagem É o banner inteiro, clicável.
              key força fade entre slides. */}
          <button
            key={current.id}
            type="button"
            onClick={() => goBanner(current)}
            aria-label={current.cta_label || current.title || "Abrir banner"}
            className={`relative block w-full ${aspectClass} animate-fade-in cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold/60 focus-visible:ring-inset`}
          >
            <picture>
              {current.image_url_mobile && (
                <source media="(max-width: 639px)" srcSet={current.image_url_mobile} />
              )}
              <img
                src={current.image_url}
                alt={current.title ?? current.subtitle ?? "Banner promocional"}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </picture>
          </button>

          {/* Controles — só com >1 banner */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => goTo(index - 1)}
                aria-label="Banner anterior"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => goTo(index + 1)}
                aria-label="Próximo banner"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div
                className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-2.5 py-1.5 rounded-full bg-black/25 backdrop-blur-sm"
                role="tablist"
                aria-label="Selecionar banner"
              >
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Ir para banner ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * HeroBannerCarousel — carrossel de banners no topo da Landing.
 *
 * Le `landing_banners` direto (RLS publica permite ativos dentro da janela).
 * Filtra por audience client-side ('visitors' default na Landing publica).
 * Autoplay 5s, prev/next, dots. Links abrem na mesma aba se link_target='same'.
 *
 * Vazio = nao renderiza nada (graceful, nao quebra layout).
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
  /** Filtro de publico. 'visitors' = nao logado (Landing publica). */
  audience?: "visitors" | "free" | "paid";
  /** Intervalo de autoplay em ms. 0 = desativado. Default 5000. */
  autoplayMs?: number;
}

export default function HeroBannerCarousel({
  audience = "visitors",
  autoplayMs = 5000,
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

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 aspect-[4/5] sm:aspect-[16/9] max-h-[65vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Slide atual — imagem É o banner inteiro, clicavel.
          Texto/CTA devem estar embutidos na arte. Title/subtitle/cta_label
          do CRM viram alt/aria-label para acessibilidade, nao overlay. */}
      <button
        key={current.id}
        type="button"
        onClick={() => goBanner(current)}
        aria-label={current.cta_label || current.title || "Abrir banner"}
        className="absolute inset-0 animate-fade-in cursor-pointer block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-inset"
      >
        {/* <picture> entrega image_url_mobile em viewports <=640px se cadastrada;
            cai para image_url em desktops e como fallback. */}
        <picture>
          {current.image_url_mobile && (
            <source media="(max-width: 640px)" srcSet={current.image_url_mobile} />
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

      {/* Controles — só aparecem se houver >1 banner */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            aria-label="Banner anterior"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            aria-label="Próximo banner"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5"
            role="tablist"
            aria-label="Selecionar banner"
          >
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir para banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

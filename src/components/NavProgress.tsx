import { useEffect, useRef, useState } from "react";

/**
 * Barra de progresso fina no topo (estilo YouTube/Vercel).
 *
 * Aparece durante transições de rota — enquanto o chunk lazy da próxima
 * página carrega — e some suave quando termina. Funciona em conjunto com
 * o `useDeferredValue` no App: a página antiga continua visível (sem flash
 * de tela branca) e esta barra dá o feedback de "carregando".
 *
 * Só aparece se a transição passar de ~160ms — navegações instantâneas
 * (chunk já em cache) não piscam nada, evitando flicker.
 */
export default function NavProgress({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const timers: number[] = [];
    if (active) {
      // Atraso antes de mostrar: navegações rápidas terminam antes disso e
      // nunca exibem a barra.
      timers.push(
        window.setTimeout(() => {
          started.current = true;
          setVisible(true);
          setProgress(8);
          // Sobe gradualmente até ~85% enquanto o chunk carrega (nunca chega
          // a 100% antes de concluir — sensação de progresso real).
          timers.push(window.setTimeout(() => setProgress(42), 120));
          timers.push(window.setTimeout(() => setProgress(68), 320));
          timers.push(window.setTimeout(() => setProgress(85), 760));
        }, 160),
      );
    } else if (started.current) {
      // Conclui: completa a barra e desaparece suavemente.
      started.current = false;
      setProgress(100);
      timers.push(window.setTimeout(() => setVisible(false), 220));
      timers.push(window.setTimeout(() => setProgress(0), 440));
    }
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #006D5B 0%, #00A88E 55%, #C9A84C 100%)",
          boxShadow: "0 0 10px rgba(0,109,91,0.55), 0 0 4px rgba(201,168,76,0.5)",
          opacity: visible ? 1 : 0,
          borderRadius: "0 3px 3px 0",
          transition: "width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
        }}
      />
    </div>
  );
}

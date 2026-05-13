import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Sparkles, Trophy, MapPin } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

// ─── Setores da roleta (visual — independentes da probabilidade real do servidor) ───
// Repetimos os prêmios pra dar a sensação de roleta com muitas casinhas.
// O ângulo final é calculado pra cair no setor do prêmio sorteado.
interface Sector {
  prize: "desconto_20" | "desconto_30" | "desconto_50" | "mensal_gratis";
  label: string;
  color: string;
  text: string;
}
const SECTORS: Sector[] = [
  { prize: "desconto_20",   label: "20% off",       color: "#C9A84C", text: "#1A1815" },
  { prize: "desconto_30",   label: "30% off",       color: "#1B5E3B", text: "#fff" },
  { prize: "desconto_50",   label: "50% off",       color: "#0F4128", text: "#fff" },
  { prize: "desconto_20",   label: "20% off",       color: "#C9A84C", text: "#1A1815" },
  { prize: "desconto_30",   label: "30% off",       color: "#1B5E3B", text: "#fff" },
  { prize: "mensal_gratis", label: "1 mês grátis!", color: "#7B2D8E", text: "#fff" },
  { prize: "desconto_20",   label: "20% off",       color: "#C9A84C", text: "#1A1815" },
  { prize: "desconto_50",   label: "50% off",       color: "#0F4128", text: "#fff" },
];

// ─── Form state ─────────────────────────────────────────────────────
interface FormData {
  email: string;
  full_name: string;
  password: string;
  faculdade: string;
  phone: string;
}

interface SpinResult {
  prize: string;
  prize_label: string;
  checkout_url?: string | null;
  redemption_code: string;
  alreadySpun?: boolean;
}

type Phase = "form" | "ready" | "spinning" | "result";

export default function SemanaItajuba() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<FormData>({
    email: "", full_name: "", password: "", faculdade: "", phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [rotation, setRotation] = useState(0);

  // ─── Cadastro ─────────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (form.password.length < 6) {
      toast({ title: "Senha curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Tenta cadastrar
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            faculdade: form.faculdade.trim(),
            phone: form.phone.trim(),
            utm_source: "semana-itajuba",
            utm_campaign: "roleta",
          },
          emailRedirectTo: `${window.location.origin}/menu`,
        },
      });

      if (error) {
        // Se o email já existe, tenta logar com a senha pra associar à roleta
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
          const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email: form.email.trim().toLowerCase(),
            password: form.password,
          });
          if (signinError) {
            toast({
              title: "Email já cadastrado",
              description: "Use a senha da sua conta existente para participar.",
              variant: "destructive",
            });
            setSubmitting(false);
            return;
          }
          setUserId(signinData.user?.id ?? null);
        } else {
          throw error;
        }
      } else {
        setUserId(data.user?.id ?? null);
      }

      setPhase("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao cadastrar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Girar a roleta ───────────────────────────────────────────────
  const handleSpin = async () => {
    if (phase !== "ready") return;
    setPhase("spinning");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roulette-spin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            full_name: form.full_name,
            faculdade: form.faculdade,
            phone: form.phone,
            user_id: userId,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Falha na roleta" }));
        throw new Error(err.error || "Falha na roleta");
      }

      const data: SpinResult = await resp.json();

      // Encontra um setor visual que combine com o prêmio
      const matchingIndices = SECTORS
        .map((s, i) => s.prize === data.prize ? i : -1)
        .filter((i) => i >= 0);
      const targetIdx = matchingIndices[Math.floor(Math.random() * matchingIndices.length)] ?? 0;

      // Calcula rotação final:
      // - Cada setor tem 360/8 = 45° de largura
      // - Centro do setor i: 45° * i + 22.5° (a partir do topo, sentido horário)
      // - Pointer (seta) aponta pro TOPO, então rotação deve trazer o centro do setor pro topo
      // - 8 voltas completas + posição final pra animação dramática
      const sectorAngle = 360 / SECTORS.length;
      const targetCenter = targetIdx * sectorAngle + sectorAngle / 2;
      // Pra "trazer" o setor pro topo (0°), giramos em sentido negativo
      const baseSpins = 8 * 360;
      const finalRotation = baseSpins + (360 - targetCenter);
      setRotation(finalRotation);

      // Espera animação CSS (4.5s) antes de mostrar resultado
      setTimeout(() => {
        setResult(data);
        setPhase("result");
      }, 4500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na roleta";
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setPhase("ready");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="PreceptorMED" className="h-7 w-7" />
            <span className="text-lg font-bold text-emerald-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
              PreceptorMED
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Semana Médica · FM Itajubá
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {phase === "form" && (
          <SignupSection form={form} setForm={setForm} submitting={submitting} onSubmit={handleSignup} />
        )}

        {(phase === "ready" || phase === "spinning") && (
          <SpinSection
            rotation={rotation}
            spinning={phase === "spinning"}
            onSpin={handleSpin}
            userName={form.full_name}
          />
        )}

        {phase === "result" && result && (
          <ResultSection result={result} userName={form.full_name} />
        )}
      </main>

      <footer className="border-t border-emerald-100 mt-12 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PreceptorMED · Patrocinador oficial Semana Médica FMIT
      </footer>
    </div>
  );
}

// ─── Section: Signup form ─────────────────────────────────────────
function SignupSection({
  form, setForm, submitting, onSubmit,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 mb-4">
          🎯 Especial Semana Médica de Itajubá
        </p>
        <h1
          className="text-3xl sm:text-5xl font-bold text-emerald-950 mb-5 leading-tight"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Cadastre-se e <span className="text-amber-600">gire a roleta</span>.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed mb-6">
          Todo participante ganha algo: desconto na assinatura, chaveiro exclusivo
          ou <strong className="text-emerald-700">1 mês grátis</strong> do PreceptorMED.
        </p>
        <div className="space-y-3 text-sm">
          {[
            { icon: <Gift className="h-4 w-4 text-amber-600" />, txt: "Chaveiro PreceptorMED no estande" },
            { icon: <Sparkles className="h-4 w-4 text-emerald-700" />, txt: "Cupom de 30% ou 50% off" },
            { icon: <Trophy className="h-4 w-4 text-purple-700" />, txt: "1 mês grátis na conta — sorteado!" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white border border-slate-100 grid place-items-center shadow-sm">
                {b.icon}
              </div>
              <span className="text-slate-700">{b.txt}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-emerald-900 mb-1" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Cadastro rápido
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Vamos criar sua conta no PreceptorMED. Você ganha um spin grátis na roleta.
        </p>
        <Field label="Nome completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Field label="Senha (mínimo 6 caracteres)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required minLength={6} />
        <Field label="Faculdade" value={form.faculdade} onChange={(v) => setForm({ ...form, faculdade: v })} placeholder="FMIT" />
        <Field label="WhatsApp (opcional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(35) 99999-9999" />

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white py-3.5 rounded-xl font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {submitting ? "Criando conta..." : "Cadastrar e girar a roleta"}
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          Ao continuar, você concorda com nossos{" "}
          <Link to="/termos" className="underline">Termos</Link> e{" "}
          <Link to="/privacidade" className="underline">Privacidade</Link>.
        </p>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required = false, placeholder, minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
      />
    </div>
  );
}

// ─── Section: Wheel ─────────────────────────────────────────────────
function SpinSection({
  rotation, spinning, onSpin, userName,
}: {
  rotation: number;
  spinning: boolean;
  onSpin: () => void;
  userName: string;
}) {
  const radius = 180;
  const cx = 200, cy = 200;
  const sectorAngle = 360 / SECTORS.length;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700 mb-3">
        Tudo pronto, {userName.split(" ")[0]}!
      </p>
      <h2
        className="text-3xl sm:text-4xl font-bold text-emerald-950 mb-3"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        Clica em <span className="text-amber-600">GIRAR</span> e veja seu prêmio
      </h2>
      <p className="text-sm text-slate-600 mb-8">Você tem direito a um único giro.</p>

      <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] mb-8">
        {/* Pointer no topo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <svg width="36" height="42" viewBox="0 0 36 42">
            <path d="M18 42 L4 12 Q4 0 18 4 Q32 0 32 12 Z" fill="#1A1815" stroke="#fff" strokeWidth="2" />
            <circle cx="18" cy="14" r="4" fill="#C9A84C" />
          </svg>
        </div>

        {/* Wheel SVG */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {SECTORS.map((sector, i) => {
            const startAngle = i * sectorAngle - 90;
            const endAngle = (i + 1) * sectorAngle - 90;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            const largeArc = sectorAngle > 180 ? 1 : 0;
            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            // Centro do label
            const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
            const labelR = radius * 0.65;
            const lx = cx + labelR * Math.cos(midAngle);
            const ly = cy + labelR * Math.sin(midAngle);
            const labelRotation = (startAngle + endAngle) / 2 + 90;

            return (
              <g key={i}>
                <path d={path} fill={sector.color} stroke="#fff" strokeWidth="2" />
                <text
                  x={lx}
                  y={ly}
                  fill={sector.text}
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${labelRotation}, ${lx}, ${ly})`}
                  style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.01em" }}
                >
                  {sector.label}
                </text>
              </g>
            );
          })}
          {/* Center hub */}
          <circle cx={cx} cy={cy} r="32" fill="#fff" stroke="#1B5E3B" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="8" fill="#C9A84C" />
        </svg>
      </div>

      <button
        onClick={onSpin}
        disabled={spinning}
        className="bg-gradient-to-r from-amber-500 to-amber-700 text-white px-12 py-4 rounded-full text-lg font-bold shadow-2xl shadow-amber-300/50 hover:shadow-amber-300/80 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait flex items-center gap-3"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        {spinning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        {spinning ? "Girando..." : "GIRAR"}
      </button>
    </div>
  );
}

// ─── Section: Result ───────────────────────────────────────────────
function ResultSection({
  result, userName,
}: {
  result: SpinResult;
  userName: string;
}) {
  type Config = {
    emoji: string;
    color: string;
    title: string;
    body: string;
    cta: { label: string; href?: string; isExternal?: boolean } | null;
  };

  const config: Config = (() => {
    switch (result.prize) {
      case "mensal_gratis":
        return {
          emoji: "🏆",
          color: "from-purple-600 to-purple-900",
          title: "PARABÉNS! 1 mês grátis!",
          body: "Você ganhou 1 mês completo de acesso ao PreceptorMED. Nossa equipe vai ativar manualmente na sua conta em até 24h — fique de olho no email.",
          cta: null,
        };
      case "desconto_50":
        return {
          emoji: "🎯",
          color: "from-emerald-800 to-emerald-950",
          title: "50% off no plano anual!",
          body: "O maior desconto do evento! Aproveite agora — o desconto fica disponível só pra você por tempo limitado.",
          cta: { label: "Garantir 50% off agora →", href: result.checkout_url || undefined, isExternal: true },
        };
      case "desconto_30":
        return {
          emoji: "💸",
          color: "from-emerald-700 to-emerald-900",
          title: "30% off no plano anual!",
          body: "Desconto exclusivo da Semana Médica de Itajubá. Clica abaixo pra completar a assinatura.",
          cta: { label: "Garantir 30% off agora →", href: result.checkout_url || undefined, isExternal: true },
        };
      case "desconto_20":
      default:
        return {
          emoji: "💰",
          color: "from-amber-600 to-amber-800",
          title: "20% off no plano anual!",
          body: "Todo participante ganha algo. Aproveite seu desconto e leve PreceptorMED por 12 meses.",
          cta: { label: "Garantir 20% off agora →", href: result.checkout_url || undefined, isExternal: true },
        };
    }
  })();

  return (
    <div className="max-w-xl mx-auto">
      <div className={`rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br ${config.color}`}>
        <div className="text-center px-6 sm:px-12 py-10 text-white">
          <div className="text-7xl mb-4">{config.emoji}</div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80 mb-3">
            Você ganhou
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {config.title}
          </h2>
          <p className="text-sm sm:text-base opacity-90 leading-relaxed mb-6 max-w-md mx-auto">
            {config.body}
          </p>

          {/* Mensal grátis — mostra código de referência pra equipe ativar */}
          {result.prize === "mensal_gratis" && (
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 mb-6 max-w-sm mx-auto">
              <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2 flex items-center justify-center gap-1.5">
                <MapPin className="h-3 w-3" /> Código de referência
              </p>
              <code className="text-2xl font-mono font-bold tracking-wide uppercase">{result.redemption_code}</code>
              <p className="text-[11px] opacity-70 mt-2">Guarde esse código. Pode ser pedido pelo suporte.</p>
            </div>
          )}

          {config.cta && config.cta.href && (
            <a
              href={config.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              {config.cta.label}
            </a>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        {result.alreadySpun
          ? "Você já tinha participado da roleta — esse é o seu prêmio."
          : `Bom evento, ${userName.split(" ")[0]}! 🎓`}
      </p>
    </div>
  );
}

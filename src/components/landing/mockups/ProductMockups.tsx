import { useId, ReactNode } from 'react';

/**
 * Mockups de produto em SVG puro — "prints" vetoriais on-brand da plataforma.
 *
 * Por que SVG: nítido em qualquer DPI, pesa quase nada (inline, sem rede —
 * preserva o ganho de performance mobile) e usa os tokens EXATOS do design
 * system. Um <Frame> compartilhado (chrome de janela + topbar + tag) mantém os
 * quatro mockups na mesma família visual.
 *
 * viewBox fixo 360×300; escalam via className do container (w-full h-auto).
 */

const C = {
  primary: '#006D5B',
  dark: '#005344',
  darker: '#003D32',
  gold: '#C9A84C',
  goldDeep: '#A8862E',
  ink: '#191C1D',
  ink2: '#3E4945',
  ink3: '#6E7975',
  ink4: '#9AA2A1',
  hairline: '#E7E8E9',
  border: '#E2E6E5',
  s2: '#FAFBFA',
  s3: '#F3F4F5',
  red: '#E5705F',
  amber: '#D9A441',
  green: '#3FB58F',
} as const;

const MONO = 'Manrope, sans-serif';
const BODY = 'Inter, sans-serif';

function Frame({
  title,
  tag,
  tagTone = 'gold',
  label,
  children,
}: {
  title: string;
  tag?: string;
  tagTone?: 'gold' | 'red' | 'green';
  label: string;
  children: ReactNode;
}) {
  const uid = useId().replace(/[:]/g, '');
  const tones = {
    gold: { bg: 'rgba(201,168,76,0.16)', fg: C.goldDeep },
    red: { bg: 'rgba(229,112,95,0.16)', fg: '#C0533F' },
    green: { bg: 'rgba(0,109,91,0.10)', fg: C.primary },
  }[tagTone];
  const tagW = tag ? tag.length * 6.2 + 22 : 0;

  return (
    <svg
      viewBox="0 0 360 300"
      className="w-full h-auto"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`sh${uid}`} x="-15%" y="-15%" width="130%" height="135%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor={C.primary} floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Chrome da janela */}
      <g filter={`url(#sh${uid})`}>
        <rect x="16" y="16" width="328" height="268" rx="18" fill="#FFFFFF" stroke={C.hairline} />
      </g>

      {/* Topbar — semáforo + título + tag */}
      <circle cx="37" cy="41" r="4" fill={C.red} />
      <circle cx="51" cy="41" r="4" fill={C.amber} />
      <circle cx="65" cy="41" r="4" fill={C.green} />
      <text x="86" y="45" fontFamily={MONO} fontSize="12" fontWeight="700" fill={C.ink2}>
        {title}
      </text>
      {tag && (
        <>
          <rect x={328 - tagW} y="32" width={tagW} height="18" rx="9" fill={tones.bg} />
          <text
            x={328 - tagW / 2}
            y="44.5"
            textAnchor="middle"
            fontFamily={MONO}
            fontSize="9.5"
            fontWeight="800"
            fill={tones.fg}
          >
            {tag}
          </text>
        </>
      )}
      <line x1="16" y1="61" x2="344" y2="61" stroke={C.hairline} />

      {children}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   1) Flashcards — revisão com SM-2
   ───────────────────────────────────────────────────────────── */
export function FlashcardMockup({ className = '' }: { className?: string }) {
  const btns = [
    { x: 40, w: 64, label: 'De novo', bg: '#FCEEEC', stroke: '#F0C9C2', fg: '#C0533F', solid: false },
    { x: 112, w: 64, label: 'Difícil', bg: '#FBF3E3', stroke: '#EAD7A6', fg: C.goldDeep, solid: false },
    { x: 184, w: 64, label: 'Bom', bg: C.primary, stroke: C.primary, fg: '#FFFFFF', solid: true },
    { x: 256, w: 64, label: 'Fácil', bg: '#E6F2EE', stroke: '#BFD9CE', fg: C.dark, solid: false },
  ];
  return (
    <div className={className}>
      <Frame title="Flashcards · Cardiologia" tag="SM-2" tagTone="gold" label="Revisão de flashcards com repetição espaçada SM-2">
        {/* deck — profundidade */}
        <rect x="58" y="84" width="244" height="100" rx="12" fill={C.s3} />
        <rect x="49" y="78" width="262" height="106" rx="12" fill={C.s2} stroke={C.hairline} />
        {/* carta da frente */}
        <rect x="40" y="72" width="280" height="112" rx="12" fill="#FFFFFF" stroke={C.border} />
        <text x="56" y="95" fontFamily={MONO} fontSize="8.5" fontWeight="800" letterSpacing="1.6" fill={C.gold}>
          PERGUNTA
        </text>
        <text x="56" y="114" fontFamily={BODY} fontSize="12.5" fontWeight="600" fill={C.ink}>
          Qual classe reduz mortalidade na
        </text>
        <text x="56" y="131" fontFamily={BODY} fontSize="12.5" fontWeight="600" fill={C.ink}>
          ICFEr além de IECA e betabloqueador?
        </text>
        <line x1="56" y1="143" x2="304" y2="143" stroke={C.hairline} strokeDasharray="3 3" />
        <text x="56" y="161" fontFamily={MONO} fontSize="8.5" fontWeight="800" letterSpacing="1.6" fill={C.primary}>
          RESPOSTA
        </text>
        <text x="56" y="178" fontFamily={BODY} fontSize="11.5" fill={C.ink2}>
          Antagonista da aldosterona (espironolactona).
        </text>
        {/* botões de dificuldade */}
        {btns.map((b) => (
          <g key={b.label}>
            <rect x={b.x} y="206" width={b.w} height="30" rx="8" fill={b.bg} stroke={b.stroke} />
            <text
              x={b.x + b.w / 2}
              y="225"
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="10"
              fontWeight="700"
              fill={b.fg}
            >
              {b.label}
            </text>
          </g>
        ))}
        <text x="40" y="262" fontFamily={BODY} fontSize="10" fill={C.ink3}>
          Próxima revisão em{' '}
          <tspan fontFamily={MONO} fontWeight="800" fill={C.dark}>
            4 dias
          </tspan>{' '}
          · intervalo pela sua resposta
        </text>
      </Frame>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2) Chat com PubMed citado
   ───────────────────────────────────────────────────────────── */
export function ChatPubMedMockup({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Frame title="Chat · PreceptorMED" tag="PubMed" tagTone="green" label="Chat com IA que cita artigos do PubMed">
        {/* bolha do usuário (direita) */}
        <rect x="150" y="74" width="170" height="42" rx="12" fill="#FBF6E6" stroke="#EAD7A6" />
        <text x="306" y="91" textAnchor="end" fontFamily={BODY} fontSize="11.5" fontWeight="600" fill={C.ink}>
          Tratamento de 1ª linha
        </text>
        <text x="306" y="106" textAnchor="end" fontFamily={BODY} fontSize="11.5" fontWeight="600" fill={C.ink}>
          da ICFEr?
        </text>
        {/* avatar IA */}
        <circle cx="50" cy="134" r="11" fill={C.primary} />
        <text x="50" y="138" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="800" fill="#FFFFFF">
          P
        </text>
        {/* bolha da IA (esquerda) */}
        <rect x="68" y="124" width="252" height="138" rx="12" fill="#FFFFFF" stroke={C.border} />
        <text x="84" y="146" fontFamily={BODY} fontSize="11.5" fill={C.ink}>
          <tspan fontWeight="700" fill={C.dark}>IECA/BRA + betabloqueador</tspan> +
        </text>
        <text x="84" y="162" fontFamily={BODY} fontSize="11.5" fill={C.ink}>
          antagonista da aldosterona reduzem
        </text>
        <text x="84" y="178" fontFamily={BODY} fontSize="11.5" fill={C.ink}>
          mortalidade na ICFEr.
        </text>
        {/* chip PubMed */}
        <rect x="84" y="192" width="88" height="20" rx="10" fill="rgba(0,109,91,0.09)" />
        <path
          d="M95 202 h7 v7 M102 202 l-9 9 M93 199 h5 v5"
          fill="none"
          stroke={C.primary}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="111" y="206" fontFamily={MONO} fontSize="9.5" fontWeight="800" fill={C.primary}>
          PubMed
        </text>
        {/* referência citada */}
        <line x1="84" y1="224" x2="304" y2="224" stroke={C.hairline} />
        <text x="84" y="240" fontFamily={BODY} fontSize="9" fill={C.ink4}>
          Ponikowski P, et al.
        </text>
        <text x="84" y="252" fontFamily={BODY} fontSize="9" fill={C.ink4}>
          Eur Heart J. 2016;37(27):2129–200.
        </text>
      </Frame>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3) Simulado ENAMED
   ───────────────────────────────────────────────────────────── */
export function SimuladoMockup({ className = '' }: { className?: string }) {
  const opts = [
    { y: 132, l: 'A', t: 'Suspender losartana e iniciar furosemida' },
    { y: 166, l: 'B', t: 'Corticoide em dose imunossupressora' },
    { y: 200, l: 'C', t: 'Otimizar SRAA + iSGLT2 + controle glicêmico', correct: true },
    { y: 234, l: 'D', t: 'Encaminhar para hemodiálise programada' },
  ];
  return (
    <div className={className}>
      <Frame title="Simulado ENAMED" tag="Alta dificuldade" tagTone="red" label="Questão de simulado no padrão ENAMED com gabarito">
        {/* progresso */}
        <text x="36" y="84" fontFamily={MONO} fontSize="9.5" fontWeight="700" fill={C.ink3}>
          QUESTÃO 12 / 40
        </text>
        <rect x="232" y="77" width="92" height="6" rx="3" fill={C.s3} />
        <rect x="232" y="77" width="28" height="6" rx="3" fill={C.primary} />
        {/* enunciado */}
        <text x="36" y="104" fontFamily={BODY} fontSize="11" fill={C.ink}>
          Mulher, 58a, HAS e DM2, creatinina 2,1 (prévia 1,3),
        </text>
        <text x="36" y="119" fontFamily={BODY} fontSize="11" fill={C.ink}>
          proteinúria 4,2g/24h. Conduta mais apropriada?
        </text>
        {/* alternativas */}
        {opts.map((o) => (
          <g key={o.l}>
            <rect
              x="36"
              y={o.y}
              width="288"
              height="28"
              rx="8"
              fill={o.correct ? '#E6F2EE' : '#FFFFFF'}
              stroke={o.correct ? C.primary : C.hairline}
            />
            <circle cx="52" cy={o.y + 14} r="9" fill={o.correct ? C.primary : C.s3} />
            <text
              x="52"
              y={o.y + 18}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="10"
              fontWeight="800"
              fill={o.correct ? '#FFFFFF' : C.ink3}
            >
              {o.l}
            </text>
            <text
              x="70"
              y={o.y + 18}
              fontFamily={BODY}
              fontSize="10.5"
              fontWeight={o.correct ? 600 : 400}
              fill={o.correct ? C.dark : C.ink2}
            >
              {o.t}
            </text>
          </g>
        ))}
        {/* check do correto */}
        <path
          d="M300 212 l5 5 l9 -10"
          fill="none"
          stroke={C.primary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Frame>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4) Sua evolução — gamificação + desempenho
   ───────────────────────────────────────────────────────────── */
export function EvolucaoMockup({ className = '' }: { className?: string }) {
  const uid = useId().replace(/[:]/g, '');
  const pts = [
    [52, 196],
    [96, 190],
    [140, 172],
    [184, 178],
    [228, 152],
    [272, 140],
    [312, 126],
  ];
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const area = `${line} L312 232 L52 232 Z`;
  const chips = [
    { x: 36, w: 90, k: 'Acerto', v: '78%' },
    { x: 135, w: 90, k: 'XP', v: '2.4k' },
    { x: 234, w: 90, k: 'Nível', v: '5' },
  ];
  return (
    <div className={className}>
      <Frame title="Sua evolução" tag="Sequência 14d" tagTone="gold" label="Painel de evolução: acerto, XP, nível e sequência de estudo">
        <defs>
          <linearGradient id={`area${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* chips de stats */}
        {chips.map((c) => (
          <g key={c.k}>
            <rect x={c.x} y="74" width={c.w} height="34" rx="9" fill={C.s2} stroke={C.hairline} />
            <text x={c.x + 12} y="89" fontFamily={MONO} fontSize="8.5" fontWeight="700" letterSpacing="0.8" fill={C.ink3}>
              {c.k.toUpperCase()}
            </text>
            <text x={c.x + 12} y="102" fontFamily={MONO} fontSize="14" fontWeight="800" fill={C.dark}>
              {c.v}
            </text>
          </g>
        ))}
        {/* grid lines */}
        {[140, 172, 204].map((y) => (
          <line key={y} x1="36" y1={y} x2="324" y2={y} stroke={C.hairline} strokeDasharray="2 4" />
        ))}
        {/* área + linha */}
        <path d={area} fill={`url(#area${uid})`} />
        <path d={line} fill="none" stroke={C.primary} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* pontos */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={i === pts.length - 1 ? 4.5 : 3}
            fill={i === pts.length - 1 ? C.gold : '#FFFFFF'}
            stroke={i === pts.length - 1 ? C.goldDeep : C.primary}
            strokeWidth="2"
          />
        ))}
        {/* eixo x */}
        <text x="52" y="250" fontFamily={BODY} fontSize="8.5" fill={C.ink4}>
          Sem 1
        </text>
        <text x="312" y="250" textAnchor="end" fontFamily={BODY} fontSize="8.5" fill={C.ink4}>
          Sem 7
        </text>
        <text x="36" y="272" fontFamily={BODY} fontSize="9.5" fill={C.ink3}>
          Taxa de acerto subindo —{' '}
          <tspan fontFamily={MONO} fontWeight="800" fill={C.primary}>
            +18% em 7 semanas
          </tspan>
        </text>
      </Frame>
    </div>
  );
}

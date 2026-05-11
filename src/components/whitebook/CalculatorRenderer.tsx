import { useMemo, useState } from "react";
import {
  create,
  evaluateDependencies,
  roundDependencies,
  logDependencies,
  log10Dependencies,
  log2Dependencies,
  minDependencies,
  maxDependencies,
  absDependencies,
  sqrtDependencies,
  powDependencies,
  numberDependencies,
} from "mathjs";
import { Sparkles, RotateCcw, AlertTriangle, BookOpen, ExternalLink } from "lucide-react";

// Configura mathjs em modo SAFE com APENAS as deps necessárias para as
// expressões dos calculadores médicos (log, round, min/max, etc).
// Reduz bundle de ~600KB (importando "all") para ~80KB.
const mj = create({
  evaluateDependencies,
  roundDependencies,
  logDependencies,
  log10Dependencies,
  log2Dependencies,
  minDependencies,
  maxDependencies,
  absDependencies,
  sqrtDependencies,
  powDependencies,
  numberDependencies,
}, {
  number: "number",
  precision: 14,
});

// Alias `toNumber` para `number` (compatibilidade com expressões legadas)
mj.import({ toNumber: (x: any) => mj.number(x) }, { override: false, silent: true });

// ────────────────────────────────────────────────────────────
// Schema da definição (espelha o JSONB salvo em wb_calculators)
// ────────────────────────────────────────────────────────────
export interface InputBoolean {
  key: string;
  label: string;
  type: "boolean";
}
export interface InputNumber {
  key: string;
  label: string;
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
export interface InputSelect {
  key: string;
  label: string;
  type: "select";
  options: Array<{ value: string; label: string }>;
}
export type InputDef = InputBoolean | InputNumber | InputSelect;

interface SumWeightedRule {
  when: { key: string } & Record<string, unknown>;
  points: number;
}
interface SumWeightedFormula {
  type: "sum_weighted";
  rules: SumWeightedRule[];
}
interface CustomExpressionFormula {
  type: "custom_expression";
  expression: string;
}
type FormulaDef = SumWeightedFormula | CustomExpressionFormula;

interface InterpretationBand {
  min: number;
  max: number;
  label: string;
  action?: string;
  color?: string;
}

export interface CalculatorDef {
  inputs: InputDef[];
  formula: FormulaDef;
  interpretation?: InterpretationBand[];
  disclaimer?: string;
}

interface Props {
  def: CalculatorDef;
  fonte?: string | null;
  fonteUrl?: string | null;
}

// ────────────────────────────────────────────────────────────
// Avaliação segura
// ────────────────────────────────────────────────────────────
function evaluateSumWeighted(
  rules: SumWeightedRule[],
  values: Record<string, unknown>,
): number {
  let total = 0;
  for (const rule of rules) {
    const condition = rule.when as Record<string, unknown>;
    const key = condition.key as string;
    if (!key) continue;
    const value = values[key];
    if (value === undefined || value === null || value === "") continue;

    let matched = true;
    if ("eq" in condition) {
      // booleans podem ser comparados como === false/true
      // selects retornam string; eq pode ser string ou boolean
      matched = matched && condition.eq === value;
    }
    if ("neq" in condition) matched = matched && condition.neq !== value;
    // Para number-style comparisons, normaliza pra Number()
    const numV = typeof value === "number" ? value : Number(value);
    if ("gte" in condition) matched = matched && numV >= (condition.gte as number);
    if ("gt" in condition)  matched = matched && numV > (condition.gt as number);
    if ("lte" in condition) matched = matched && numV <= (condition.lte as number);
    if ("lt" in condition)  matched = matched && numV < (condition.lt as number);

    if (matched) total += rule.points;
  }
  return total;
}

function evaluateExpression(
  expression: string,
  values: Record<string, unknown>,
): number | null {
  try {
    // Scope: valores do user + helpers seguros
    const scope: Record<string, unknown> = {
      // Helper pra converter selects (string) em número
      toNumber: (x: unknown) => Number(x),
    };
    for (const [k, v] of Object.entries(values)) {
      if (v === undefined || v === null || v === "") {
        scope[k] = NaN;
        continue;
      }
      if (typeof v === "boolean") {
        scope[k] = v ? 1 : 0;
      } else if (typeof v === "string") {
        scope[k] = v; // mathjs lida com string→number via toNumber()/number()
      } else {
        scope[k] = v;
      }
    }
    const result = mj.evaluate(expression, scope);
    if (typeof result === "number" && Number.isFinite(result)) return result;
    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[CalculatorRenderer] expression error:", (e as Error).message);
    return null;
  }
}

function findInterpretation(
  bands: InterpretationBand[] | undefined,
  score: number | null,
): InterpretationBand | null {
  if (!bands || score === null) return null;
  for (const b of bands) {
    if (score >= b.min && score <= b.max) return b;
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────
export default function CalculatorRenderer({ def, fonte, fonteUrl }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const allFilled = useMemo(() => {
    return def.inputs.every((inp) => {
      const v = values[inp.key];
      if (inp.type === "boolean") return typeof v === "boolean";
      if (inp.type === "select") return typeof v === "string" && v.length > 0;
      if (inp.type === "number") return typeof v === "number" && Number.isFinite(v);
      return false;
    });
  }, [def.inputs, values]);

  const score = useMemo(() => {
    if (!allFilled) return null;
    if (def.formula.type === "sum_weighted") {
      return evaluateSumWeighted(def.formula.rules, values);
    }
    if (def.formula.type === "custom_expression") {
      return evaluateExpression(def.formula.expression, values);
    }
    return null;
  }, [def.formula, values, allFilled]);

  const interpretation = useMemo(
    () => findInterpretation(def.interpretation, score),
    [def.interpretation, score],
  );

  const reset = () => setValues({});

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-['Manrope'] font-bold text-base text-[#191C1D] tracking-tight">
            Inputs
          </h2>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4a5568] hover:text-[#191C1D] hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>

        <div className="space-y-4">
          {def.inputs.map((inp) => (
            <InputRow
              key={inp.key}
              def={inp}
              value={values[inp.key]}
              onChange={(v) => setValues((s) => ({ ...s, [inp.key]: v }))}
            />
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div
        className={`rounded-2xl border-2 p-5 sm:p-6 transition-colors ${
          score === null
            ? "bg-slate-50 border-slate-200"
            : "bg-gradient-to-br from-[#005344]/5 to-[#C9A84C]/5 border-[#C9A84C]/40"
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#8a6f26]" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#8a6f26]">
            Resultado
          </span>
        </div>
        {score === null ? (
          <p className="text-sm text-[#4a5568]">
            Preencha todos os campos acima para calcular.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-3 mb-2">
              <div className="font-['Manrope'] font-bold text-5xl text-[#191C1D] tabular-nums tracking-[-0.02em]">
                {Number.isInteger(score) ? score : score.toFixed(1)}
              </div>
              {interpretation && (
                <div className="text-base font-bold text-[#005344]">
                  {interpretation.label}
                </div>
              )}
            </div>
            {interpretation?.action && (
              <p className="text-sm text-[#191C1D] leading-relaxed mt-2">
                <strong>Conduta:</strong> {interpretation.action}
              </p>
            )}
          </>
        )}
      </div>

      {/* Disclaimer + fonte */}
      {(def.disclaimer || fonte) && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
          {def.disclaimer && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-[#4a5568] leading-relaxed">
                {def.disclaimer}
              </p>
            </div>
          )}
          {fonte && (
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
              <p className="text-xs text-[#4a5568] leading-relaxed">
                <strong>Fonte:</strong> {fonte}
                {fonteUrl && (
                  <>
                    {" · "}
                    <a
                      href={fonteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#005344] hover:underline inline-flex items-center gap-0.5"
                    >
                      ver paper
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Linha de input — boolean / number / select
// ────────────────────────────────────────────────────────────
function InputRow({
  def,
  value,
  onChange,
}: {
  def: InputDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (def.type === "boolean") {
    const isYes = value === true;
    const isNo = value === false;
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <label className="text-sm text-[#191C1D] leading-snug flex-1">
          {def.label}
        </label>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onChange(false)}
            className={`px-3 h-9 rounded-lg text-xs font-semibold border transition-colors ${
              isNo
                ? "bg-slate-700 text-white border-slate-700"
                : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
            }`}
          >
            Não
          </button>
          <button
            onClick={() => onChange(true)}
            className={`px-3 h-9 rounded-lg text-xs font-semibold border transition-colors ${
              isYes
                ? "bg-[#005344] text-white border-[#005344]"
                : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
            }`}
          >
            Sim
          </button>
        </div>
      </div>
    );
  }

  if (def.type === "select") {
    return (
      <div>
        <label className="block text-sm text-[#191C1D] leading-snug mb-2">
          {def.label}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {def.options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`px-3 h-9 rounded-lg text-xs font-semibold border transition-colors ${
                  selected
                    ? "bg-[#005344] text-white border-[#005344]"
                    : "bg-white text-[#4a5568] border-slate-200 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // number
  const numVal = typeof value === "number" ? String(value) : "";
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label className="text-sm text-[#191C1D] leading-snug flex-1">
        {def.label}
        {def.unit && <span className="text-xs text-[#94a3b8] font-normal ml-1">({def.unit})</span>}
      </label>
      <input
        type="number"
        value={numVal}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange(undefined);
          const n = Number(v);
          if (Number.isFinite(n)) onChange(n);
        }}
        min={def.min}
        max={def.max}
        step={def.step ?? 1}
        className="w-32 h-9 px-3 rounded-lg border border-slate-200 text-sm text-[#191C1D] outline-none focus:border-[#005344] focus:ring-2 focus:ring-[#005344]/15 tabular-nums"
      />
    </div>
  );
}

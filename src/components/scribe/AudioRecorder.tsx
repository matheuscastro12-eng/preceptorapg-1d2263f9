import { useEffect, useRef, useState } from "react";
import {
  Mic, Pause, Play, Square, RotateCcw, AlertTriangle,
} from "lucide-react";

interface Props {
  onComplete: (blob: Blob, durationS: number) => void;
  /** Max duration em segundos. Default 30min. */
  maxDurationS?: number;
}

type State = "idle" | "recording" | "paused" | "stopped";

// Detecta melhor codec disponivel
function pickMimeType(): string {
  // Safari iOS suporta apenas mp4. Outros browsers: webm/opus eh otimo.
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return "audio/webm";
}

const AudioRecorder = ({ onComplete, maxDurationS = 30 * 60 }: Props) => {
  const [state, setState] = useState<State>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0-100 pra mini-vu-meter

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const pausedAccumS = useRef(0);
  const pauseStartedAtRef = useRef<number>(0);

  // Cleanup
  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-stop ao atingir maxDurationS
  useEffect(() => {
    if (duration >= maxDurationS && state === "recording") {
      void handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, maxDurationS, state]);

  const cleanup = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => undefined);
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  const handleStart = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup analyser pra vu-meter
      const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(buf);
          let sum = 0;
          for (const v of buf) sum += v;
          const avg = sum / buf.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          rafRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      }

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const totalS = (Date.now() - startedAtRef.current) / 1000 - pausedAccumS.current;
        cleanup();
        setState("stopped");
        onComplete(blob, Math.max(0, totalS));
      };
      recorder.start(1000); // chunk a cada 1s
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      pausedAccumS.current = 0;
      setDuration(0);
      setState("recording");

      intervalRef.current = window.setInterval(() => {
        const elapsed =
          (Date.now() - startedAtRef.current) / 1000 - pausedAccumS.current;
        setDuration(Math.floor(elapsed));
      }, 250);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("Permission") || msg.includes("denied")) {
        setError("Permissão de microfone negada. Habilite nas configurações do navegador.");
      } else if (msg.includes("NotFound") || msg.includes("Found")) {
        setError("Microfone não encontrado.");
      } else {
        setError(`Erro ao acessar microfone: ${msg}`);
      }
    }
  };

  const handlePause = () => {
    if (recorderRef.current && state === "recording") {
      recorderRef.current.pause();
      pauseStartedAtRef.current = Date.now();
      setState("paused");
    }
  };

  const handleResume = () => {
    if (recorderRef.current && state === "paused") {
      recorderRef.current.resume();
      pausedAccumS.current += (Date.now() - pauseStartedAtRef.current) / 1000;
      setState("recording");
    }
  };

  const handleStop = async () => {
    if (recorderRef.current && state !== "idle" && state !== "stopped") {
      // Garante que ainda esteja gravando antes de parar
      if (recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    }
  };

  const handleReset = () => {
    cleanup();
    chunksRef.current = [];
    recorderRef.current = null;
    setState("idle");
    setDuration(0);
    setError(null);
  };

  const m = Math.floor(duration / 60);
  const s = duration % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const maxM = Math.floor(maxDurationS / 60);
  const pctElapsed = (duration / maxDurationS) * 100;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-[0_1px_2px_rgba(25,28,29,0.04)]">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs text-red-900 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Visual: pulse circle + duration */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative w-32 h-32 mb-4">
          {/* Outer pulse */}
          {state === "recording" && (
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          )}
          {/* Main circle */}
          <div
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-colors ${
              state === "recording"
                ? "bg-red-500"
                : state === "paused"
                  ? "bg-amber-500"
                  : state === "stopped"
                    ? "bg-emerald-500"
                    : "bg-gradient-to-br from-[#005344] to-[#003D32]"
            }`}
          >
            <Mic className="w-12 h-12 text-white" />
          </div>
          {/* Mini vu-meter */}
          {state === "recording" && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-[width] duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          )}
        </div>

        <div className="font-['Manrope'] font-bold text-4xl text-[#191C1D] tabular-nums tracking-[-0.02em]">
          {mmss}
        </div>
        <p className="text-xs text-[#4a5568] mt-1">
          {state === "idle" && "Pronto para gravar"}
          {state === "recording" && (
            <span className="text-red-700 font-bold">● Gravando…</span>
          )}
          {state === "paused" && <span className="text-amber-700 font-bold">⏸ Pausado</span>}
          {state === "stopped" && <span className="text-emerald-700 font-bold">✓ Gravação concluída</span>}
        </p>

        {/* Progress bar */}
        {state !== "idle" && (
          <div className="w-full max-w-sm mt-4">
            <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-[width] duration-300 ${
                  pctElapsed > 80 ? "bg-amber-500" : "bg-[#005344]"
                }`}
                style={{ width: `${Math.min(100, pctElapsed)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#94a3b8] text-center mt-1.5 font-mono">
              limite {maxM} min
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === "idle" && (
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-colors"
          >
            <Mic className="w-5 h-5" />
            Iniciar gravação
          </button>
        )}
        {state === "recording" && (
          <>
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl border-2 border-slate-200 bg-white text-[#4a5568] font-bold hover:bg-slate-50"
            >
              <Pause className="w-4 h-4" />
              Pausar
            </button>
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#191C1D] text-white font-bold"
            >
              <Square className="w-4 h-4" />
              Encerrar
            </button>
          </>
        )}
        {state === "paused" && (
          <>
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-emerald-600 text-white font-bold"
            >
              <Play className="w-4 h-4" />
              Retomar
            </button>
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#191C1D] text-white font-bold"
            >
              <Square className="w-4 h-4" />
              Encerrar
            </button>
          </>
        )}
        {state === "stopped" && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-xl border-2 border-slate-200 bg-white text-[#4a5568] font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            Regravar
          </button>
        )}
      </div>

      <p className="text-[11px] text-[#94a3b8] text-center mt-4 leading-relaxed">
        Áudio criptografado em trânsito e em repouso. Reten&shy;ção configurada
        no seu perfil (default 30 dias). Texto SOAP fica salvo conforme CFM
        (5 anos) mesmo após áudio ser purgado.
      </p>
    </div>
  );
};

export default AudioRecorder;

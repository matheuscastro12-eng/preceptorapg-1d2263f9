import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Highlighter, MessageSquarePlus, Trash2, X, Check } from 'lucide-react';

export interface Annotation {
  id: string;
  fechamento_id: string;
  user_id: string;
  selected_text: string;
  comment: string | null;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  occurrence_index: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  /** ID do fechamento salvo no banco. Se null, anotacoes ficam desabilitadas. */
  fechamentoId: string | null;
  /** Container onde o conteudo esta renderizado. Usado para attach selecao + highlights. */
  containerRef: React.RefObject<HTMLElement>;
  /** User autenticado */
  userId: string | null;
}

const COLOR_STYLES: Record<Annotation['color'], { bg: string; border: string; name: string }> = {
  yellow: { bg: 'rgba(255, 235, 59, 0.45)', border: '#f59e0b', name: 'Amarelo' },
  green:  { bg: 'rgba(134, 239, 172, 0.45)', border: '#16a34a', name: 'Verde' },
  blue:   { bg: 'rgba(147, 197, 253, 0.45)', border: '#2563eb', name: 'Azul' },
  pink:   { bg: 'rgba(249, 168, 212, 0.45)', border: '#db2777', name: 'Rosa' },
};

/**
 * Adiciona capacidade de marca-texto e comentarios sobre o conteudo renderizado.
 * - Usuario seleciona texto -> toolbar aparece com opcoes de cor + "Adicionar comentario"
 * - Anotacoes sao persistidas em fechamento_annotations (RLS por user_id)
 * - Ao re-abrir o resumo, as anotacoes sao re-aplicadas via string match
 *
 * NAO modifica o markdown original — wraps the rendered HTML.
 */
const AnnotationLayer = ({ fechamentoId, containerRef, userId }: Props) => {
  const { toast } = useToast();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [toolbar, setToolbar] = useState<{
    x: number;
    y: number;
    selectedText: string;
    occurrenceIndex: number;
  } | null>(null);
  const [commentModal, setCommentModal] = useState<{
    selectedText: string;
    occurrenceIndex: number;
    color: Annotation['color'];
    value: string;
    existingId?: string;
  } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    annotation: Annotation;
    x: number;
    y: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Carrega anotacoes existentes
  useEffect(() => {
    if (!fechamentoId || !userId) {
      setAnnotations([]);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('fechamento_annotations')
        .select('*')
        .eq('fechamento_id', fechamentoId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[annotations] load error:', error);
        return;
      }
      setAnnotations((data ?? []) as Annotation[]);
    })();
  }, [fechamentoId, userId]);

  // Aplica highlights no DOM
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Remove highlights antigos
    container.querySelectorAll('mark[data-annotation-id]').forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
      parent.normalize();
    });

    if (annotations.length === 0) return;

    // Para cada anotacao, encontra a N-ima ocorrencia e wraps com <mark>
    for (const ann of annotations) {
      wrapOccurrence(container, ann.selected_text, ann.occurrence_index, ann);
    }
  }, [annotations, containerRef]);

  // Captura selecao de texto
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fechamentoId) return;

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setToolbar(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < 2 || text.length > 500) {
        setToolbar(null);
        return;
      }
      // Verifica se seleção está dentro do container
      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setToolbar(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      // Calcula indice da ocorrencia (qual N-ima aparicao desse texto)
      const fullText = container.textContent || '';
      const selectionStart = getCharOffsetWithinContainer(container, range.startContainer, range.startOffset);
      const occurrenceIndex = countOccurrencesBefore(fullText, text, selectionStart);

      // Toolbar usa position: fixed (viewport-relative) — NAO somar window.scrollY/X
      // porque getBoundingClientRect ja retorna em coords de viewport. Somar o scroll
      // faz o toolbar desaparecer pra fora da tela quando o usuario esta scrollado.
      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        selectedText: text,
        occurrenceIndex,
      });
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef, fechamentoId]);

  // Click em highlight abre tooltip
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark[data-annotation-id]') as HTMLElement | null;
      if (!mark) {
        setActiveTooltip(null);
        return;
      }
      const id = mark.dataset.annotationId;
      const ann = annotations.find(a => a.id === id);
      if (!ann) return;
      const rect = mark.getBoundingClientRect();
      // Tooltip tb usa position: fixed — viewport coords, sem somar scroll
      setActiveTooltip({
        annotation: ann,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [annotations, containerRef]);

  // Fecha tooltip ao clicar fora
  useEffect(() => {
    if (!activeTooltip) return;
    const handleOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        const mark = (e.target as HTMLElement).closest('mark[data-annotation-id]');
        if (!mark) setActiveTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [activeTooltip]);

  const saveAnnotation = useCallback(async (
    selectedText: string,
    occurrenceIndex: number,
    color: Annotation['color'],
    comment: string | null
  ) => {
    if (!fechamentoId || !userId) return;
    const { data, error } = await supabase
      .from('fechamento_annotations')
      .insert({
        fechamento_id: fechamentoId,
        user_id: userId,
        selected_text: selectedText,
        comment,
        color,
        occurrence_index: occurrenceIndex,
      })
      .select()
      .single();
    if (error) {
      console.error('[annotations] save error:', error);
      toast({ title: 'Erro ao salvar anotação', variant: 'destructive' });
      return;
    }
    setAnnotations(prev => [...prev, data as Annotation]);
    toast({ title: comment ? 'Comentário salvo' : 'Trecho marcado' });
    setToolbar(null);
    setCommentModal(null);
    window.getSelection()?.removeAllRanges();
  }, [fechamentoId, userId, toast]);

  const deleteAnnotation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('fechamento_annotations')
      .delete()
      .eq('id', id);
    if (error) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
      return;
    }
    setAnnotations(prev => prev.filter(a => a.id !== id));
    setActiveTooltip(null);
    toast({ title: 'Removida' });
  }, [toast]);

  if (!fechamentoId) return null;

  return (
    <>
      {/* Toolbar que aparece ao selecionar texto */}
      {toolbar && (
        <div
          className="fixed z-[60] flex items-center gap-1 bg-brand-ink text-white px-1.5 py-1.5 rounded-xl shadow-xl"
          style={{
            left: `${toolbar.x}px`,
            top: `${toolbar.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {(Object.keys(COLOR_STYLES) as Annotation['color'][]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => saveAnnotation(toolbar.selectedText, toolbar.occurrenceIndex, c, null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:ring-2 hover:ring-white/40 transition-all"
              style={{ background: COLOR_STYLES[c].bg, border: `2px solid ${COLOR_STYLES[c].border}` }}
              title={`Marcar em ${COLOR_STYLES[c].name}`}
            >
              <Highlighter className="w-3.5 h-3.5" style={{ color: COLOR_STYLES[c].border }} />
            </button>
          ))}
          <div className="w-px h-5 bg-white/20 mx-0.5" />
          <button
            type="button"
            onClick={() => setCommentModal({
              selectedText: toolbar.selectedText,
              occurrenceIndex: toolbar.occurrenceIndex,
              color: 'yellow',
              value: '',
            })}
            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-white/10 transition-colors"
            title="Adicionar comentário"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Comentar
          </button>
        </div>
      )}

      {/* Tooltip quando clica num highlight existente */}
      {activeTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[60] bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xs"
          style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y}px`, transform: 'translateX(-50%)' }}
        >
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: COLOR_STYLES[activeTooltip.annotation.color].border }}
              >
                {COLOR_STYLES[activeTooltip.annotation.color].name}
              </span>
              <button
                onClick={() => setActiveTooltip(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[13px] text-brand-ink italic line-clamp-3">
              "{activeTooltip.annotation.selected_text}"
            </p>
          </div>
          {activeTooltip.annotation.comment && (
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <p className="text-xs text-brand-ink-2 leading-relaxed whitespace-pre-wrap">
                {activeTooltip.annotation.comment}
              </p>
            </div>
          )}
          <div className="p-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setCommentModal({
                  selectedText: activeTooltip.annotation.selected_text,
                  occurrenceIndex: activeTooltip.annotation.occurrence_index,
                  color: activeTooltip.annotation.color,
                  value: activeTooltip.annotation.comment ?? '',
                  existingId: activeTooltip.annotation.id,
                });
                setActiveTooltip(null);
              }}
              className="flex-1 text-xs font-semibold text-brand-primary-dark hover:bg-brand-primary/5 py-1.5 rounded-md transition-colors"
            >
              {activeTooltip.annotation.comment ? 'Editar' : 'Comentar'}
            </button>
            <button
              type="button"
              onClick={() => deleteAnnotation(activeTooltip.annotation.id)}
              className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Remover"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de comentário */}
      {commentModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setCommentModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-brand-ink mb-1">
                {commentModal.existingId ? 'Editar comentário' : 'Adicionar comentário'}
              </h3>
              <p className="text-xs text-brand-ink-2 italic line-clamp-2">
                "{commentModal.selectedText}"
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-brand-ink-2 mb-1.5 block">Cor</label>
                <div className="flex gap-2">
                  {(Object.keys(COLOR_STYLES) as Annotation['color'][]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCommentModal({ ...commentModal, color: c })}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: COLOR_STYLES[c].bg,
                        border: `2px solid ${commentModal.color === c ? COLOR_STYLES[c].border : 'transparent'}`,
                      }}
                    >
                      {commentModal.color === c && <Check className="w-4 h-4" style={{ color: COLOR_STYLES[c].border }} />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-ink-2 mb-1.5 block">Comentário</label>
                <textarea
                  value={commentModal.value}
                  onChange={(e) => setCommentModal({ ...commentModal, value: e.target.value.slice(0, 2000) })}
                  placeholder="Escreva sua anotação aqui..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-lg text-sm text-brand-ink focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 focus:bg-white transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-4 flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setCommentModal(null)}
                className="px-4 py-2 text-sm font-semibold text-brand-ink-2 hover:text-brand-ink transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const value = commentModal.value.trim();
                  if (commentModal.existingId) {
                    // Update
                    const { error } = await supabase
                      .from('fechamento_annotations')
                      .update({ comment: value || null, color: commentModal.color })
                      .eq('id', commentModal.existingId);
                    if (error) {
                      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
                      return;
                    }
                    setAnnotations(prev => prev.map(a =>
                      a.id === commentModal.existingId
                        ? { ...a, comment: value || null, color: commentModal.color }
                        : a
                    ));
                    setCommentModal(null);
                    toast({ title: 'Comentário atualizado' });
                  } else {
                    await saveAnnotation(commentModal.selectedText, commentModal.occurrenceIndex, commentModal.color, value || null);
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary-dark hover:bg-brand-primary-darker rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Helpers ───────────────────────────────────────────────────

function countOccurrencesBefore(fullText: string, search: string, cutoff: number): number {
  if (!search) return 0;
  let count = 0;
  let idx = 0;
  const upperCutoff = cutoff;
  while (true) {
    const next = fullText.indexOf(search, idx);
    if (next === -1 || next >= upperCutoff) break;
    count++;
    idx = next + search.length;
  }
  return count;
}

/** Retorna o offset em caracteres (considerando apenas texto) desde o inicio do container ate (node, nodeOffset). */
function getCharOffsetWithinContainer(container: Node, targetNode: Node, targetOffset: number): number {
  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current === targetNode) {
      return offset + targetOffset;
    }
    offset += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  return offset;
}

/**
 * Encontra a N-ima ocorrencia de `text` dentro de `container` e wraps com <mark>.
 * Lida com o fato de o texto poder estar dividido entre varios text nodes (ex: strong, em).
 */
function wrapOccurrence(container: Node, text: string, occurrenceIndex: number, ann: Annotation) {
  if (!text) return;
  const fullText = container.textContent || '';
  let startGlobal = -1;
  let idx = 0;
  let found = 0;
  while (true) {
    const next = fullText.indexOf(text, idx);
    if (next === -1) break;
    if (found === occurrenceIndex) {
      startGlobal = next;
      break;
    }
    found++;
    idx = next + text.length;
  }
  if (startGlobal === -1) return;
  const endGlobal = startGlobal + text.length;

  // Agora percorre text nodes ate achar start e end
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;

  let current = walker.nextNode() as Text | null;
  while (current) {
    const len = current.textContent?.length ?? 0;
    if (!startNode && offset + len > startGlobal) {
      startNode = current;
      startNodeOffset = startGlobal - offset;
    }
    if (!endNode && offset + len >= endGlobal) {
      endNode = current;
      endNodeOffset = endGlobal - offset;
      break;
    }
    offset += len;
    current = walker.nextNode() as Text | null;
  }

  if (!startNode || !endNode) return;

  try {
    const range = document.createRange();
    range.setStart(startNode, startNodeOffset);
    range.setEnd(endNode, endNodeOffset);

    const color = COLOR_STYLES[ann.color];
    // Se a selecao cruza varios elementos, usa surroundContents com fallback para extractContents
    const mark = document.createElement('mark');
    mark.dataset.annotationId = ann.id;
    mark.style.backgroundColor = color.bg;
    mark.style.borderBottom = `2px solid ${color.border}`;
    mark.style.cursor = 'pointer';
    mark.style.borderRadius = '2px';
    mark.style.padding = '0 1px';
    if (ann.comment) {
      mark.style.boxShadow = `0 0 0 2px ${color.border}30`;
      mark.title = ann.comment;
    }

    try {
      range.surroundContents(mark);
    } catch {
      // Fallback: extract + wrap (quando a selecao cruza tags)
      const contents = range.extractContents();
      mark.appendChild(contents);
      range.insertNode(mark);
    }
  } catch (e) {
    console.warn('[annotations] wrap failed:', e);
  }
}

export default AnnotationLayer;

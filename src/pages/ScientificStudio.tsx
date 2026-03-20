import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDemoLimit } from '@/hooks/useDemoLimit';
import { useScientificMentor } from '@/hooks/useScientificMentor';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageSkeleton from '@/components/PageSkeleton';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import UpgradePaywall from '@/components/UpgradePaywall';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, FileDown, Trash2, Send, Plus, ChevronDown } from 'lucide-react';
import { exportToPDF } from '@/utils/pdfExport';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

type ProjectType = 'tcc' | 'artigo_original' | 'revisao' | 'relato_caso' | 'projeto_pesquisa' | 'resumo_expandido' | 'dissertacao';
type SectionType = 'titulo' | 'resumo' | 'introducao' | 'metodologia' | 'resultados' | 'discussao' | 'conclusao' | 'referencias' | 'geral';

interface Section {
  id: string;
  name: string;
  type: SectionType;
  content: string;
  status: 'draft' | 'revision_needed' | 'stable' | 'approved';
}

interface Project {
  id: string;
  title: string;
  type: ProjectType;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'tcc', label: 'TCC' },
  { value: 'artigo_original', label: 'Artigo Original' },
  { value: 'revisao', label: 'Artigo de Revisão' },
  { value: 'relato_caso', label: 'Relato de Caso' },
  { value: 'projeto_pesquisa', label: 'Projeto de Pesquisa' },
  { value: 'resumo_expandido', label: 'Resumo Expandido' },
  { value: 'dissertacao', label: 'Dissertação / Tese' },
];

const SECTION_TEMPLATES: { type: SectionType; name: string }[] = [
  { type: 'titulo', name: 'Título' },
  { type: 'resumo', name: 'Resumo / Abstract' },
  { type: 'introducao', name: 'Introdução' },
  { type: 'metodologia', name: 'Metodologia' },
  { type: 'resultados', name: 'Resultados' },
  { type: 'discussao', name: 'Discussão' },
  { type: 'conclusao', name: 'Conclusão' },
  { type: 'referencias', name: 'Referências' },
];

const STATUS_MAP = {
  draft: { label: 'RASCUNHO', bg: 'bg-slate-100', text: 'text-slate-600' },
  revision_needed: { label: 'REVISÃO', bg: 'bg-amber-50', text: 'text-amber-700' },
  stable: { label: 'ESTÁVEL', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  approved: { label: 'APROVADO', bg: 'bg-blue-50', text: 'text-blue-700' },
};

const STORAGE_KEY = 'preceptor_scientific_projects';

const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveProjects = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

const createDefaultProject = (): Project => ({
  id: crypto.randomUUID(),
  title: '',
  type: 'tcc',
  sections: SECTION_TEMPLATES.map(t => ({
    id: crypto.randomUUID(),
    name: t.name,
    type: t.type,
    content: '',
    status: 'draft' as const,
  })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const ScientificStudio = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubscriber, remainingPrompts, hasReachedLimit, dailyLimit, incrementUsage, loading: demoLoading } = useDemoLimit();
  const { messages, isStreaming, sendMessage, clearMessages } = useScientificMentor();

  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectType, setNewProjectType] = useState<ProjectType>('tcc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'editor' | 'mentor'>('editor');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active project/section
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;
  const activeSection = activeProject?.sections.find(s => s.id === activeSectionId) ?? null;

  // Init: select first project or show new project UI
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
      setActiveSectionId(projects[0].sections[0]?.id ?? null);
    } else if (projects.length === 0) {
      setShowNewProject(true);
    }
  }, []);

  // Persist projects
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Project CRUD
  const createProject = () => {
    const project = createDefaultProject();
    project.type = newProjectType;
    setProjects(prev => [project, ...prev]);
    setActiveProjectId(project.id);
    setActiveSectionId(project.sections[0]?.id ?? null);
    setShowNewProject(false);
    clearMessages();
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
        setActiveSectionId(remaining[0].sections[0]?.id ?? null);
      } else {
        setActiveProjectId(null);
        setActiveSectionId(null);
        setShowNewProject(true);
      }
    }
  };

  const updateProjectTitle = (title: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, title, updatedAt: new Date().toISOString() } : p
    ));
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId
        ? {
          ...p,
          updatedAt: new Date().toISOString(),
          sections: p.sections.map(s => s.id === sectionId ? { ...s, content } : s),
        }
        : p
    ));
  };

  const updateSectionStatus = (sectionId: string, status: Section['status']) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId
        ? {
          ...p,
          sections: p.sections.map(s => s.id === sectionId ? { ...s, status } : s),
        }
        : p
    ));
  };

  const addSection = () => {
    if (!activeProjectId) return;
    const newSection: Section = {
      id: crypto.randomUUID(),
      name: 'Nova Seção',
      type: 'geral',
      content: '',
      status: 'draft',
    };
    setProjects(prev => prev.map(p =>
      p.id === activeProjectId ? { ...p, sections: [...p.sections, newSection] } : p
    ));
    setActiveSectionId(newSection.id);
  };

  // AI actions
  const handleAnalyzeSection = () => {
    if (!activeSection || !activeSection.content.trim()) {
      toast({ title: 'Seção vazia', description: 'Escreva algo na seção antes de solicitar análise.', variant: 'destructive' });
      return;
    }
    if (!isSubscriber && hasReachedLimit) return;
    if (!isSubscriber) incrementUsage();

    const prompt = `Analise a seguinte seção "${activeSection.name}" do meu ${PROJECT_TYPES.find(p => p.value === activeProject?.type)?.label ?? 'trabalho acadêmico'}:\n\n${activeSection.content}`;
    sendMessage(prompt, activeProject?.type, activeSection.type);
    setMobilePanel('mentor');
  };

  const handleAnalyzeAll = () => {
    if (!activeProject) return;
    const allContent = activeProject.sections
      .filter(s => s.content.trim())
      .map(s => `## ${s.name}\n${s.content}`)
      .join('\n\n');
    if (!allContent.trim()) {
      toast({ title: 'Projeto vazio', description: 'Escreva em pelo menos uma seção.', variant: 'destructive' });
      return;
    }
    if (!isSubscriber && hasReachedLimit) return;
    if (!isSubscriber) incrementUsage();

    const prompt = `Faça uma análise completa do meu ${PROJECT_TYPES.find(p => p.value === activeProject.type)?.label ?? 'trabalho acadêmico'} intitulado "${activeProject.title || 'Sem título'}":\n\n${allContent}`;
    sendMessage(prompt, activeProject.type);
    setMobilePanel('mentor');
  };

  const handleChatSend = () => {
    if (!chatInput.trim() || isStreaming) return;
    if (!isSubscriber && hasReachedLimit) return;
    if (!isSubscriber) incrementUsage();
    sendMessage(chatInput.trim(), activeProject?.type, activeSection?.type);
    setChatInput('');
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: 'Copiado!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || demoLoading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  // New project screen
  if (showNewProject && !activeProject) {
    return (
      <DashboardLayout mainClassName="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto">
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#005344] to-[#006d5b] flex items-center justify-center mx-auto mb-6">
            <MI name="science" className="text-white text-3xl" />
          </div>
          <h1 className="font-['Manrope'] font-extrabold text-2xl sm:text-3xl text-[#191c1d] mb-2">
            Curadoria Científica
          </h1>
          <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto">
            Seu orientador de IA para TCC, artigos científicos e projetos de pesquisa. Escolha o tipo de documento para começar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-8">
            {PROJECT_TYPES.map(pt => (
              <button
                key={pt.value}
                onClick={() => setNewProjectType(pt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  newProjectType === pt.value
                    ? 'border-[#006d5b] bg-[#006d5b]/5'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <p className={`font-['Manrope'] font-bold text-sm ${newProjectType === pt.value ? 'text-[#005344]' : 'text-slate-700'}`}>
                  {pt.label}
                </p>
              </button>
            ))}
          </div>

          <Button
            onClick={createProject}
            className="bg-gradient-to-r from-[#005344] to-[#006d5b] text-white px-8 py-3 rounded-xl font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Projeto
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const projectTypeLabel = PROJECT_TYPES.find(p => p.value === activeProject?.type)?.label ?? '';

  return (
    <DashboardLayout mainClassName="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col overflow-hidden" hideFooter>
      {/* Top toolbar */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 bg-white gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-gradient-to-br from-[#005344] to-[#006d5b] rounded-lg shrink-0">
            <MI name="science" className="text-white text-lg" />
          </div>
          <div className="min-w-0">
            <p className="font-['Manrope'] font-bold text-[#005344] text-sm leading-none truncate">Curadoria Científica</p>
            <p className="text-[10px] text-slate-400 truncate">{projectTypeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile panel toggle */}
          <div className="flex lg:hidden bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMobilePanel('editor')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mobilePanel === 'editor' ? 'bg-white text-[#005344] shadow-sm' : 'text-slate-500'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobilePanel('mentor')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mobilePanel === 'mentor' ? 'bg-white text-[#005344] shadow-sm' : 'text-slate-500'}`}
            >
              Mentor IA
            </button>
          </div>

          <button
            onClick={() => handleAnalyzeAll()}
            disabled={isStreaming}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006d5b]/10 text-[#005344] text-xs font-bold hover:bg-[#006d5b]/20 transition-colors disabled:opacity-50"
          >
            <MI name="auto_awesome" className="text-sm" />
            Analisar Tudo
          </button>

          {/* Project picker */}
          <div className="relative">
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-500 transition-colors"
            >
              <MI name="folder" className="text-base" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {showProjectPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectPicker(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-100 w-64 py-2 max-h-80 overflow-y-auto">
                  <button
                    onClick={() => { setShowNewProject(true); setActiveProjectId(null); setShowProjectPicker(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#005344] hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Novo Projeto
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center gap-1 px-2">
                      <button
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setActiveSectionId(p.sections[0]?.id ?? null);
                          setShowProjectPicker(false);
                          clearMessages();
                        }}
                        className={`flex-1 text-left px-2 py-2 rounded-lg text-xs transition-colors truncate ${
                          p.id === activeProjectId ? 'bg-[#006d5b]/10 text-[#005344] font-bold' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.title || 'Sem título'}
                        <span className="block text-[10px] text-slate-400">{PROJECT_TYPES.find(pt => pt.value === p.type)?.label}</span>
                      </button>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {!isSubscriber && !hasReachedLimit && (
        <UpgradePaywall variant="banner" remainingPrompts={remainingPrompts} dailyLimit={dailyLimit} />
      )}

      {/* Main content: split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Editor */}
        <div className={`${mobilePanel === 'editor' ? 'flex' : 'hidden'} lg:flex flex-col flex-1 overflow-hidden border-r border-slate-100`}>
          {/* Section tabs */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-2 overflow-x-auto border-b border-slate-50 bg-[#f8f9fa] no-scrollbar">
            {activeProject?.sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSectionId(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  s.id === activeSectionId
                    ? 'bg-white text-[#005344] font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
              >
                {s.name}
              </button>
            ))}
            <button
              onClick={addSection}
              className="shrink-0 px-2 py-1.5 rounded-lg text-slate-400 hover:text-[#005344] hover:bg-white/60 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Editor area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Title input */}
              <div>
                <label className="block text-[10px] font-bold text-[#005344] uppercase tracking-[0.2em] mb-2">
                  Título do Projeto
                </label>
                <input
                  type="text"
                  value={activeProject?.title ?? ''}
                  onChange={e => updateProjectTitle(e.target.value)}
                  placeholder="Digite o título do seu trabalho..."
                  className="w-full text-xl sm:text-2xl font-['Manrope'] font-extrabold text-[#191c1d] bg-transparent border-none outline-none placeholder:text-slate-300 p-0"
                />
              </div>

              {/* Active section */}
              {activeSection && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(25,28,29,0.04)]">
                  <div className="flex items-center justify-between p-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={activeSection.name}
                        onChange={e => {
                          if (!activeProjectId) return;
                          setProjects(prev => prev.map(p =>
                            p.id === activeProjectId
                              ? { ...p, sections: p.sections.map(s => s.id === activeSectionId ? { ...s, name: e.target.value } : s) }
                              : p
                          ));
                        }}
                        className="font-['Manrope'] font-bold text-base text-[#191c1d] bg-transparent border-none outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={activeSection.status}
                        onChange={e => updateSectionStatus(activeSectionId!, e.target.value as Section['status'])}
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border-none cursor-pointer ${STATUS_MAP[activeSection.status].bg} ${STATUS_MAP[activeSection.status].text}`}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="revision_needed">Revisão</option>
                        <option value="stable">Estável</option>
                        <option value="approved">Aprovado</option>
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={activeSection.content}
                    onChange={e => updateSectionContent(activeSectionId!, e.target.value)}
                    placeholder={`Escreva o conteúdo da seção "${activeSection.name}" aqui...\n\nCole seu texto ou comece a escrever. Quando estiver pronto, clique em "Analisar Seção" para receber feedback da IA.`}
                    className="w-full min-h-[300px] sm:min-h-[400px] p-4 sm:p-6 text-sm leading-relaxed text-[#191c1d] bg-transparent border-none outline-none resize-y placeholder:text-slate-300"
                  />
                  <div className="flex items-center gap-2 px-4 pb-4">
                    <button
                      onClick={handleAnalyzeSection}
                      disabled={isStreaming || !activeSection.content.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#005344] to-[#006d5b] text-white text-xs font-bold disabled:opacity-50 transition-all hover:shadow-md active:scale-[0.98]"
                    >
                      <MI name="auto_awesome" className="text-sm" />
                      Analisar Seção
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {activeSection.content.length.toLocaleString()} caracteres
                    </span>
                  </div>
                </div>
              )}

              {/* Section overview cards */}
              <div>
                <h3 className="font-['Manrope'] font-bold text-base mb-3 flex items-center gap-2">
                  <MI name="list_alt" className="text-lg text-slate-400" />
                  Seções do Projeto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeProject?.sections.map(s => {
                    const st = STATUS_MAP[s.status];
                    return (
                      <button
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                        className={`text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                          s.id === activeSectionId ? 'border-[#006d5b]/30 bg-[#006d5b]/5' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-sm truncate">{s.name}</p>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {s.content ? s.content.slice(0, 120) + (s.content.length > 120 ? '...' : '') : 'Seção vazia'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AI Mentor Panel */}
        <div className={`${mobilePanel === 'mentor' ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[400px] xl:w-[420px] bg-[#f8f9fa] shrink-0`}>
          {/* Mentor header */}
          <div className="shrink-0 bg-gradient-to-br from-[#005344] to-[#006d5b] p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <MI name="auto_awesome" className="text-white" />
              </div>
              <div>
                <h2 className="font-['Manrope'] font-bold text-white text-base leading-none">Mentor Científico</h2>
                <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest font-bold">
                  {isStreaming ? 'Analisando...' : 'Pronto'}
                </p>
              </div>
              <button
                onClick={clearMessages}
                className="ml-auto p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Quick stats */}
            {activeProject && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/60 font-bold">Seções preenchidas</p>
                  <p className="text-lg font-['Manrope'] font-extrabold text-white">
                    {activeProject.sections.filter(s => s.content.trim()).length}
                    <span className="text-sm font-medium text-white/50">/{activeProject.sections.length}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 font-bold">Caracteres</p>
                  <p className="text-lg font-['Manrope'] font-extrabold text-white">
                    {activeProject.sections.reduce((acc, s) => acc + s.content.length, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {hasReachedLimit && !isSubscriber ? (
              <div className="h-full flex items-center justify-center p-4">
                <UpgradePaywall variant="chat-limit" remainingPrompts={remainingPrompts} dailyLimit={dailyLimit} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MI name="psychology" className="text-4xl text-slate-300 mb-3" />
                <h3 className="font-['Manrope'] font-bold text-sm text-slate-600 mb-1">Seu orientador de IA</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Escreva seu texto na seção ao lado e clique em "Analisar Seção" para receber feedback detalhado, ou pergunte qualquer coisa abaixo.
                </p>
                <div className="space-y-2">
                  {[
                    'Avalie meu título e sugira melhorias',
                    'Minha metodologia está adequada?',
                    'Como escrever uma boa introdução para TCC?',
                    'Quais são as normas ABNT para referências?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => { setChatInput(suggestion); }}
                      className="w-full text-left p-2.5 rounded-lg border border-slate-100 bg-white text-xs text-slate-500 hover:bg-[#006d5b]/5 hover:border-[#006d5b]/20 hover:text-slate-700 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#005344] to-[#006d5b] flex items-center justify-center mt-0.5">
                      <MI name="auto_awesome" className="text-white text-sm" />
                    </div>
                  )}
                  <div className={`max-w-[90%] group/msg ${
                    m.role === 'user'
                      ? 'px-3 py-2 rounded-xl rounded-br-sm text-white text-xs bg-gradient-to-br from-[#005344] to-[#006d5b]'
                      : 'bg-white border border-slate-100 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm'
                  }`}>
                    {m.role === 'assistant' ? (
                      <>
                        {!m.content && isStreaming && (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#006d5b] animate-pulse" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#006d5b] animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#006d5b] animate-pulse" style={{ animationDelay: '0.4s' }} />
                            <span className="text-[10px] text-slate-400 ml-1">Analisando...</span>
                          </div>
                        )}
                        {m.content && (
                          <div className="prose prose-xs max-w-none text-xs prose-headings:text-[#005344] prose-headings:text-sm prose-headings:mb-1 prose-p:mb-1.5 prose-li:mb-0.5">
                            <MarkdownRenderer content={m.content} isTyping={isStreaming && m.id === messages[messages.length - 1]?.id} />
                          </div>
                        )}
                        {m.content && !(isStreaming && m.id === messages[messages.length - 1]?.id) && (
                          <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-50 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(m.content, m.id)}
                              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === m.id ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">{m.content.length > 300 ? m.content.slice(0, 300) + '...' : m.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="shrink-0 border-t border-slate-100 bg-white p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                placeholder={hasReachedLimit && !isSubscriber ? 'Limite diário atingido' : 'Pergunte ao mentor...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                className="flex-1 min-h-[40px] max-h-[100px] resize-none text-xs border-slate-200"
                rows={1}
                disabled={isStreaming || (hasReachedLimit && !isSubscriber)}
              />
              <Button
                onClick={handleChatSend}
                disabled={!chatInput.trim() || isStreaming || (hasReachedLimit && !isSubscriber)}
                size="icon"
                className="shrink-0 h-10 w-10 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #005344, #006d5b)' }}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-center text-[9px] text-slate-300 mt-1.5">
              O mentor orienta, mas não escreve por você. Sempre valide com seu orientador.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScientificStudio;

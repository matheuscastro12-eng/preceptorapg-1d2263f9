import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Lock, Loader2, Save, ShieldCheck } from 'lucide-react';

interface AccountValues {
  full_name: string;
  university: string;
  semester: string;
  bio: string;
  phone: string;
}

interface AccountTabProps {
  userId: string;
  email: string;
  initial: AccountValues;
  onSaved: (vals: AccountValues) => void;
}

const FIELD = 'w-full text-sm rounded-xl border border-slate-200 bg-white focus:border-[#006D5B] focus:ring-1 focus:ring-[#006D5B]/20 outline-none px-3.5 py-2.5 transition-colors';
const LABEL = 'text-[11px] font-bold text-[#6e7975] uppercase tracking-wider block mb-1.5';

export default function AccountTab({ userId, email, initial, onSaved }: AccountTabProps) {
  const [form, setForm] = useState<AccountValues>(initial);
  const [savingInfo, setSavingInfo] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveInfo = async () => {
    setSavingInfo(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name || null,
      university: form.university || null,
      semester: form.semester || null,
      bio: form.bio || null,
      phone: form.phone || null,
    }).eq('user_id', userId);
    setSavingInfo(false);
    if (error) { toast.error('Erro ao salvar informações'); return; }
    onSaved(form);
    toast.success('Informações salvas!');
  };

  const saveEmail = async () => {
    const next = newEmail.trim();
    if (!next) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: next });
    setSavingEmail(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Enviamos um link de confirmação para o novo e-mail.');
    setNewEmail('');
  };

  const savePw = async () => {
    if (pw.length < 6) { toast.error('A senha precisa ter ao menos 6 caracteres'); return; }
    if (pw !== pw2) { toast.error('As senhas não conferem'); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Senha alterada com sucesso!');
    setPw(''); setPw2('');
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Informações pessoais */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-[#006D5B]" />
          <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d]">Informações pessoais</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Nome completo</label>
            <input className={FIELD} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Seu nome" />
          </div>
          <div>
            <label className={LABEL}>Telefone / WhatsApp</label>
            <input className={FIELD} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label className={LABEL}>Faculdade</label>
            <input className={FIELD} value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} placeholder="Ex: UFMG" />
          </div>
          <div>
            <label className={LABEL}>Período</label>
            <input className={FIELD} value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} placeholder="Ex: 8º" />
          </div>
        </div>
        <div className="mt-4">
          <label className={LABEL}>Bio</label>
          <textarea className={`${FIELD} resize-none`} rows={2} maxLength={200} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Conte sobre você..." />
        </div>
        <button onClick={saveInfo} disabled={savingInfo} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#006D5B] text-white text-sm font-bold rounded-xl hover:bg-[#005344] transition-colors disabled:opacity-50">
          {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </button>
      </div>

      {/* E-mail */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Mail className="w-4 h-4 text-[#006D5B]" />
          <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d]">E-mail</h3>
        </div>
        <p className="text-xs text-[#6e7975] mb-4">Atual: <strong className="text-[#191c1d]">{email || '—'}</strong></p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1">
            <label className={LABEL}>Novo e-mail</label>
            <input type="email" className={FIELD} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="novo@email.com" />
          </div>
          <button onClick={saveEmail} disabled={savingEmail || !newEmail.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#191c1d] text-white text-sm font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-40">
            {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Atualizar
          </button>
        </div>
        <p className="text-[11px] text-[#6e7975] mt-2">Você receberá um link de confirmação no novo endereço antes da troca ser aplicada.</p>
      </div>

      {/* Senha */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-[#006D5B]" />
          <h3 className="font-['Manrope'] text-base font-bold text-[#191c1d]">Senha</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Nova senha</label>
            <input type="password" className={FIELD} value={pw} onChange={e => setPw(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className={LABEL}>Confirmar senha</label>
            <input type="password" className={FIELD} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repita a senha" />
          </div>
        </div>
        <button onClick={savePw} disabled={savingPw || !pw || !pw2} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#006D5B] text-white text-sm font-bold rounded-xl hover:bg-[#005344] transition-colors disabled:opacity-50">
          {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Alterar senha
        </button>
      </div>
    </div>
  );
}

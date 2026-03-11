import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';

interface Conversation {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const { chatUserId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatProfile, setChatProfile] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && !chatUserId) fetchConversations();
    if (user && chatUserId) fetchChat();
  }, [user, chatUserId]);

  // Realtime for chat
  useEffect(() => {
    if (!user || !chatUserId) return;
    const channel = supabase
      .channel(`dm-${chatUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === user.id && msg.receiver_id === chatUserId) ||
            (msg.sender_id === chatUserId && msg.receiver_id === user.id)) {
          setMessages(prev => [...prev, msg]);
          // Mark as read
          if (msg.sender_id === chatUserId) {
            supabase.from('direct_messages').update({ read: true } as any).eq('id', msg.id);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, chatUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: allMessages } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!allMessages) { setLoading(false); return; }

    // Group by conversation partner
    const convMap = new Map<string, { last_message: string; last_time: string; unread: number }>();
    allMessages.forEach(m => {
      const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          last_message: m.content,
          last_time: m.created_at,
          unread: 0,
        });
      }
      if (m.receiver_id === user.id && !m.read) {
        const c = convMap.get(partnerId)!;
        c.unread++;
      }
    });

    const partnerIds = [...convMap.keys()];
    if (partnerIds.length === 0) { setConversations([]); setLoading(false); return; }

    const { data: profiles } = await (supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url').in('user_id', partnerIds) as any);
    const pMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const convs: Conversation[] = partnerIds.map(id => {
      const p = pMap.get(id) as any;
      const c = convMap.get(id)!;
      return {
        user_id: id,
        full_name: p?.full_name || null,
        avatar_url: p?.avatar_url || null,
        email: '',
        ...c,
      };
    }).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

    setConversations(convs);
    setLoading(false);
  };

  const fetchChat = async () => {
    if (!user || !chatUserId) return;
    const [{ data: msgs }, { data: profile }] = await Promise.all([
      supabase.from('direct_messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatUserId}),and(sender_id.eq.${chatUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }),
      supabase.from('public_profiles' as any).select('user_id, full_name, avatar_url').eq('user_id', chatUserId).single() as any,
    ]);
    setMessages(msgs || []);
    setChatProfile(profile);
    setLoading(false);

    // Mark unread as read
    if (msgs) {
      const unreadIds = msgs.filter(m => m.receiver_id === user.id && !m.read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('direct_messages').update({ read: true } as any).in('id', unreadIds);
      }
    }
  };

  const handleSend = async () => {
    if (!user || !chatUserId || !newMessage.trim()) return;
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: chatUserId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  if (authLoading || loading) return <PageSkeleton variant="menu" />;
  if (!user) return <Navigate to="/auth" replace />;

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Chat view
  if (chatUserId) {
    return (
      <PageTransition className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
          <div className="container flex h-14 items-center gap-3 px-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {chatProfile && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${chatUserId}`)}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={chatProfile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {(chatProfile.full_name || chatProfile.email).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">{chatProfile.full_name || chatProfile.email}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 container max-w-xl px-4 py-4 overflow-y-auto space-y-2">
          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                m.sender_id === user.id
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary/50 text-foreground rounded-bl-sm'
              }`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <div className="border-t border-border/20 bg-background/80 backdrop-blur-xl p-4">
          <div className="container max-w-xl flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Conversations list
  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Menu
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Mensagens</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container max-w-xl px-4 py-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma conversa ainda.</p>
            <p className="text-muted-foreground/60 text-xs">Encontre estudantes na aba Descobrir!</p>
          </div>
        ) : (
          conversations.map(c => (
            <Card
              key={c.user_id}
              className="p-3 bg-secondary/10 border-border/30 flex items-center gap-3 cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={() => navigate(`/messages/${c.user_id}`)}
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={c.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {(c.full_name || c.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">{c.full_name || c.email}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.last_time)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
              </div>
              {c.unread > 0 && (
                <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {c.unread}
                </div>
              )}
            </Card>
          ))
        )}
      </main>
    </PageTransition>
  );
};

export default Messages;

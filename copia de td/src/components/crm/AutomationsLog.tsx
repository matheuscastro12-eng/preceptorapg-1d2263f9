import type { CrmAutomationLog } from "@/lib/crm/types";
import { AUTOMATION_TRIGGER_LABELS } from "@/lib/crm/types";
import { Mail, MessageSquare, Smartphone, Bell, CheckCircle, XCircle, Clock, MousePointerClick } from "lucide-react";

interface AutomationsLogProps {
  automations: CrmAutomationLog[];
}

const CHANNEL_ICONS = {
  email: Mail,
  whatsapp: MessageSquare,
  push: Bell,
  in_app: Smartphone,
};

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "text-gray-400", bg: "bg-gray-800", Icon: Clock },
  sent: { label: "Enviado", color: "text-blue-400", bg: "bg-blue-900/30", Icon: Mail },
  delivered: { label: "Entregue", color: "text-blue-400", bg: "bg-blue-900/30", Icon: CheckCircle },
  opened: { label: "Aberto", color: "text-yellow-400", bg: "bg-yellow-900/30", Icon: Mail },
  clicked: { label: "Clicado", color: "text-green-400", bg: "bg-green-900/30", Icon: MousePointerClick },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-900/30", Icon: XCircle },
  bounced: { label: "Bounce", color: "text-orange-400", bg: "bg-orange-900/30", Icon: XCircle },
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atras`;
  if (hours < 24) return `${hours}h atras`;
  return `${days}d atras`;
}

export default function AutomationsLog({ automations }: AutomationsLogProps) {
  return (
    <div className="space-y-2">
      {automations.length === 0 && (
        <div className="py-8 text-center text-gray-500 text-sm">Nenhuma automacao registrada ainda</div>
      )}
      {automations.map((auto) => {
        const ChannelIcon = CHANNEL_ICONS[auto.channel] ?? Mail;
        const statusConfig = STATUS_CONFIG[auto.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = statusConfig.Icon;

        return (
          <div key={auto.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
            <div className="p-2 rounded-lg bg-gray-800 flex-shrink-0">
              <ChannelIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white">{AUTOMATION_TRIGGER_LABELS[auto.trigger_name] ?? auto.trigger_name}</span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {statusConfig.label}
                </span>
              </div>
              {auto.trigger_reason && <p className="text-xs text-gray-500 truncate">{auto.trigger_reason}</p>}
            </div>
            <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(auto.created_at)}</span>
          </div>
        );
      })}
    </div>
  );
}

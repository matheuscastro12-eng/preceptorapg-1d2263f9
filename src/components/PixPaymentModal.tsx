import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle2, MessageCircle, QrCode } from 'lucide-react';

const PIX_PAYLOAD = '00020126480014BR.GOV.BCB.PIX0126kamikazematheus7@gmail.com520400005303986540539.905802BR5923Matheus da Cunha Castro6009SAO PAULO62140510n5fzPTYcQ963044EDF';
const PIX_KEY = 'kamikazematheus7@gmail.com';
const WHATSAPP_NUMBER = '5535920004855';

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  planLabel: string;
  planPrice: string;
}

const PixPaymentModal = ({ open, onClose, planLabel, planPrice }: PixPaymentModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
      setCopied(true);
      toast({ title: 'Código Pix copiado!' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de fazer um Pix de ${planPrice} referente ao plano ${planLabel} do PreceptorMED. Segue o comprovante:`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pagar com Pix
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan info */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-sm text-muted-foreground">{planLabel}</p>
            <p className="text-2xl font-bold">{planPrice}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center rounded-lg bg-white p-4">
            <QRCodeSVG value={PIX_PAYLOAD} size={200} level="M" />
          </div>

          {/* Copy Pix */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Ou copie o código Pix Copia e Cola:
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopyPix}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar código Pix
                </>
              )}
            </Button>
          </div>

          {/* Pix key info */}
          <p className="text-xs text-muted-foreground text-center">
            Chave Pix: <span className="font-medium text-foreground">{PIX_KEY}</span>
          </p>

          {/* WhatsApp */}
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm text-center font-medium">
              Após o pagamento, envie o comprovante:
            </p>
            <Button
              className="w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              Enviar comprovante via WhatsApp
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Seu acesso será liberado em até 30 minutos após a confirmação.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentModal;

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const PIX_CODE =
  "00020126360014br.gov.bcb.pix0114+55719883350015204000053039865802BR5924Fabricio Ferreira de Sou6006Brasil622905252026022320394FKED6HXM7YSB63041E10";

interface PixPaymentProps {
  valor?: string;
  onSendComprovante?: () => void;
}

export function PixPayment({ valor, onSendComprovante }: PixPaymentProps) {
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CODE);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = PIX_CODE;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-6 rounded-3xl border border-primary/25 bg-card p-8 shadow-[0_0_80px_hsl(var(--primary)/0.08)]">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-primary/12 text-xl">
          ⚡
        </div>
        <p className="text-xl font-bold text-foreground tracking-tight">Pagar com PIX</p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Confirmação imediata
        </p>
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* QR Code */}
      <div className="relative rounded-2xl bg-white p-3.5 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
        {/* Corner decorations */}
        <div className="absolute -left-1 -top-1 h-5 w-5 rounded-tl border-l-[3px] border-t-[3px] border-primary" />
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-br border-b-[3px] border-r-[3px] border-primary" />
        <QRCodeSVG value={PIX_CODE} size={182} level="M" />
      </div>

      {/* Instant badge */}
      <div className="flex items-center gap-2 rounded-full border border-[hsl(142,70%,45%)]/25 bg-[hsl(142,70%,45%)]/10 px-4 py-1.5 text-xs font-medium text-[hsl(142,70%,45%)]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(142,70%,45%)]" />
        Pagamento instantâneo 24h
      </div>

      {/* Recipient info */}
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">Fabricio Ferreira de Souza</p>
        <p className="text-xs text-muted-foreground">*** . 488 . 905 - **</p>
        <p className="text-xs text-muted-foreground">Neon Pagamentos S.A</p>
      </div>

      {valor && (
        <p className="text-lg font-bold text-primary">Valor: {valor}</p>
      )}

      {/* Separator */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Copy section */}
      <div className="flex w-full flex-col gap-2">
        <p className="text-center text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          ou copie o código PIX copia e cola
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white/[0.04] p-3 pl-4">
          <span className="flex-1 break-all font-mono text-[0.65rem] leading-relaxed text-muted-foreground select-all">
            {PIX_CODE}
          </span>
          <button
            onClick={copyPix}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold transition-all active:scale-95 ${
              copied
                ? "bg-[hsl(142,70%,45%)] text-white"
                : "bg-primary text-primary-foreground hover:brightness-110"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex w-full flex-col gap-2">
        {[
          "Abra o app do seu banco",
          "Escaneie o QR Code ou cole o código",
          "Confirme o pagamento — pronto! ✅",
        ].map((text, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-[0.7rem] font-bold text-primary">
              {i + 1}
            </span>
            {text}
          </div>
        ))}
      </div>

      {/* WhatsApp comprovante button */}
      {onSendComprovante && (
        <button
          onClick={onSendComprovante}
          className="w-full rounded-xl border border-[hsl(142,70%,45%)]/30 bg-[hsl(142,70%,45%)]/10 px-4 py-3 text-sm font-semibold text-[hsl(142,70%,45%)] transition-colors hover:bg-[hsl(142,70%,45%)]/20"
        >
          📲 Enviar Comprovante via WhatsApp
        </button>
      )}
    </div>
  );
}

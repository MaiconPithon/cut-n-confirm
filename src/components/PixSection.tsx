import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PIX_KEY = "71988335001";

export function PixSection() {
  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave Pix copiada!");
  };

  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 text-center">
      <h2 className="mb-6 text-3xl font-bold uppercase tracking-wide text-primary">
        Pagamento via Pix
      </h2>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="mb-2 text-sm text-muted-foreground">Chave Pix (Telefone)</p>
        <p className="mb-4 text-xl font-bold text-foreground">{PIX_KEY}</p>
        <Button variant="outline" className="gap-2" onClick={copyPix}>
          <Copy className="h-4 w-4" />
          Copiar Chave
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Após o pagamento, envie o comprovante pelo WhatsApp
        </p>
      </div>
    </section>
  );
}

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5571988335001";
const WHATSAPP_MESSAGE = "Olá! Gostaria de agendar um horário na Barbearia do Fal.";

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] shadow-lg hover:bg-[hsl(142,70%,40%)] transition-colors"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-foreground" />
    </a>
  );
}

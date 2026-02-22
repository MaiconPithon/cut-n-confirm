import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5571988335001";

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg hover:bg-green-600 transition-colors"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
}

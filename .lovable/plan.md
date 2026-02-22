

# 🪒 Barbearia do Fal — App de Agendamento

## Visão Geral
App completo para agendamento de cortes na **Barbearia do Fal**, com visual moderno preto e branco estilo barbearia, instalável como PWA no celular. Conectado ao Supabase para salvar os agendamentos.

---

## 1. Página Inicial (Cliente)
- Logo do FAL Cortes no topo
- Nome "Barbearia do Fal" em destaque
- Informações de funcionamento: Terça a Sábado, 08h às 21h
- Botão de "Agendar Horário"
- Botão flutuante do WhatsApp (71 98833-5001)
- Design escuro/preto com detalhes em branco e dourado

## 2. Tabela de Preços
Seção com todos os serviços e valores (da imagem):
- Corte Degradê — R$25,00
- Corte Simples — R$20,00
- Barba — R$10,00
- Bigode + Cavanhaque — R$5,00
- Sobrancelha — R$5,00
- Sobrancelha Feminina — R$10,00
- Pigmentação — R$10,00

## 3. Sistema de Agendamento
- Escolha do serviço (com preço)
- Calendário para selecionar o dia (respeita dias de funcionamento)
- Grade de horários disponíveis (08h às 21h, intervalos de 30 min)
- Horários já agendados ficam bloqueados automaticamente
- Cliente preenche: Nome e Telefone
- Confirmação do agendamento com resumo

## 4. Pagamento
- **Pix**: QR Code visível com chave 71 98833-5001
- **Dinheiro**: Opção "pagar no local"
- Após escolher Pix, botão para enviar comprovante via WhatsApp
- (Cartão de crédito online pode ser adicionado futuramente com Stripe)

## 5. Integração WhatsApp
- Botão flutuante em todas as páginas
- Ao agendar, botão para enviar mensagem automática com:
  - Nome do cliente
  - Serviço escolhido
  - Data e horário
  - Forma de pagamento

## 6. Área Administrativa (/admin)
- Login protegido com email e senha (via Supabase Auth)
- Dashboard com todos os agendamentos
- Visualizar: nome, telefone, serviço, data, hora, valor, status
- Alterar status: Pendente → Confirmado → Finalizado
- Gerenciar agenda: bloquear horários, abrir/fechar domingos
- Editar preços dos serviços
- Relatório simples de faturamento (total do dia/semana/mês)

## 7. PWA (App Instalável)
- Configurar como Progressive Web App
- Ícone personalizado com a logo do FAL
- Funcionar offline (tela básica)
- Instalável direto do navegador no celular

## 8. Backend (Supabase)
- Conectar ao Supabase existente do usuário
- Tabelas: agendamentos, serviços, configurações de horário
- Autenticação para área admin
- RLS para segurança dos dados


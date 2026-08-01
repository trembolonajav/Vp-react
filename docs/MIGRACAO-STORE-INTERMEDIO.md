# Migração da Store — Intermédio

Etapa concluída em 01/08/2026.

- `/store/intermedio` passou a ser uma rota React oficial.
- O conteúdo, as três etapas e o alerta de segurança foram preservados.
- O CTA usa a configuração oficial carregada pelo Spring e monta o WhatsApp pelo utilitário compartilhado.
- O link de canais oficiais aponta para a rota React `/comunidade`.
- Header e footer da Store alcançam a nova rota sem recarregar a página.
- O Nginx prioriza o SPA sobre o arquivo estático legado.

O HTML antigo permanece na imagem apenas enquanto `jogos`, `offline` e o build estático da Store não forem retirados em etapas próprias.

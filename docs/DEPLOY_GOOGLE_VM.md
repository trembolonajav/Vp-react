# Deploy na Google VM

O deploy de produção é executado automaticamente após cada push na branch
`main`, pelo workflow `.github/workflows/deploy-production.yml`.

## Secrets do environment `production`

- `VM_HOST`: IP estático da VM.
- `VM_USER`: usuário Linux autorizado exclusivamente para o deploy.
- `VM_SSH_KEY`: chave SSH privada do usuário de deploy.
- `VM_KNOWN_HOSTS`: linha `known_hosts` validada da VM.

Segredos de aplicação permanecem somente em `/opt/vperts/app/.env` na VM e
nunca são enviados ao GitHub.

## Procedimento executado

1. Conecta à VM com verificação estrita da chave do host.
2. Atualiza `main` apenas por fast-forward.
3. Valida `compose.production.yml`.
4. Reconstrói e recria os serviços necessários, preservando volumes.
5. Confirma backend saudável e frontend em execução.

O workflow também pode ser iniciado manualmente pela aba **Actions**.

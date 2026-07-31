# Rifa iPhone 16 256GB - Esperia

Sistema completo de rifa para VPS com Node.js, Express, SQLite, HTML, CSS e JavaScript puro.

## Recursos

- Página pública responsiva com banner configurável, contadores, valor arrecadado, progresso de vendas e grade visual dos números 1041 a 1070.
- Reserva de múltiplos números com envio automático da mensagem para o WhatsApp `5511998889326`.
- Upload de banner, QR Code PIX, chave PIX e nome do recebedor pelo painel administrativo.
- Consulta de números por telefone, sem senha.
- Área de Sorteio ao Vivo com link editável no painel administrativo.
- Área e página de resultado final com número sorteado, ganhador e replay editáveis.
- Botão para compartilhar a rifa no WhatsApp.
- Painel administrativo protegido por login.
- API REST organizada em rotas, controllers e middleware.
- Banco SQLite criado automaticamente na primeira execução.

## Requisitos

- Node.js 18 ou superior
- npm
- VPS Ubuntu Hostinger ou ambiente compatível

## Instalação local

```bash
npm install
cp .env.example .env # opcional, crie manualmente se não existir
npm start
```

Acesse:

- Site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

Credenciais iniciais padrão:

- Usuário: `admin`
- Senha: `admin123`

> Em produção, configure `ADMIN_USER`, `ADMIN_PASSWORD` e `SESSION_SECRET` antes da primeira execução para criar o administrador seguro.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz se quiser sobrescrever os padrões:

```env
PORT=3000
SESSION_SECRET=troque-por-um-segredo-longo
ADMIN_USER=admin
ADMIN_PASSWORD=uma-senha-forte
TICKET_PRICE=0
DB_PATH=./database/rifa.sqlite
```

`TICKET_PRICE` é usado para calcular valor arrecadado e valor total previsto no dashboard. Se a rifa não tiver valor definido, mantenha `0`.

## Publicação em VPS Ubuntu Hostinger

1. Atualize o servidor:

```bash
sudo apt update && sudo apt upgrade -y
```

2. Instale Node.js LTS e ferramentas básicas:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential
```

3. Envie ou clone o projeto na VPS:

```bash
git clone <URL_DO_REPOSITORIO> rifa-pedro-rocha
cd rifa-pedro-rocha
npm install --omit=dev
```

4. Configure o `.env`:

```bash
nano .env
```

Exemplo recomendado:

```env
PORT=3000
SESSION_SECRET=gere-um-segredo-grande-e-unico
ADMIN_USER=seu_usuario
ADMIN_PASSWORD=sua_senha_forte
TICKET_PRICE=0
DB_PATH=./database/rifa.sqlite
```

5. Teste a aplicação:

```bash
npm start
```

## Produção com PM2

Instale o PM2:

```bash
sudo npm install -g pm2
```

Inicie o sistema:

```bash
pm2 start backend/server.js --name rifa-pedro-rocha
pm2 save
pm2 startup
```

Após executar `pm2 startup`, rode o comando exibido pelo próprio PM2 para habilitar inicialização automática.

Comandos úteis:

```bash
pm2 status
pm2 logs rifa-pedro-rocha
pm2 restart rifa-pedro-rocha
```

## Nginx como proxy reverso

Exemplo de configuração para apontar um domínio para a aplicação:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Depois, ative HTTPS com Certbot, se disponível no seu plano/servidor.

## Estrutura

```text
backend/
  controllers/
  middleware/
  routes/
  server.js
  config.js
database/
  db.js
frontend/
  public/
  admin/
```

## Administração

No painel `/admin`, o administrador pode:

- Enviar ou remover a imagem/banner da rifa.
- Enviar ou remover o QR Code PIX.
- Configurar chave PIX e nome do recebedor.
- Configurar link do sorteio ao vivo.
- Cadastrar número sorteado, ganhador e link de replay.
- Pesquisar por nome, telefone ou número.
- Alterar status entre disponível, reservado e vendido.
- Editar nome, telefone e observação.
- Liberar número e excluir reserva.

## API principal

- `GET /api/raffle` - dados públicos da rifa.
- `POST /api/reserve` - reserva números disponíveis.
- `GET /api/consult?phone=...` - consulta números por telefone.
- `POST /api/admin/login` - login administrativo.
- `GET /api/admin/dashboard` - dashboard protegido.
- `PUT /api/admin/tickets/:number` - edita número protegido.
- `DELETE /api/admin/tickets/:number` - libera número protegido.
- `PUT /api/admin/settings` - edita transmissão e resultado protegido.

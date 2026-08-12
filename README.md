# ChatApp — Base sólida em ASP.NET Core + SignalR + SQL Server

## Arquitetura

- **ASP.NET Core 8 (MVC + Web API)** — controllers MVC para páginas (login/registo/chat)
  e controllers API (`/api/...`) para as operações de dados.
- **SQL Server + Entity Framework Core** — persistência (utilizadores, amigos, mensagens,
  notificações, reuniões, chamadas).
- **ASP.NET Core Identity** — contas com e-mail, nome, foto e palavra-passe.
- **SignalR** — dois hubs:
  - `ChatHub` (`/hubs/chat`): mensagens em tempo real, presença online/offline, "a escrever...", notificações.
  - `CallHub` (`/hubs/call`): sinalização WebRTC (offer/answer/ICE) para chamadas 1-para-1 e salas de reunião.
- **WebRTC** (no browser) — o áudio/vídeo em si viaja diretamente entre os utilizadores (peer-to-peer);
  o servidor só troca as mensagens de "handshake". Isto é o que torna a solução escalável: o servidor
  não processa stream de vídeo, apenas sinalização + dados.
- **IFileStorageService** — abstração para upload de foto de perfil, áudio e ficheiros. Hoje grava em
  disco (`wwwroot/uploads`); pode ser trocada por Azure Blob Storage / Amazon S3 sem tocar nos controllers.

## Estrutura de pastas

```
ChatApp/
├── ChatApp.sln
└── ChatApp/
    ├── Controllers/       (Account, Friends, Messages, Notifications, Meetings, Home)
    ├── Data/               ApplicationDbContext.cs
    ├── DTOs/               objetos de entrada/saída da API
    ├── Hubs/               ChatHub.cs, CallHub.cs (SignalR)
    ├── Models/             entidades (ApplicationUser, Friendship, Message, Notification, Meeting, Call...)
    ├── Services/           FileStorageService, NotificationService
    ├── Views/              Razor views (Login, Register, Chat, Meeting)
    ├── wwwroot/            css/js/uploads
    ├── Program.cs
    └── appsettings.json
```

## Modelo de dados (resumo)

| Entidade | Finalidade |
|---|---|
| `ApplicationUser` | Conta (nome, e-mail, foto, palavra-passe via Identity, presença) |
| `Friendship` | Lista de amigos (pedido/aceite/rejeitado/bloqueado) |
| `Message` | Mensagens 1-para-1 (texto, áudio, imagem, ficheiro) |
| `Notification` | Notificações (pedido de amizade, mensagem nova, convite, chamada) |
| `Meeting` / `MeetingParticipant` | Reuniões/videoconferências com código de sala |
| `Call` / `CallParticipant` | Registo de chamadas (1-para-1 ou ligadas a uma reunião) |

## Como correr localmente

1. Instalar o [.NET 8 SDK](https://dotnet.microsoft.com/download) e o SQL Server (ou usar Docker: `mcr.microsoft.com/mssql/server`).
2. Ajustar a connection string em `ChatApp/appsettings.json`.
3. Criar a base de dados com as migrations do EF Core:

```bash
cd ChatApp/ChatApp
dotnet tool install --global dotnet-ef   # se ainda não tiver
dotnet ef migrations add InitialCreate
dotnet ef database update
```

4. Correr a aplicação:

```bash
dotnet run
```

5. Abrir `https://localhost:5001` (ou a porta indicada), criar conta e testar.

## Próximos passos para escalar em produção

- **Backplane do SignalR** (Redis ou Azure SignalR Service) quando houver mais de uma instância/servidor,
  para as mensagens em tempo real chegarem a todos os utilizadores independentemente do servidor a que
  estão ligados.
- **TURN server** (ex.: coturn) além do STUN, para chamadas funcionarem atrás de firewalls/NAT restritivos.
- **SFU** (ex.: mediasoup, LiveKit) para reuniões com muitas pessoas — a malha P2P atual (mesh) usada em
  `meeting.js` é ótima para grupos pequenos, mas cresce mal (cada participante liga a todos os outros).
- **Armazenamento de ficheiros em cloud** (Azure Blob / S3) trocando apenas a implementação de
  `IFileStorageService`.
- **Confirmação de e-mail** no registo (`options.SignIn.RequireConfirmedAccount = true`) e recuperação de palavra-passe.
- **Rate limiting** e paginação adicional nas listagens (já preparado nas mensagens).
- **Testes automatizados** (xUnit) para os controllers e hubs.

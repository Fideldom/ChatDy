"use strict";

// CHATAPP — CHANNEL INVITES, Pesquisa de utilizadores + envio de convites
const INVITES_API = "/api/channels";

let inviteSearchTimeout = null;

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  setupInviteSearch();
  setupInviteButtons();
});

// CONFIGURAR PESQUISA
function setupInviteSearch() {
  const input = document.getElementById("inviteSearchInput");

  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    clearTimeout(inviteSearchTimeout);

    const query = input.value.trim();

    if (query.length < 2) {
      renderInviteUsers([]);

      if (query.length === 0) {
        showInviteInitialMessage();
      } else {
        renderInviteInfo("Digite pelo menos 2 caracteres.");
      }

      return;
    }

    inviteSearchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 350);
  });
}

// CONFIGURAR BOTÕES
function setupInviteButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(
      "#btnInvite, " +
        "#btnInviteUser, " +
        "#inviteUserBtn, " +
        "#channelInviteBtn, " +
        "#btnChannelInvite, " +
        ".channel-invite-btn, " +
        ".btn-channel-invite, " +
        ".invite-user-btn",
    );

    if (!button) {
      return;
    }

    event.preventDefault();

    openChannelInvite();
  });
}

// ABRIR MODAL
function openChannelInvite() {
  if (!window.ChannelUI || !ChannelUI.canInvite()) {
    showInviteMessage(
      "Apenas administradores e o proprietário podem convidar membros.",
      "danger",
    );

    return;
  }

  const channelId = ChannelUI.getCurrentId();

  if (!channelId) {
    showInviteMessage("Nenhum canal selecionado.", "danger");

    return;
  }

  const modal = document.getElementById("channelInviteModal");

  if (!modal) {
    console.error("#channelInviteModal não encontrado.");
    return;
  }

  // Limpar pesquisa anterior
  const input = document.getElementById("inviteSearchInput");

  if (input) {
    input.value = "";
  }

  // Limpar lista
  renderInviteUsers([]);

  // Mostrar mensagem inicial
  showInviteInitialMessage();

  // Abrir modal Bootstrap
  if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
    const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);

    bootstrapModal.show();
  } else {
    console.error("Bootstrap Modal não está disponível.");
  }

  // Focar automaticamente na pesquisa
  setTimeout(() => {
    if (input) {
      input.focus();
    }
  }, 300);
}

// PESQUISAR UTILIZADORES
async function searchUsers(query) {
  if (!query || query.length < 2) {
    return;
  }

  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  renderInviteLoading();

  try {
    const response = await fetch(
      `${INVITES_API}/users/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        credentials: "same-origin",
      },
    );

    // Sessão expirada
    if (response.status === 401) {
      renderInviteError("Sua sessão expirou. Faça login novamente.");

      return;
    }

    // Outros erros
    if (!response.ok) {
      let message = "Não foi possível pesquisar utilizadores.";

      try {
        const data = await response.json();

        if (data?.message) {
          message = data.message;
        }
      } catch {
        // Resposta não era JSON
      }

      throw new Error(message);
    }

    const users = await response.json();

    if (!Array.isArray(users)) {
      renderInviteError("Resposta inválida do servidor.");

      return;
    }

    renderInviteUsers(users);
  } catch (error) {
    console.error("Erro ao pesquisar utilizadores:", error);

    renderInviteError(
      error.message || "Não foi possível pesquisar utilizadores.",
    );
  }
}

// RENDERIZAR UTILIZADORES
function renderInviteUsers(users) {
  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (!Array.isArray(users) || users.length === 0) {
    list.innerHTML = `
            <div class="text-center text-muted py-4">

                <i class="bi bi-person-x fs-3 d-block mb-2"></i>

                <div>
                    Nenhum utilizador encontrado.
                </div>

            </div>
        `;

    return;
  }

  const fragment = document.createDocumentFragment();

  users.forEach((user) => {
    const element = createInviteUserElement(user);

    fragment.appendChild(element);
  });

  list.appendChild(fragment);
}

// CRIAR ELEMENTO DO UTILIZADOR
function createInviteUserElement(user) {
  const item = document.createElement("div");

  item.className = "invite-user-item";

  const userId = String(user?.id || "");

  const fullNameRaw = user?.fullName || user?.userName || "Utilizador";

  const usernameRaw = user?.userName || "";

  const fullName = escapeInviteHtml(fullNameRaw);

  const username = escapeInviteHtml(usernameRaw);

  const photoUrl = user?.profilePhotoUrl ? String(user.profilePhotoUrl).trim() : "";

  const initial = getUserInitial(fullNameRaw);

  // AVATAR
  let avatarHtml;

  if (photoUrl) {
    // Utilizador possui foto
    avatarHtml = `
            <img src="${escapeInviteHtml(photoUrl)}" alt="${fullName}" class="invite-user-avatar" loading="lazy"
                onerror="this.onerror=null; this.src='/images/default-avatar.png'; this.classList.add('invite-default-avatar');"/>
        `;
  } else {
    // Utilizador não possui foto
    // Carrega diretamente a imagem padrão
    avatarHtml = `
            <img src="/images/default-avatar.png" alt="${fullName}" class="invite-user-avatar invite-default-avatar"
                loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('d-none');"/>

            <div class="invite-user-avatar invite-user-avatar-placeholder d-none" aria-hidden="true">
                ${initial}
            </div>
        `;
  }

  // HTML DO UTILIZADOR
  item.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            ${avatarHtml}
            <div class="invite-user-info">

                <strong class="invite-user-name">
                    ${fullName}
                </strong>

                ${username
                    ? ` <small class="text-muted d-block">
                             @${username}
                        </small>
                      `
                    : ""
                }

            </div>

        </div>

        <button type="button" class="btn btn-sm btn-primary invite-send-btn" data-user-id="${escapeInviteHtml(userId)}">

            <i class="bi bi-person-plus me-1"></i>

            Convidar

        </button>
    `;

  return item;
}

// CLICAR EM "CONVIDAR"
document.addEventListener("click", async (event) => {
  const button = event.target.closest(".invite-send-btn");

  if (!button) {
    return;
  }

  event.preventDefault();

  const userId = button.dataset.userId;

  if (!userId) {
    showInviteMessage("Utilizador inválido.", "danger");

    return;
  }

  // Evitar duplo clique
  if (button.disabled) {
    return;
  }

  button.disabled = true;

  const originalHtml = button.innerHTML;

  button.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-1"
                aria-hidden="true">
            </span>

            Enviando...
        `;

  try {
    await sendChannelInvite(userId);

    button.innerHTML = `
                <i class="bi bi-check-lg me-1"></i>
                Enviado
            `;

    button.classList.remove("btn-primary");

    button.classList.add("btn-success");
  } catch (error) {
    console.error("Erro ao enviar convite:", error);

    button.disabled = false;

    button.innerHTML = originalHtml;
  }
});

// ENVIAR CONVITE
async function sendChannelInvite(userId) {
  // Verificar permissão
  if (!window.ChannelUI || !ChannelUI.canInvite()) {
    const error = new Error("Você não possui permissão para convidar.");

    showInviteMessage(error.message, "danger");

    throw error;
  }

  // Obter canal atual
  const channelId = ChannelUI.getCurrentId();

  if (!channelId) {
    const error = new Error("Nenhum canal selecionado.");

    showInviteMessage(error.message, "danger");

    throw error;
  }

  // Verificar utilizador
  if (!userId) {
    const error = new Error("Selecione um usuário.");

    showInviteMessage(error.message, "warning");

    throw error;
  }

  try {
    const response = await fetch(
      `${INVITES_API}/${encodeURIComponent(channelId)}/invites`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        credentials: "same-origin",

        body: JSON.stringify({
          userId: userId,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Não foi possível enviar o convite.");
    }

    showInviteMessage("Convite enviado com sucesso.", "success");

    return data;
  } catch (error) {
    console.error("Erro ao enviar convite:", error);

    showInviteMessage(
      error.message || "Não foi possível enviar o convite.",
      "danger",
    );

    throw error;
  }
}

// MENSAGEM INICIAL
function showInviteInitialMessage() {
  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  list.innerHTML = `
        <div class="text-center text-muted py-4">

            <i class="bi bi-search fs-3 d-block mb-2"></i>

            <div>
                Pesquise um utilizador para convidar.
            </div>

        </div>
    `;
}

// LOADING

function renderInviteLoading() {
  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  list.innerHTML = `
        <div class="text-center py-4">

            <div
                class="spinner-border text-primary"
                role="status"
                aria-hidden="true">
            </div>

            <div class="text-muted mt-2">
                Pesquisando utilizadores...
            </div>

        </div>
    `;
}

// INFO
function renderInviteInfo(message) {
  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  list.innerHTML = `
        <div class="text-center text-muted py-4">
            ${escapeInviteHtml(message)}
        </div>
    `;
}

// ERRO
function renderInviteError(message) {
  const list = document.getElementById("inviteUsersList");

  if (!list) {
    return;
  }

  list.innerHTML = `
        <div class="text-center text-danger py-4">

            <i
                class="bi bi-exclamation-circle fs-3 d-block mb-2">
            </i>

            <div>
                ${escapeInviteHtml(message)}
            </div>

        </div>
    `;
}

// MENSAGEM GLOBAL
function showInviteMessage(message, type = "info") {
  if (typeof showPostMessage === "function") {
    showPostMessage(message, type);

    return;
  }

  // Fallback
  alert(message);
}

// OBTER INICIAL

function getUserInitial(name) {
  const value = String(name || "").trim();

  if (!value) {
    return "U";
  }

  return value.charAt(0).toUpperCase();
}

// ESCAPAR HTML
function escapeInviteHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// API GLOBAL
window.ChannelInvites = {
  open: openChannelInvite,

  search: searchUsers,

  send: sendChannelInvite,
};

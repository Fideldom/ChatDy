"use strict";

//  CHATAPP — CHANNELS  Controller principal dos canais PhotoUrl 
document.addEventListener("DOMContentLoaded", () => {
  initializeChannels();
});

const API_BASE = "/api/channels";

let currentChannel = null;
let channelSearchTimeout = null;

/* INICIALIZAÇÃO*/
async function initializeChannels() {
  setupChannelEvents();
  setupMobileNavigation();
  setupChannelSearch();

  await Promise.allSettled([loadMyChannels(), loadDiscoverChannels()]);
}

/* EVENTOS */
function setupChannelEvents() {
  document.addEventListener("click", async (event) => {
    //ABRIR CANAL
    const openButton = event.target.closest(".channel-open-btn");

    if (openButton) {
      event.preventDefault();

      const channelId = openButton.dataset.channelId;

      if (!channelId) {
        console.error("ID do canal não encontrado.");

        return;
      }

      await openChannel(channelId);

      return;
    }

    // CARD
    const card = event.target.closest(".channel-card");

    if (card) {
      if (event.target.closest(".channel-open-btn")) {
        return;
      }

      const channelId = card.dataset.channelId;

      if (channelId) {
        await openChannel(channelId);
      }

      return;
    }

    // VOLTAR
    const backButton = event.target.closest("#btnBackToChannels");

    if (backButton) {
      event.preventDefault();

      closeChannel();

      return;
    }
  });
}

// MEUS CANAIS
async function loadMyChannels() {
  const container = document.getElementById("myChannelsList");

  if (!container) return;

  showChannelsLoading(container);

  try {
    const response = await fetch(`${API_BASE}/my`, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      credentials: "same-origin",
    });

    if (response.status === 401) {
      renderChannelError(container, "Sessão expirada. Faça login novamente.");

      return;
    }

    if (!response.ok) {
      throw new Error(`Erro ao carregar canais: ${response.status}`);
    }

    const channels = await response.json();

    renderMyChannels(channels);
  } catch (error) {
    console.error("Erro ao carregar meus canais:", error);

    renderChannelError(container, "Não foi possível carregar os seus canais.");
  }
}

// DESCOBRIR
async function loadDiscoverChannels() {
  const container = document.getElementById("discoverChannelsList");

  if (!container) return;

  showChannelsLoading(container);

  try {
    const response = await fetch(`${API_BASE}/discover`, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      credentials: "same-origin",
    });

    if (response.status === 401) {
      renderChannelError(container, "Sessão expirada. Faça login novamente.");

      return;
    }

    if (!response.ok) {
      throw new Error(`Erro ao descobrir canais: ${response.status}`);
    }

    const channels = await response.json();

    renderDiscoverChannels(channels);
  } catch (error) {
    console.error("Erro ao descobrir canais:", error);

    renderChannelError(container, "Não foi possível carregar os canais.");
  }
}

// LOADING
function showChannelsLoading(container) {
  container.innerHTML = `
        <div class="channel-loading">

            <div class="channel-skeleton">
                <span></span>

                <div>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <div class="channel-skeleton">
                <span></span>

                <div>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <div class="channel-skeleton">
                <span></span>

                <div>
                    <span></span>
                    <span></span>
                </div>
            </div>

        </div>
    `;
}

// ERRO
function renderChannelError(container, message) {
  container.innerHTML = `
        <div class="channel-error-state">

            <div class="channel-state-icon">

                <i class="bi bi-exclamation-circle"></i>

            </div>

            <p>
                ${escapeHtml(message)}
            </p>

            <button type="button" class="btn btn-sm btn-outline-primary" onclick="reloadChannels()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Tentar novamente
            </button>

        </div>
    `;
}

// RELOAD
async function reloadChannels() {
  await Promise.allSettled([loadMyChannels(), loadDiscoverChannels()]);
}

// RENDER MEUS CANAIS
function renderMyChannels(channels) {
  const container = document.getElementById("myChannelsList");

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(channels) || channels.length === 0) {
    container.innerHTML = `
            <div class="empty-channel-state">

                <div class="channel-state-icon">

                    <i class="bi bi-broadcast"></i>

                </div>

                <p>
                    Você ainda não participa
                    de nenhum canal.
                </p>

            </div>
        `;

    return;
  }

  const fragment = document.createDocumentFragment();

  channels.forEach((channel) => {
    fragment.appendChild(createChannelElement(channel, true));
  });

  container.appendChild(fragment);
}

// RENDER DESCOBRIR
function renderDiscoverChannels(channels) {
  const container = document.getElementById("discoverChannelsList");

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(channels) || channels.length === 0) {
    container.innerHTML = `
            <div class="empty-channel-state">

                <div class="channel-state-icon">

                    <i class="bi bi-compass"></i>

                </div>

                <p>
                    Nenhum canal público disponível.
                </p>

            </div>
        `;

    return;
  }

  const fragment = document.createDocumentFragment();

  channels.forEach((channel) => {
    fragment.appendChild(createChannelElement(channel, false));
  });

  container.appendChild(fragment);
}

// ROLE
function normalizeChannelRole(channel) {
  if (!channel) {
    return "Member";
  }

  if (channel.isOwner === true) {
    return "Owner";
  }

  const role = channel.role;

  if (typeof role === "string") {
    const normalized = role.trim().toLowerCase();

    if (normalized === "owner") {
      return "Owner";
    }

    if (normalized === "admin") {
      return "Admin";
    }

    return "Member";
  }

  if (typeof role === "number") {
    if (role === 2) {
      return "Owner";
    }

    if (role === 1) {
      return "Admin";
    }

    return "Member";
  }

  return "Member";
}

// PERMISSÕES
function getChannelPermissions(channel) {
  const role = normalizeChannelRole(channel);

  const isOwner = role === "Owner";

  const isAdmin = role === "Admin";

  const isMember = role === "Member";

  return {
    role,
    isMember,
    isAdmin,
    isOwner,
    canPublish: isAdmin || isOwner,
    canViewMembers: isAdmin || isOwner,
    canManageSettings: isOwner,
    canInvite: isAdmin || isOwner,
    canDeleteChannel: isOwner,
    canEditChannel: isOwner,
    canManageMembers: isAdmin || isOwner,
  };
}

// APLICAR PERMISSÕES
function applyChannelPermissions(channel) {
  if (!channel) return;

  const permissions = getChannelPermissions(channel);

  window.currentChannelPermissions = permissions;

  const channelView = document.getElementById("channelView");

  if (channelView) {
    channelView.dataset.role = permissions.role;

    channelView.classList.toggle("channel-owner", permissions.isOwner);

    channelView.classList.toggle("channel-admin", permissions.isAdmin);

    channelView.classList.toggle("channel-member", permissions.isMember);
  }

  // PUBLICAR
  setElementsVisibility(
    [
      "#createPostBox",
      "#createPostContainer",
      "#createPostSection",
      "#publishPostBox",
      "#publishPostContainer",
      ".create-post-box",
      ".create-post-container",
      ".create-post-section",
      ".publish-post-box",
      ".publish-post-container",
      "[data-channel-permission='publish']",
    ],
    permissions.canPublish,
  );

  // BOTÃO PUBLICAR
  setElementsVisibility(
    [
      "#btnCreatePost",
      "#btnPublishPost",
      "#publishPostBtn",
      "[data-channel-permission='publish-button']",
    ],
    permissions.canPublish,
  );

  // MEMBROS
  setElementsVisibility(
    [
      "#btnMembers",
      "#btnChannelMembers",
      "#channelMembersButton",
      "#membersButton",
      "#viewMembersBtn",
      ".btn-channel-members",
      ".channel-members-btn",
      ".view-members-btn",
      "[data-channel-permission='members']",
      "[data-channel-action='members']",
      "[data-action='members']",
    ],
    permissions.canViewMembers,
  );

  // CONVIDAR
  setElementsVisibility(
    [
      "#btnInvite",
      "#btnInviteUser",
      "#inviteUserBtn",
      "#channelInviteBtn",
      "#btnChannelInvite",
      ".channel-invite-btn",
      ".btn-channel-invite",
      ".invite-user-btn",
      "[data-channel-permission='invite']",
      "[data-channel-action='invite']",
      "[data-action='invite']",
    ],
    permissions.canInvite,
  );

  // CONFIGURAÇÕES
  setElementsVisibility(
    [
      "#btnChannelSettings",
      "#channelSettingsBtn",
      "#settingsChannelBtn",
      "#channelSettings",
      "#btnSettings",
      "#settingsBtn",
      ".channel-settings-btn",
      ".btn-channel-settings",
      ".channel-config-btn",
      "[data-channel-permission='settings']",
      "[data-channel-action='settings']",
      "[data-action='settings']",
    ],
    permissions.canManageSettings,
  );

  console.log("Permissões do canal:", permissions);
}

// VISIBILIDADE
function setElementsVisibility(selectors, visible) {
  const elements = [];

  selectors.forEach((selector) => {
    try {
      document.querySelectorAll(selector).forEach((element) => {
        if (!elements.includes(element)) {
          elements.push(element);
        }
      });
    } catch {
      console.warn("Seletor inválido:", selector);
    }
  });

  elements.forEach((element) => {
    if (visible) {
      element.classList.remove("d-none");

      element.removeAttribute("aria-hidden");

      element.removeAttribute("disabled");
    } else {
      element.classList.add("d-none");

      element.setAttribute("aria-hidden", "true");

      if (
        element.tagName === "BUTTON" ||
        element.tagName === "INPUT" ||
        element.tagName === "SELECT" ||
        element.tagName === "TEXTAREA"
      ) {
        element.setAttribute("disabled", "disabled");
      }
    }
  });
}

// CARD```javascript
function createChannelElement(channel, isMember) {
  const article = document.createElement("article");

  article.className = "channel-card";

  article.dataset.channelId = channel.id;

  const role = normalizeChannelRole(channel);

  article.dataset.role = role;

  const channelName = escapeHtml(channel.name || "Canal sem nome");

  const description = escapeHtml(channel.description || "Sem descrição.");

  const memberCount = Number(channel.memberCount || 0);

  // Inicial do canal
  const initial = String(channel.name || "C").trim().charAt(0).toUpperCase() || "C";

  // FOTO / INICIAL DO CANAL
  let photo;

  const photoUrl = channel.photoUrl ? String(channel.photoUrl).trim() : "";

  if (photoUrl) {
    // Se o canal possui foto
    photo = `
            <img src="${escapeHtml(photoUrl)}" alt="${channelName}" class="channel-card-photo" loading="lazy"
                onerror=" this.style.display='none'; this.nextElementSibling.classList.remove('d-none'); "/>

            <div class="channel-card-photo-placeholder d-none" aria-hidden="true">
                ${initial}
            </div>
        `;
  } else {
    // Se o canal não possui foto
    photo = `
            <div class="channel-card-photo-placeholder" aria-hidden="true">
                ${initial}
            </div>
        `;
  }

  // HTML DO CARD
  article.innerHTML = `
        <div class="channel-card-header">
            ${photo}
            <div class="channel-card-info">

                <h3 title="${channelName}">
                    ${channelName}
                </h3>

                <div class="channel-card-meta">

                    <span>
                        <i class="bi bi-${channel.isPrivate ? "lock" : "globe2"}"></i>

                        ${channel.isPrivate ? "Privado" : "Público"}
                    </span>

                </div>

            </div>

        </div>

        <p class="channel-card-description">
            ${description}
        </p>

        <div class="channel-card-footer">

            <span class="channel-member-count">

                <i class="bi bi-people"></i>

                ${memberCount}

                ${memberCount === 1 ? "membro" : "membros"}

            </span>

            <button type="button" class="channel-open-btn" data-channel-id="${escapeHtml(channel.id)}">

                ${isMember ? ` <i class="bi bi-box-arrow-in-right"></i> Abrir `
                           : ` <i class="bi bi-eye"></i> Ver canal `
                }

            </button>

        </div>
    `;

  return article;
}

// PESQUISA
function setupChannelSearch() {
  const input = document.getElementById("channelSearchInput");

  if (!input) return;

  input.addEventListener("input", () => {
    clearTimeout(channelSearchTimeout);

    channelSearchTimeout = setTimeout(() => {
      filterChannels(input.value);
    }, 250);
  });
}

function filterChannels(searchTerm) {
  const term = String(searchTerm || "")
    .trim()
    .toLowerCase();

  document.querySelectorAll(".channel-card").forEach((card) => {
    const name =
      card.querySelector(".channel-card-info h3")?.textContent?.toLowerCase() ||
      "";

    const description =
      card
        .querySelector(".channel-card-description")
        ?.textContent?.toLowerCase() || "";

    const visible = !term || name.includes(term) || description.includes(term);

    card.style.display = visible ? "" : "none";
  });
}

// ABRIR CANAL
async function openChannel(channelId) {
  if (!channelId) return;

  const channelView = document.getElementById("channelView");

  const emptyView = document.getElementById("channelEmpty");

  if (!channelView) {
    console.error("#channelView não encontrado.");

    return;
  }

  if (channelView.dataset.loading === "true") {
    return;
  }

  channelView.dataset.loading = "true";

  showChannelLoading();

  try {
    const response = await fetch(
      `${API_BASE}/${encodeURIComponent(channelId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
      },
    );

    if (response.status === 401) {
      showChannelError("Sua sessão expirou. Faça login novamente.");

      return;
    }

    if (response.status === 403 || response.status === 404) {
      showChannelError("Canal não encontrado ou você não possui permissão.");

      return;
    }

    if (!response.ok) {
      throw new Error(`Erro ao abrir canal: ${response.status}`);
    }

    const channel = await response.json();

    currentChannel = channel;

    window.currentChannelId = channel.id;

    showChannel(channel);
  } catch (error) {
    console.error("Erro ao abrir canal:", error);

    showChannelError("Não foi possível abrir este canal.");
  } finally {
    channelView.dataset.loading = "false";
  }
}

// LOADING CANAL
function showChannelLoading() {
  const emptyView = document.getElementById("channelEmpty");

  const channelView = document.getElementById("channelView");

  if (emptyView) {
    emptyView.classList.add("d-none");
  }

  if (channelView) {
    channelView.classList.remove("d-none");
  }

  const name = document.getElementById("channelName");

  if (name) {
    name.textContent = "Carregando canal...";
  }
}

// ERRO
function showChannelError(message) {
  const emptyView = document.getElementById("channelEmpty");

  const channelView = document.getElementById("channelView");

  if (channelView) {
    channelView.classList.remove("d-none");

    channelView.innerHTML = `
            <div class="channel-error-view">

                <div class="channel-state-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>

                <h3>Não foi possível abrir o canal</h3>

                <p>${escapeHtml(message)}</p>

                <button type="button" class="btn btn-primary" id="btnBackToChannels">
                    <i class="bi bi-arrow-left me-1"></i>
                    Voltar aos canais
                </button>

            </div>
        `;
  }

  if (emptyView) {
    emptyView.classList.add("d-none");
  }
}

// MOSTRAR CANAL
function showChannel(channel) {
  const emptyView = document.getElementById("channelEmpty");

  const channelView = document.getElementById("channelView");

  if (!channelView) return;

  if (emptyView) {
    emptyView.classList.add("d-none");
  }

  channelView.classList.remove("d-none");

  const name = document.getElementById("channelName");

  if (name) {
    name.textContent = channel.name || "Canal";
  }

  const description = document.getElementById("channelDescription");

  if (description) {
    description.textContent = channel.description || "Sem descrição.";
  }

  const members = document.getElementById("channelMembers");

  if (members) {
    const count = Number(channel.memberCount || 0);

    members.textContent = `${count} ${count === 1 ? "membro" : "membros"}`;
  }

  const photo = document.getElementById("channelPhoto");

  if (photo) {
    photo.onerror = function () {
      this.onerror = null;

      this.src = "/images/default-channel.png";
    };

    photo.src = channel.photoUrl || "/images/default-channel.png";

    photo.alt = channel.name || "Canal";
  }

  currentChannel = channel;

  window.currentChannelId = channel.id;

  applyChannelPermissions(channel);

  const app = document.querySelector(".channel-app");

  if (app) {
    app.classList.add("channel-open");
  }

  if (window.ChannelPosts && typeof window.ChannelPosts.load === "function") {
    window.ChannelPosts.load(channel.id);
  }
}

// FECHAR
function closeChannel() {
  const app = document.querySelector(".channel-app");

  const emptyView = document.getElementById("channelEmpty");

  const channelView = document.getElementById("channelView");

  if (app) {
    app.classList.remove("channel-open");
  }

  if (channelView) {
    channelView.classList.add("d-none");
  }

  if (emptyView) {
    emptyView.classList.remove("d-none");
  }

  currentChannel = null;
  window.currentChannelId = null;
  window.currentChannelPermissions = null;
}

// MOBILE
function setupMobileNavigation() {
  document.addEventListener("click", (event) => {
    const back = event.target.closest("#btnBackToChannels");

    if (!back) return;

    event.preventDefault();

    closeChannel();
  });
}

// UTILITÁRIOS
function escapeHtml(value) {
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

function getCurrentChannelId() {
  return window.currentChannelId || currentChannel?.id || null;
}

function getCurrentChannel() {
  return currentChannel;
}

function getCurrentChannelRole() {
  return normalizeChannelRole(currentChannel);
}

function getCurrentChannelPermissions() {
  return getChannelPermissions(currentChannel);
}

function canCurrentUserPublish() {
  return getCurrentChannelPermissions().canPublish;
}

function canCurrentUserViewMembers() {
  return getCurrentChannelPermissions().canViewMembers;
}

function canCurrentUserManageSettings() {
  return getCurrentChannelPermissions().canManageSettings;
}

function canCurrentUserInvite() {
  return getCurrentChannelPermissions().canInvite;
}

function isCurrentUserOwner() {
  return getCurrentChannelPermissions().isOwner;
}

function isCurrentUserAdmin() {
  return getCurrentChannelPermissions().isAdmin;
}

// PUBLICAÇÃO
async function createChannelPost(content, imageUrl = null) {
  if (!canCurrentUserPublish()) {
    throw new Error("Apenas administradores e o proprietário podem publicar.");
  }

  const channelId = getCurrentChannelId();

  if (!channelId) {
    throw new Error("Nenhum canal selecionado.");
  }

  const response = await fetch("/api/posts", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      Accept: "application/json",
    },

    credentials: "same-origin",

    body: JSON.stringify({
      channelId,
      content: content || "",
      imageUrl: imageUrl || null,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível publicar.");
  }

  return data;
}

// API GLOBAL
window.ChannelUI = {
  open: openChannel,
  close: closeChannel,
  reload: reloadChannels,
  getCurrentId: getCurrentChannelId,
  getCurrent: getCurrentChannel,
  getRole: getCurrentChannelRole,
  getPermissions: getCurrentChannelPermissions,
  canPublish: canCurrentUserPublish,
  canViewMembers: canCurrentUserViewMembers,
  canManageSettings: canCurrentUserManageSettings,
  canInvite: canCurrentUserInvite,
  isOwner: isCurrentUserOwner,
  isAdmin: isCurrentUserAdmin,
  openCreatePost: typeof openCreatePost === "function" ? openCreatePost : null,
  createPost: createChannelPost,
  applyPermissions: applyChannelPermissions,
};

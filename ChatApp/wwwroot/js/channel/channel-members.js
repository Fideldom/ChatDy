"use strict";

// CHATAPP — CHANNEL MEMBERS, Gestão e visualização de membros

const MEMBERS_API = "/api/channels";

// ABRIR MEMBROS
async function openChannelMembers() {
  if (!ChannelUI.canViewMembers()) {
    showMembersMessage(
      "Você não possui permissão para ver os membros.",
      "danger",
    );

    return;
  }

  const channelId = ChannelUI.getCurrentId();

  if (!channelId) {
    showMembersMessage("Nenhum canal selecionado.", "danger");

    return;
  }

  const modal = document.getElementById("channelMembersModal");

  if (modal) {
    const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);

    bootstrapModal.show();
  }

  await loadChannelMembers(channelId);
}

// CARREGAR MEMBROS
async function loadChannelMembers(channelId) {
  const container = document.getElementById("channelMembersList");

  if (!container) {
    console.warn("#channelMembersList não encontrado.");

    return;
  }

  container.innerHTML = `
        <div class="text-center py-4">

            <div
                class="spinner-border text-primary"
                role="status">
            </div>

            <p class="mt-2 mb-0">
                Carregando membros...
            </p>

        </div>
    `;

  try {
    const response = await fetch(
      `${MEMBERS_API}/${encodeURIComponent(channelId)}/members`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Não foi possível carregar os membros.");
    }

    renderChannelMembers(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao carregar membros:", error);

    container.innerHTML = `
            <div class="alert alert-danger">
                ${escapeMembersHtml(error.message)}
            </div>
        `;
  }
}

// RENDER
function renderChannelMembers(members) {
  const container = document.getElementById("channelMembersList");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!members.length) {
    container.innerHTML = `
            <div class="text-center py-4">

                <i class="bi bi-people fs-1"></i>

                <p class="mt-2">
                    Nenhum membro encontrado.
                </p>
            </div>

        `;

    return;
  }

  const fragment = document.createDocumentFragment();

  members.forEach((member) => {
    const element = document.createElement("div");

    element.className = "channel-member-item";

    const name = escapeMembersHtml(
      member.userName || member.fullName || member.name || "Usuário",
    );

    const photo =
      member.profilePhotoUrl ||
      member.userPhotoUrl ||
      "/images/default-avatar.png";

    const role = normalizeMemberRole(member.role);

    element.innerHTML = `
            <img src="${escapeMembersHtml(photo)}" alt="${name}" class="channel-member-photo" onerror="this.src='/images/default-avatar.png';">

            <div class="channel-member-info">

                <strong>${name}</strong>

                <small>${role}</small>

            </div>

        `;

    fragment.appendChild(element);
  });

  container.appendChild(fragment);
}

// NORMALIZAR ROLE
function normalizeMemberRole(role) {
  if (typeof role === "string") {
    const value = role.trim().toLowerCase();

    if (value === "owner") return "Proprietário";

    if (value === "admin") return "Administrador";

    return "Membro";
  }

  if (typeof role === "number") {
    if (role === 2) return "Proprietário";

    if (role === 1) return "Administrador";
  }

  return "Membro";
}

// MENSAGEM
function showMembersMessage(message, type = "info") {
  if (typeof showPostMessage === "function") {
    showPostMessage(message, type);

    return;
  }

  alert(message);
}

// ESCAPE
function escapeMembersHtml(value) {
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

// EVENTO
document.addEventListener("click", (event) => {
  const button = event.target.closest(
    "#btnMembers, #btnChannelMembers, #channelMembersButton, #membersButton, #viewMembersBtn, .channel-members-btn",
  );

  if (!button) {
    return;
  }

  event.preventDefault();

  openChannelMembers();
});

// GLOBAL
window.ChannelMembers = {
  open: openChannelMembers,

  load: loadChannelMembers,
};

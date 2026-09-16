"use strict";

// CHATAPP — CHANNEL SETTINGS * Configurações do canal

// ABRIR CONFIGURAÇÕES
function openChannelSettings() {
  if (!ChannelUI.canManageSettings()) {
    showSettingsMessage(
      "Apenas o proprietário pode acessar as configurações.",
      "danger",
    );

    return;
  }

  const channel = ChannelUI.getCurrent();

  if (!channel) {
    showSettingsMessage("Nenhum canal selecionado.", "danger");

    return;
  }

  fillChannelSettingsForm(channel);

  const modal = document.getElementById("channelSettingsModal");

  if (modal) {
    const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);

    bootstrapModal.show();
  }
}

// PREENCHER FORMULÁRIO
function fillChannelSettingsForm(channel) {
  const name = document.querySelector("#channelSettingsForm [name='name']");

  const description = document.querySelector(
    "#channelSettingsForm [name='description']",
  );

  const photoUrl = document.querySelector(
    "#channelSettingsForm [name='photoUrl'], #channelSettingsForm [name='photo_url']",
  );

  const isPrivate = document.querySelector(
    "#channelSettingsForm [name='isPrivate'], #channelSettingsForm [name='is_private']",
  );

  if (name) {
    name.value = channel.name || "";
  }

  if (description) {
    description.value = channel.description || "";
  }

  if (photoUrl) {
    photoUrl.value = channel.photoUrl || "";
  }

  if (isPrivate) {
    isPrivate.checked = channel.isPrivate === true;
  }
}

// EVENTO
document.addEventListener("click", (event) => {
  const button = event.target.closest(
    "#btnChannelSettings, #channelSettingsBtn, #settingsChannelBtn, #channelSettings, #btnSettings, #settingsBtn, .channel-settings-btn, .channel-config-btn",
  );

  if (!button) {
    return;
  }

  event.preventDefault();

  openChannelSettings();
});

// MENSAGEM
function showSettingsMessage(message, type = "info") {
  if (typeof showPostMessage === "function") {
    showPostMessage(message, type);

    return;
  }

  alert(message);
}

// GLOBAL
window.ChannelSettings = {
  open: openChannelSettings,
};

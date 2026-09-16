"use strict";

document.addEventListener("DOMContentLoaded", () => {
  setupCreateChannel();
});

// CRIAR CANAL
function setupCreateChannel() {
  const createButton = document.getElementById("btnCreateChannel");
  const newChannelButton = document.getElementById("btnNewChannel");
  const emptyCreateButton = document.getElementById("btnEmptyCreateChannel");

  if (!createButton) {
    console.warn("#btnCreateChannel não encontrado.");
    return;
  }

  // Abrir modal pelo botão da sidebar
  if (newChannelButton) {
    newChannelButton.addEventListener("click", () => {
      openCreateChannelModal();
    });
  }

  // Abrir modal pelo botão da tela vazia
  if (emptyCreateButton) {
    emptyCreateButton.addEventListener("click", () => {
      openCreateChannelModal();
    });
  }

  // Criar canal
  createButton.addEventListener("click", createChannel);
}

// ABRIR MODAL
function openCreateChannelModal() {
  const modalElement = document.getElementById("newChannelModal");

  if (!modalElement) {
    console.error("#newChannelModal não encontrado.");
    return;
  }

  if (!window.bootstrap) {
    console.error("Bootstrap não está carregado.");
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

  modal.show();
}

// CRIAR CANAL
async function createChannel() {
  const button = document.getElementById("btnCreateChannel");

  const nameInput = document.getElementById("newChannelName");

  const descriptionInput = document.getElementById("newChannelDescription");

  const photoInput = document.getElementById("newChannelPhoto");

  const privateInput = document.getElementById("channelPrivate");

  const name = nameInput?.value?.trim();

  const description = descriptionInput?.value?.trim() || null;

  const isPrivate = privateInput?.checked === true;

  // VALIDAR NOME

  if (!name) {
    alert("Digite o nome do canal.");

    nameInput?.focus();

    return;
  }

  // BLOQUEAR BOTÃO
  if (button) {
    button.disabled = true;

    button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1"></span>
            Criando...
        `;
  }

  try {
    /*
      Neste momento o backend recebe PhotoUrl como string.
      Como o HTML usa upload de arquivo, não vamos enviar
      o arquivo diretamente para PhotoUrl.    
      Primeiro criamos o canal sem foto.    
      Depois podemos implementar o upload da foto.
     */

    const dto = {
      Name: name,
      Description: description,
      PhotoUrl: null,
      IsPrivate: isPrivate,
    };

    console.log("Criando canal:", dto);

    const response = await fetch("/api/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      credentials: "same-origin",

      body: JSON.stringify(dto),
    });

    const data = await response.json().catch(() => null);

    console.log("Resposta criação canal:", response.status, data);

    // NÃO AUTENTICADO
    if (response.status === 401) {
      alert("Sua sessão expirou. Faça login novamente.");

      return;
    }

    // ERRO
    if (!response.ok) {
      const message = data?.message || data?.error || "Não foi possível criar o canal.";

      throw new Error(message);
    }

    // SUCESSO
    console.log("Canal criado com sucesso:", data);

    // FECHAR MODAL
    const modalElement = document.getElementById("newChannelModal");

    if (modalElement && window.bootstrap) {
      const modal =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);

      modal.hide();
    }

    // LIMPAR FORMULÁRIO
    resetCreateChannelForm();

    // ATUALIZAR LISTA
    if (window.ChannelUI) {
      await window.ChannelUI.reload();
    }

    // ABRIR CANAL CRIADO 
    if (data?.id && window.ChannelUI) {
      await window.ChannelUI.open(data.id);
    }
  } catch (error) {
    console.error("Erro ao criar canal:", error);

    alert(error.message || "Erro ao criar canal.");
  } finally {
    if (button) {
      button.disabled = false;

      button.innerHTML = `
                <i class="bi bi-plus-circle me-1"></i>
                Criar canal
            `;
    }
  }
}

// LIMPAR FORMULÁRIO 
function resetCreateChannelForm() {
  const nameInput = document.getElementById("newChannelName");

  const descriptionInput = document.getElementById("newChannelDescription");

  const photoInput = document.getElementById("newChannelPhoto");

  const publicInput = document.getElementById("channelPublic");

  const preview = document.getElementById("newChannelPhotoPreview");

  if (nameInput) {
    nameInput.value = "";
  }

  if (descriptionInput) {
    descriptionInput.value = "";
  }

  if (photoInput) {
    photoInput.value = "";
  }

  if (publicInput) {
    publicInput.checked = true;
  }

  if (preview) {
    preview.src = "/images/default-channel.png";
  }
}

// PREVIEW DA FOTO
document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("newChannelPhoto");

  const preview = document.getElementById("newChannelPhotoPreview");

  if (!photoInput || !preview) {
    return;
  }

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];

    if (!file) {
      preview.src = "/images/default-channel.png";

      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Selecione uma imagem válida.");

      photoInput.value = "";

      preview.src = "/images/default-channel.png";

      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      preview.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
});

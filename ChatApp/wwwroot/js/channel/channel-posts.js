"use strict";

/*
 * CHATAPP — CHANNEL POSTS
 * Publicações dos canais
 */

const POSTS_API = "/api/posts";

document.addEventListener("DOMContentLoaded", () => {
    setupPostEvents();
});

// =====================================================
// EVENTOS
// =====================================================

function setupPostEvents() {
    document.addEventListener("click", async (event) => {
        // PUBLICAR
        const publishButton = event.target.closest("#btnPublishPost");

        if (publishButton) {
            event.preventDefault();

            if (!ChannelUI.canPublish()) {
                showPostMessage(
                    "Apenas administradores e o proprietário podem publicar.",
                    "danger",
                );

                return;
            }

            await handleCreatePost();

            return;
        }

        // CURTIR
        const likeButton = event.target.closest("[data-action='like-post']");

        if (likeButton) {
            event.preventDefault();

            const postId = likeButton.dataset.postId;

            if (postId) {
                await toggleLikePost(postId, likeButton);
            }

            return;
        }

        // PARTILHAR
        const shareButton = event.target.closest("[data-action='share-post']");

        if (shareButton) {
            event.preventDefault();

            const postId = shareButton.dataset.postId;

            if (postId) {
                await sharePost(postId);
            }

            return;
        }
    });
}

// =====================================================
// PUBLICAR
// =====================================================

async function handleCreatePost() {
    if (!ChannelUI.canPublish()) {
        showPostMessage(
            "Apenas administradores e o proprietário podem publicar.",
            "danger",
        );

        return;
    }

    const channelId = ChannelUI.getCurrentId();

    if (!channelId) {
        showPostMessage("Nenhum canal selecionado.", "danger");

        return;
    }

    // =================================================
    // PEGAR DADOS DIRETAMENTE DO HTML
    // =================================================

    const contentInput = document.getElementById("postContent");

    const imageInput = document.getElementById("postImageInput");

    const content = contentInput?.value?.trim() || "";

    /*
     * IMPORTANTE:
     *
     * O input de imagem é FILE.
     * Portanto não podemos mandar o objeto File
     * diretamente como imageUrl.
     *
     * Por enquanto pegamos o arquivo selecionado.
     */

    const file = imageInput?.files?.[0] || null;

    // =================================================
    // VALIDAR
    // =================================================

    if (!content && !file) {
        showPostMessage("A publicação precisa ter texto ou imagem.", "warning");

        return;
    }

    const publishButton = document.getElementById("btnPublishPost");

    setButtonLoading(publishButton, true, "Publicando...");

    try {
        /*
         * =================================================
         * CASO TENHA IMAGEM
         * =================================================
         *
         * O teu backend atual está esperando imageUrl.
         *
         * Como ainda não temos aqui um endpoint de upload,
         * vamos primeiro publicar texto normalmente.
         *
         * Se houver imagem, precisamos posteriormente
         * conectar ao Supabase/Storage ou ao endpoint
         * de upload do backend.
         */

        let imageUrl = null;

        if (file) {
            /*
             * Se o backend já tiver endpoint de upload,
             * podemos ligar aqui posteriormente.
             *
             * Por enquanto avisamos o utilizador.
             */

            if (!content) {
                showPostMessage(
                    "O upload de imagens ainda precisa ser ligado ao Storage.",
                    "warning",
                );

                return;
            }
        }

        // =================================================
        // ENVIAR PARA API
        // =================================================

        const response = await fetch(POSTS_API, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },

            credentials: "same-origin",

            body: JSON.stringify({
                channelId: channelId,
                content: content,
                imageUrl: imageUrl,
            }),
        });

        const data = await response.json().catch(() => null);

        // =================================================
        // ERROS
        // =================================================

        if (response.status === 401) {
            showPostMessage(data?.message || "Você não está autenticado.", "danger");

            return;
        }

        if (response.status === 403) {
            showPostMessage(
                data?.message || "Você não possui permissão para publicar.",
                "danger",
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                data?.message || data?.error || `Erro ao publicar: ${response.status}`,
            );
        }

        // =================================================
        // LIMPAR
        // =================================================

        if (contentInput) {
            contentInput.value = "";
        }

        if (imageInput) {
            imageInput.value = "";
        }

        showPostMessage("Publicação criada com sucesso.", "success");

        // =================================================
        // RECARREGAR POSTS
        // =================================================

        await loadChannelPosts(channelId);
    } catch (error) {
        console.error("Erro ao publicar:", error);

        showPostMessage(error.message || "Não foi possível publicar.", "danger");
    } finally {
        setButtonLoading(publishButton, false, "Publicar");
    }
}

// =====================================================
// CARREGAR PUBLICAÇÕES
// =====================================================

async function loadChannelPosts(channelId = null) {
    channelId = channelId || ChannelUI.getCurrentId();

    if (!channelId) {
        return;
    }

    const container = document.getElementById("postsContainer");

    if (!container) {
        console.warn("#postsContainer não encontrado.");

        return;
    }

    showPostsLoading(container);

    try {
        const response = await fetch(
            `${POSTS_API}/channel/${encodeURIComponent(channelId)}`,
            {
                method: "GET",

                headers: {
                    Accept: "application/json",
                },

                credentials: "same-origin",
            },
        );

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
            renderPostsError(
                container,
                data?.message || "Você precisa estar autenticado.",
            );

            return;
        }

        if (response.status === 403) {
            renderPostsError(
                container,
                data?.message || "Você não possui acesso a estas publicações.",
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                data?.message || `Erro ao carregar publicações: ${response.status}`,
            );
        }

        renderPosts(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Erro ao carregar publicações:", error);

        renderPostsError(container, "Não foi possível carregar as publicações.");
    }
}

// =====================================================
// LOADING
// =====================================================

function showPostsLoading(container) {
    container.innerHTML = `

        <div class="posts-loading">

            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>
            <div class="post-skeleton"></div>

        </div>

    `;
}

// =====================================================
// RENDER POSTS
// =====================================================

function renderPosts(posts) {
    const container = document.getElementById("postsContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!posts.length) {
        container.innerHTML = `

            <div class="empty-posts-state">

                <div class="channel-state-icon">
                    <i class="bi bi-chat-square-text"></i>
                </div>

                <p>
                    Ainda não existem publicações neste canal.
                </p>

            </div>

        `;

        return;
    }

    const fragment = document.createDocumentFragment();

    posts.forEach((post) => {
        fragment.appendChild(createPostElement(post));
    });

    container.appendChild(fragment);
}

// =====================================================
// POST
// =====================================================

function createPostElement(post) {
    const article = document.createElement("article");

    article.className = "channel-post";

    article.dataset.postId = post.id;

    const authorName = escapePostHtml(post.authorName || "Usuário");

    const content = escapePostHtml(post.content || "");

    const authorPhoto = post.authorPhotoUrl || "/images/default-avatar.png";

    const likesCount = Number(post.likesCount || 0);

    const sharesCount = Number(post.sharesCount || 0);

    const liked = post.isLikedByCurrentUser === true;

    let imageHtml = "";

    if (post.imageUrl) {
        imageHtml = `

            <div class="post-image">

                <img
                    src="${escapePostHtml(post.imageUrl)}"
                    alt="Imagem da publicação"
                    loading="lazy"
                    onerror="this.parentElement.style.display='none';"
                >

            </div>

        `;
    }

    article.innerHTML = `

        <div class="post-header">

            <img
                src="${escapePostHtml(authorPhoto)}"
                alt="${authorName}"
                class="post-author-photo"
                onerror="this.src='/images/default-avatar.png';"
            >

            <div class="post-author-info">

                <strong>
                    ${authorName}
                </strong>

                <small>
                    ${formatPostDate(post.createdAt)}
                </small>

            </div>

        </div>


        ${content
            ? `
                    <div class="post-content">
                        ${content.replace(/\n/g, "<br>")}
                    </div>
                  `
            : ""
        }


        ${imageHtml}


        <div class="post-actions">

            <button
                type="button"
                class="post-action-btn ${liked ? "liked" : ""}"
                data-action="like-post"
                data-post-id="${escapePostHtml(post.id)}"
            >

                <i class="bi bi-heart${liked ? "-fill" : ""}"></i>

                <span>
                    ${likesCount}
                </span>

            </button>


            <button
                type="button"
                class="post-action-btn"
                data-action="share-post"
                data-post-id="${escapePostHtml(post.id)}"
            >

                <i class="bi bi-share"></i>

                <span>
                    ${sharesCount}
                </span>

            </button>

        </div>

    `;

    return article;
}

// =====================================================
// LIKE
// =====================================================

async function toggleLikePost(postId, button) {
    const alreadyLiked = button.classList.contains("liked");

    button.disabled = true;

    try {
        const response = await fetch(
            `${POSTS_API}/${encodeURIComponent(postId)}/like`,
            {
                method: alreadyLiked ? "DELETE" : "POST",

                headers: {
                    Accept: "application/json",
                },

                credentials: "same-origin",
            },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.message || "Não foi possível atualizar a curtida.");
        }

        const countElement = button.querySelector("span");

        let count = Number(countElement?.textContent || 0);

        if (alreadyLiked) {
            count = Math.max(0, count - 1);

            button.classList.remove("liked");

            const icon = button.querySelector("i");

            if (icon) {
                icon.className = "bi bi-heart";
            }
        } else {
            count++;

            button.classList.add("liked");

            const icon = button.querySelector("i");

            if (icon) {
                icon.className = "bi bi-heart-fill";
            }
        }

        if (countElement) {
            countElement.textContent = count;
        }
    } catch (error) {
        console.error("Erro ao curtir publicação:", error);

        showPostMessage(
            error.message || "Não foi possível atualizar a curtida.",
            "danger",
        );
    } finally {
        button.disabled = false;
    }
}

// =====================================================
// PARTILHAR
// =====================================================

async function sharePost(postId) {
    if (!ChannelUI.canPublish()) {
        showPostMessage(
            "Apenas administradores e o proprietário podem partilhar publicações.",
            "danger",
        );

        return;
    }

    try {
        const response = await fetch(
            `${POSTS_API}/${encodeURIComponent(postId)}/share`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },

                credentials: "same-origin",

                body: JSON.stringify({}),
            },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                data?.message || "Não foi possível partilhar a publicação.",
            );
        }

        showPostMessage("Publicação partilhada com sucesso.", "success");

        await loadChannelPosts();
    } catch (error) {
        console.error("Erro ao partilhar:", error);

        showPostMessage(error.message || "Não foi possível partilhar.", "danger");
    }
}

// =====================================================
// MENSAGEM
// =====================================================

function showPostMessage(message, type = "info") {
    let container = document.getElementById("postMessageContainer");

    if (!container) {
        container = document.createElement("div");

        container.id = "postMessageContainer";

        container.style.position = "fixed";

        container.style.top = "20px";

        container.style.right = "20px";

        container.style.zIndex = "9999";

        container.style.maxWidth = "380px";

        document.body.appendChild(container);
    }

    const alert = document.createElement("div");

    alert.className = `alert alert-${type} shadow-sm`;

    alert.textContent = message;

    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3500);
}

// =====================================================
// ERRO
// =====================================================

function renderPostsError(container, message) {
    container.innerHTML = `

        <div class="channel-error-view">

            <div class="channel-state-icon">
                <i class="bi bi-exclamation-triangle"></i>
            </div>

            <p>
                ${escapePostHtml(message)}
            </p>

            <button
                type="button"
                class="btn btn-primary"
                onclick="ChannelPosts.load()"
            >

                <i class="bi bi-arrow-clockwise me-1"></i>

                Tentar novamente

            </button>

        </div>

    `;
}

// =====================================================
// LOADING BUTTON
// =====================================================

function setButtonLoading(button, loading, text) {
    if (!button) {
        return;
    }

    if (loading) {
        button.dataset.originalText = button.innerHTML;

        button.disabled = true;

        button.innerHTML = `

            <span
                class="spinner-border spinner-border-sm me-1"
            ></span>

            ${text}

        `;
    } else {
        button.disabled = false;

        button.innerHTML = button.dataset.originalText || text;
    }
}

// =====================================================
// DATA
// =====================================================

function formatPostDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    if (window.ChatPreferences?.formatDateTime) {
        return window.ChatPreferences.formatDateTime(dateValue, {
            dateStyle: "short",
            timeStyle: "short",
        });
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("pt-PT", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

// =====================================================
// ESCAPE
// =====================================================

function escapePostHtml(value) {
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

// =====================================================
// GLOBAL
// =====================================================

window.ChannelPosts = {
    load: loadChannelPosts,

    create: handleCreatePost,

    like: toggleLikePost,

    share: sharePost,
};

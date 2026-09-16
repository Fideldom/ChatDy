"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const t = (key) => window.ChatI18n?.t?.(key) || key;

    // NAVEGAÇÃO

    const navItems = document.querySelectorAll(".settings-nav-item");
    const sections = document.querySelectorAll(".settings-section");

    function showSection(sectionName) {
        navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.section === sectionName);
        });

        sections.forEach((section) => {
            section.classList.toggle(
                "active",
                section.dataset.content === sectionName,
            );
        });

        // Conta / Perfil
        if (sectionName === "account") {
            loadProfile();
        }

        // Privacidade
        if (sectionName === "privacy") {
            initializePrivacySection();
        }
    }

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            const section = item.dataset.section;

            if (!section) {
                return;
            }

            showSection(section);

            if (window.innerWidth <= 620) {
                item.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                });
            }
        });
    });

    // TOAST

    const toast = document.getElementById("settingsToast");
    const toastIcon = document.getElementById("settingsToastIcon");
    const toastMessage = document.getElementById("settingsToastMessage");

    let toastTimeout = null;

    function showToast(message, success = true) {
        if (!toast || !toastMessage || !toastIcon) {
            return;
        }

        toastMessage.textContent = message;

        toastIcon.className = success
            ? "bi bi-check-circle-fill"
            : "bi bi-exclamation-circle-fill";

        toastIcon.style.color = success ? "#16a34a" : "#dc2626";

        toast.classList.add("show");

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3500);
    }

    // CSRF

    function getAntiForgeryToken() {
        const token = document.querySelector(
            'input[name="__RequestVerificationToken"]',
        );

        return token ? token.value : "";
    }

    // CONFIGURAÇÕES GERAIS

    const language = document.getElementById("settingLanguage");

    const timeZone = document.getElementById("settingTimeZone");

    const timeFormat = document.getElementById("settingTimeFormat");

    const saveButton = document.getElementById("btnSaveSettings");

    function setSaveLoading(loading) {
        if (!saveButton) {
            return;
        }

        if (loading) {
            saveButton.classList.add("loading");
            saveButton.disabled = true;

            saveButton.innerHTML = `
                <span class="spinner-border spinner-border-sm"
                      aria-hidden="true"></span>
                <span>${t("settings.saving")}</span>
            `;
        } else {
            saveButton.classList.remove("loading");
            saveButton.disabled = false;

            saveButton.innerHTML = `
                <span>${t("settings.save")}</span>
            `;
        }
    }

    async function loadSettings() {
        try {
            const response = await fetch("/Settings/Get", {
                method: "GET",

                headers: {
                    Accept: "application/json",
                },

                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new Error(t("settings.loadError"));
            }

            const data = await response.json();

            if (language) {
                language.value = data.language || "pt";
            }

            if (timeZone) {
                timeZone.value = data.timeZone || "Africa/Luanda";
            }

            if (timeFormat) {
                timeFormat.value = data.timeFormat || "24h";
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);

            showToast(t("settings.loadError"), false);
        }
    }

    async function saveSettings() {
        if (!language || !timeZone || !timeFormat || !saveButton) {
            return;
        }

        const payload = {
            language: language.value,

            timeZone: timeZone.value,

            timeFormat: timeFormat.value,
        };

        setSaveLoading(true);

        try {
            const token = getAntiForgeryToken();

            const headers = {
                "Content-Type": "application/json",

                Accept: "application/json",
            };

            if (token) {
                headers["RequestVerificationToken"] = token;
            }

            const response = await fetch("/Settings/Update", {
                method: "PUT",

                headers,

                credentials: "same-origin",

                body: JSON.stringify(payload),
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    t("settings.saveError"),
                );
            }

            if (data?.settings && window.ChatPreferences?.set) {
                window.ChatPreferences.set(data.settings, {
                    persist: true,
                    broadcast: true,
                });
            } else if (window.ChatPreferences?.refresh) {
                await window.ChatPreferences.refresh();
            }

            showToast(t("settings.saveSuccess"));
        } catch (error) {
            console.error("Erro ao guardar configurações:", error);

            showToast(
                error.message || t("settings.saveError"),
                false,
            );
        } finally {
            setSaveLoading(false);
        }
    }

    if (saveButton) {
        saveButton.addEventListener("click", saveSettings);
    }

    // PERFIL

    const profileFullName = document.getElementById("profileFullName");

    const profileEmail = document.getElementById("profileEmail");

    const profileUserName = document.getElementById("profileUserName");

    const profilePhone = document.getElementById("profilePhone");

    const profileDisplayName = document.getElementById("profileDisplayName");

    const profileDisplayEmail = document.getElementById("profileDisplayEmail");

    const profileCreatedAt = document.getElementById("profileCreatedAt");

    const profileAvatarInitial = document.getElementById("profileAvatarInitial");

    const profileAvatarImage = document.getElementById("profileAvatarImage");

    const saveProfileButton = document.getElementById("btnSaveProfile");

    const cancelProfileButton = document.getElementById("btnCancelProfile");

    const changePhotoButton = document.getElementById("btnChangeProfilePhoto");

    const selectPhotoButton = document.getElementById("btnSelectProfilePhoto");

    const photoInput = document.getElementById("profilePhotoInput");

    let originalProfile = null;

    function getInitial(name) {
        const value = String(name || "").trim();

        return value.charAt(0).toUpperCase() || "U";
    }

    function formatAccountDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        if (window.ChatPreferences?.formatDate) {
            return window.ChatPreferences.formatDate(dateValue, {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("pt-PT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    function renderProfile(profile) {
        if (!profile) {
            return;
        }

        if (profileFullName) {
            profileFullName.value = profile.fullName || "";
        }

        if (profileEmail) {
            profileEmail.value = profile.email || "";
        }

        if (profileUserName) {
            profileUserName.value = profile.userName || "";
        }

        if (profilePhone) {
            profilePhone.value = profile.phoneNumber || "";
        }

        if (profileDisplayName) {
            profileDisplayName.textContent = profile.fullName || "Utilizador";
        }

        if (profileDisplayEmail) {
            profileDisplayEmail.textContent = profile.email || "";
        }

        if (profileCreatedAt) {
            profileCreatedAt.textContent = formatAccountDate(profile.createdAt);
        }

        const initial = getInitial(profile.fullName);

        if (profileAvatarInitial) {
            profileAvatarInitial.textContent = initial;
        }

        if (profileAvatarImage && profile.profilePhotoUrl) {
            profileAvatarImage.src = profile.profilePhotoUrl;

            profileAvatarImage.hidden = false;

            if (profileAvatarInitial) {
                profileAvatarInitial.hidden = true;
            }
        } else {
            if (profileAvatarImage) {
                profileAvatarImage.hidden = true;

                profileAvatarImage.removeAttribute("src");
            }

            if (profileAvatarInitial) {
                profileAvatarInitial.hidden = false;
            }
        }
    }

    async function loadProfile() {
        if (!profileFullName) {
            return;
        }

        try {
            const response = await fetch("/Settings/Profile", {
                method: "GET",

                headers: {
                    Accept: "application/json",
                },

                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new Error("Não foi possível carregar o perfil.");
            }

            const profile = await response.json();

            originalProfile = {
                ...profile,
            };

            renderProfile(profile);
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);

            showToast(t("settings.profileLoadError"), false);
        }
    }

    function setProfileSaveLoading(loading) {
        if (!saveProfileButton) {
            return;
        }

        if (loading) {
            saveProfileButton.classList.add("loading");

            saveProfileButton.disabled = true;

            saveProfileButton.innerHTML = `
                <span class="spinner-border spinner-border-sm"
                      aria-hidden="true"></span>
                <span>${t("settings.saving")}</span>
            `;
        } else {
            saveProfileButton.classList.remove("loading");

            saveProfileButton.disabled = false;

            saveProfileButton.innerHTML = `
                <span>${t("settings.save")}</span>
            `;
        }
    }

    async function saveProfile() {
        if (!profileFullName) {
            return;
        }

        const fullName = profileFullName.value.trim();

        const phoneNumber = profilePhone ? profilePhone.value.trim() : "";

        if (fullName.length < 2) {
            showToast(t("settings.invalidName"), false);

            profileFullName.focus();

            return;
        }

        const payload = {
            fullName,

            phoneNumber,
        };

        setProfileSaveLoading(true);

        try {
            const token = getAntiForgeryToken();

            const headers = {
                "Content-Type": "application/json",

                Accept: "application/json",
            };

            if (token) {
                headers["RequestVerificationToken"] = token;
            }

            const response = await fetch("/Settings/Profile", {
                method: "PUT",

                headers,

                credentials: "same-origin",

                body: JSON.stringify(payload),
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    t("settings.profileSaveError"),
                );
            }

            if (data?.profile) {
                originalProfile = {
                    ...data.profile,
                };

                renderProfile(data.profile);
            }

            showToast(t("settings.profileSaved"));
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);

            showToast(
                error.message || t("settings.profileSaveError"),
                false,
            );
        } finally {
            setProfileSaveLoading(false);
        }
    }

    function cancelProfileChanges() {
        if (!originalProfile) {
            return;
        }

        renderProfile(originalProfile);

        showToast(t("settings.cancelled"));
    }

    if (saveProfileButton) {
        saveProfileButton.addEventListener("click", saveProfile);
    }

    if (cancelProfileButton) {
        cancelProfileButton.addEventListener("click", cancelProfileChanges);
    }

    // FOTO DE PERFIL

    function openPhotoPicker() {
        if (photoInput) {
            photoInput.click();
        }
    }

    if (changePhotoButton) {
        changePhotoButton.addEventListener("click", openPhotoPicker);
    }

    if (selectPhotoButton) {
        selectPhotoButton.addEventListener("click", openPhotoPicker);
    }

    if (profileAvatarImage) {
        profileAvatarImage.addEventListener("error", () => {
            profileAvatarImage.hidden = true;

            if (profileAvatarInitial) {
                profileAvatarInitial.hidden = false;
            }
        });
    }

    async function uploadProfilePhoto(file) {
        if (!file) {
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            showToast(t("settings.invalidPhoto"), false);

            return;
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            showToast(t("settings.photoTooLarge"), false);

            return;
        }

        const formData = new FormData();

        formData.append("photo", file);

        try {
            if (selectPhotoButton) {
                selectPhotoButton.disabled = true;
            }

            if (changePhotoButton) {
                changePhotoButton.disabled = true;
            }

            const token = getAntiForgeryToken();

            const headers = {
                Accept: "application/json",
            };

            if (token) {
                headers["RequestVerificationToken"] = token;
            }

            const response = await fetch("/Settings/Profile/Photo", {
                method: "POST",

                headers,

                credentials: "same-origin",

                body: formData,
            });

            let data = null;

            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (!response.ok) {
                throw new Error(
                    t("settings.photoError"),
                );
            }

            if (data?.url && profileAvatarImage) {
                profileAvatarImage.src =
                    data.url + (data.url.includes("?") ? "&" : "?") + "v=" + Date.now();

                profileAvatarImage.hidden = false;

                if (profileAvatarInitial) {
                    profileAvatarInitial.hidden = true;
                }
            }

            showToast(t("settings.photoSaved"));
        } catch (error) {
            console.error("Erro ao atualizar foto:", error);

            showToast(
                error.message || t("settings.photoError"),
                false,
            );
        } finally {
            if (selectPhotoButton) {
                selectPhotoButton.disabled = false;
            }

            if (changePhotoButton) {
                changePhotoButton.disabled = false;
            }

            if (photoInput) {
                photoInput.value = "";
            }
        }
    }

    if (photoInput) {
        photoInput.addEventListener("change", () => {
            const file = photoInput.files?.[0];

            uploadProfilePhoto(file);
        });
    }

    // PRIVACIDADE

    const privacyElements = {
        profileVisibility: document.getElementById("privacyProfileVisibility"),

        onlineStatus: document.getElementById("privacyOnlineStatus"),

        lastSeen: document.getElementById("privacyLastSeen"),

        messages: document.getElementById("privacyMessages"),

        calls: document.getElementById("privacyCalls"),

        friendRequests: document.getElementById("privacyFriendRequests"),

        discoverable: document.getElementById("privacyDiscoverable"),

        saveButton: document.getElementById("btnSavePrivacy"),
    };

    let privacyLoaded = false;

    async function loadPrivacySettings() {
        try {
            const response = await fetch("/Settings/Privacy", {
                method: "GET",

                headers: {
                    Accept: "application/json",
                },

                credentials: "same-origin",
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar privacidade: ${response.status}`);
            }

            const data = await response.json();

            if (privacyElements.profileVisibility) {
                privacyElements.profileVisibility.value =
                    data.profileVisibility || "everyone";
            }

            if (privacyElements.onlineStatus) {
                privacyElements.onlineStatus.value =
                    data.onlineStatusVisibility || "everyone";
            }

            if (privacyElements.lastSeen) {
                privacyElements.lastSeen.value = data.lastSeenVisibility || "everyone";
            }

            if (privacyElements.messages) {
                privacyElements.messages.value = data.messagePrivacy || "everyone";
            }

            if (privacyElements.calls) {
                privacyElements.calls.value = data.callPrivacy || "everyone";
            }

            if (privacyElements.friendRequests) {
                privacyElements.friendRequests.value =
                    data.friendRequestPrivacy || "everyone";
            }

            if (privacyElements.discoverable) {
                privacyElements.discoverable.checked = data.discoverable !== false;
            }
        } catch (error) {
            console.error("Erro ao carregar configurações de privacidade:", error);

            showToast(
                t("settings.privacyLoadError"),
                false,
            );
        }
    }

    function setPrivacySaveLoading(loading) {
        const button = privacyElements.saveButton;

        if (!button) {
            return;
        }

        const normalContent = button.querySelector(".privacy-save-content");

        const loadingContent = button.querySelector(".privacy-save-loading");

        button.disabled = loading;

        if (loading) {
            normalContent?.classList.add("d-none");

            loadingContent?.classList.remove("d-none");
        } else {
            normalContent?.classList.remove("d-none");

            loadingContent?.classList.add("d-none");
        }
    }

    async function savePrivacySettings() {
        const button = privacyElements.saveButton;

        if (!button) {
            return;
        }

        const payload = {
            profileVisibility: privacyElements.profileVisibility?.value || "everyone",

            onlineStatusVisibility: privacyElements.onlineStatus?.value || "everyone",

            lastSeenVisibility: privacyElements.lastSeen?.value || "everyone",

            messagePrivacy: privacyElements.messages?.value || "everyone",

            callPrivacy: privacyElements.calls?.value || "everyone",

            friendRequestPrivacy: privacyElements.friendRequests?.value || "everyone",

            discoverable: privacyElements.discoverable?.checked ?? true,
        };

        setPrivacySaveLoading(true);

        try {
            const token = getAntiForgeryToken();

            const headers = {
                "Content-Type": "application/json",

                Accept: "application/json",
            };

            if (token) {
                headers["RequestVerificationToken"] = token;
            }

            const response = await fetch("/Settings/Privacy", {
                method: "PUT",

                headers,

                credentials: "same-origin",

                body: JSON.stringify(payload),
            });

            let result = null;

            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (!response.ok) {
                throw new Error(
                    t("settings.saveError"),
                );
            }

            showToast(
                t("settings.privacySaved"),
            );
        } catch (error) {
            console.error("Erro ao guardar privacidade:", error);

            showToast(
                error.message || t("settings.saveError"),
                false,
            );
        } finally {
            setPrivacySaveLoading(false);
        }
    }

    if (privacyElements.saveButton) {
        privacyElements.saveButton.addEventListener("click", savePrivacySettings);
    }

    function initializePrivacySection() {
        if (privacyLoaded) {
            return;
        }

        privacyLoaded = true;

        loadPrivacySettings();
    }

    // INICIALIZAÇÃO

    (async () => {
        if (window.ChatPreferences?.ready) {
            await window.ChatPreferences.ready;
        }

        await loadSettings();
        loadProfile();
    })();
});

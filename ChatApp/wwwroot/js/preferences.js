"use strict";

/*
 * ChatApp - Preferências globais
 *
 * Centraliza Language, TimeZone e TimeFormat para que qualquer página
 * consiga apresentar datas e horas de acordo com as preferências do utilizador.
 */
(function () {
    const STORAGE_KEY = "chatapp.user.preferences.v1";

    const DEFAULTS = Object.freeze({
        language: "pt",
        timeZone: "Africa/Luanda",
        timeFormat: "24h",
    });

    const LANGUAGE_LOCALES = Object.freeze({
        pt: "pt-PT",
        en: "en-US",
        fr: "fr-FR",
        es: "es-ES",
    });

    let state = { ...DEFAULTS };

    function normalize(value) {
        const input = value || {};

        const language = String(input.language || DEFAULTS.language)
            .trim()
            .toLowerCase();

        const timeZone = String(input.timeZone || DEFAULTS.timeZone).trim();

        const timeFormat = String(input.timeFormat || DEFAULTS.timeFormat)
            .trim()
            .toLowerCase();

        return {
            language: LANGUAGE_LOCALES[language] ? language : DEFAULTS.language,
            timeZone: timeZone || DEFAULTS.timeZone,
            timeFormat: timeFormat === "12h" ? "12h" : "24h",
        };
    }

    function readCache() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return null;
            }

            return normalize(JSON.parse(raw));
        } catch (error) {
            console.warn("Não foi possível ler as preferências locais:", error);
            return null;
        }
    }

    function writeCache() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("Não foi possível guardar as preferências locais:", error);
        }
    }

    function applyDocumentLanguage() {
        const locale = LANGUAGE_LOCALES[state.language] || LANGUAGE_LOCALES.pt;

        document.documentElement.lang = locale.split("-")[0];
        document.documentElement.dataset.language = state.language;
        document.documentElement.dataset.locale = locale;
        document.documentElement.dataset.timeZone = state.timeZone;
        document.documentElement.dataset.timeFormat = state.timeFormat;
    }

    function getLocale() {
        return LANGUAGE_LOCALES[state.language] || LANGUAGE_LOCALES.pt;
    }

    function parseDate(value) {
        if (value instanceof Date) {
            return value;
        }

        if (value === null || value === undefined || value === "") {
            return null;
        }

        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }

        return null;
    }

    function buildOptions(options = {}) {
        const result = { ...options };

        result.timeZone = state.timeZone;

        if (result.hour !== undefined || result.minute !== undefined || result.second !== undefined) {
            result.hour12 = state.timeFormat === "12h";
        }

        return result;
    }

    function formatDateTime(value, options = {}) {
        const date = parseDate(value);

        if (!date) {
            return "";
        }

        try {
            return new Intl.DateTimeFormat(getLocale(), buildOptions(options)).format(date);
        } catch (error) {
            console.warn("Falha ao formatar data/hora:", error);
            return date.toLocaleString(getLocale());
        }
    }

    function formatTime(value, options = {}) {
        return formatDateTime(value, {
            hour: "2-digit",
            minute: "2-digit",
            ...options,
        });
    }

    function formatDate(value, options = {}) {
        return formatDateTime(value, options);
    }

    function get() {
        return { ...state };
    }

    function set(next, options = {}) {
        state = normalize({
            ...state,
            ...next,
        });

        if (options.persist !== false) {
            writeCache();
        }

        applyDocumentLanguage();

        if (options.broadcast !== false) {
            window.dispatchEvent(
                new CustomEvent("chatapp:preferences-changed", {
                    detail: get(),
                }),
            );
        }

        return get();
    }

    async function fetchPreferences() {
        const response = await fetch("/Settings/Get", {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            credentials: "same-origin",
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Não foi possível carregar as preferências (${response.status}).`);
        }

        return normalize(await response.json());
    }

    async function refresh() {
        try {
            const preferences = await fetchPreferences();
            set(preferences, { persist: true, broadcast: true });
            return get();
        } catch (error) {
            console.error("Erro ao carregar preferências globais:", error);

            const cached = readCache();

            if (cached) {
                set(cached, { persist: false, broadcast: false });
            } else {
                set(DEFAULTS, { persist: false, broadcast: false });
            }

            return get();
        }
    }

    state = readCache() || { ...DEFAULTS };
    applyDocumentLanguage();

    const ready = refresh();

    window.ChatPreferences = Object.freeze({
        get,
        set,
        refresh,
        ready,
        formatDateTime,
        formatTime,
        formatDate,
        getLocale,
    });
})();

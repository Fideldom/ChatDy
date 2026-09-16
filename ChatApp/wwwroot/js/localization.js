"use strict";

/*
 * ChatApp - Sistema global de idioma
 *
 * O backend continua a guardar o idioma em UserSettings. Este ficheiro
 * transforma essa preferência em idioma real da interface.
 *
 * Nesta fase a tradução está integrada na área de Configurações. A mesma
 * infraestrutura será reutilizada pelas restantes páginas do ChatApp.
 */
(function () {
    const DICTIONARY = {
        pt: {
            "settings.title": "Configurações",
            "settings.subtitle": "Personaliza a tua experiência no ChatApp.",
            "settings.general": "Geral",
            "settings.generalShort": "Preferências básicas",
            "settings.account": "Conta",
            "settings.accountShort": "Perfil e informações",
            "settings.privacy": "Privacidade",
            "settings.privacyShort": "Visibilidade e controlo",
            "settings.notifications": "Notificações",
            "settings.notificationsShort": "Alertas e sons",
            "settings.appearance": "Aparência",
            "settings.appearanceShort": "Tema e personalização",
            "settings.security": "Segurança",
            "settings.securityShort": "Proteção da conta",
            "settings.about": "Sobre",
            "settings.aboutShort": "Informações do ChatApp",
            "settings.generalTitle": "Preferências gerais",
            "settings.generalDescription": "Define as preferências básicas da tua conta.",
            "settings.language": "Idioma",
            "settings.languageDescription": "Escolhe o idioma utilizado pelo ChatApp.",
            "settings.portuguese": "Português",
            "settings.english": "English",
            "settings.french": "Français",
            "settings.spanish": "Español",
            "settings.timeZone": "Fuso horário",
            "settings.timeZoneDescription": "Utilizado para apresentar datas e horários.",
            "settings.luanda": "Luanda (UTC+01:00)",
            "settings.johannesburg": "Johannesburg (UTC+02:00)",
            "settings.london": "Londres",
            "settings.lisbon": "Lisboa",
            "settings.saoPaulo": "São Paulo",
            "settings.newYork": "Nova Iorque",
            "settings.timeFormat": "Formato da hora",
            "settings.timeFormatDescription": "Escolhe como os horários serão apresentados.",
            "settings.hours24": "24 horas",
            "settings.hours12": "12 horas",
            "settings.save": "Guardar alterações",
            "settings.accountTitle": "Conta e perfil",
            "settings.accountDescription": "Gere as tuas informações pessoais e a tua fotografia.",
            "settings.profile": "Perfil",
            "settings.loading": "A carregar...",
            "settings.activeAccount": "Conta ativa",
            "settings.changePhoto": "Alterar fotografia",
            "settings.photoHelp": "JPG, PNG ou WebP · máximo 5 MB",
            "settings.personalInfo": "Informações pessoais",
            "settings.personalInfoDescription": "Estas informações fazem parte do teu perfil.",
            "settings.fullName": "Nome completo",
            "settings.fullNameHelp": "O nome apresentado no ChatApp.",
            "settings.email": "E-mail",
            "settings.emailHelp": "O e-mail será alterado através da área de segurança.",
            "settings.username": "Nome de utilizador",
            "settings.usernameHelp": "Identificador atual da tua conta.",
            "settings.phone": "Número de telefone",
            "settings.phoneHelp": "Opcional. Utilizado para identificação da conta.",
            "settings.cancel": "Cancelar",
            "settings.accountInfo": "Informações da conta",
            "settings.accountInfoDescription": "Informações técnicas da tua conta ChatApp.",
            "settings.accountCreated": "Conta criada",
            "settings.status": "Estado",
            "settings.active": "Ativa",
            "settings.privacyTitle": "Controla a tua privacidade",
            "settings.privacyDescription": "Escolhe quem pode encontrar-te, contactar-te e visualizar as tuas informações.",
            "settings.notificationsTitle": "Controla como recebes os teus alertas.",
            "settings.notificationsDescription": "As opções de mensagens, chamadas, reuniões, pedidos de amizade, sons e notificações do navegador serão adicionadas posteriormente.",
            "settings.appearanceTitle": "Personaliza o visual do ChatApp.",
            "settings.appearanceDescription": "Temas claro, escuro e automático, paletas de cores, cor principal, tamanho da interface, densidade e acessibilidade serão adicionados na próxima fase.",
            "settings.securityTitle": "Protege a tua conta e as tuas sessões.",
            "settings.securitySection": "Segurança da conta",
            "settings.securityDescription": "Palavra-passe, sessões ativas, autenticação em dois fatores e alertas de login serão adicionados numa fase posterior.",
            "settings.aboutTitle": "Informações sobre a plataforma.",
            "settings.platform": "Plataforma de comunicação",
            "settings.application": "Aplicação",
            "settings.version": "Versão",
            "settings.web": "Web",
            "settings.profileVisibility": "Quem pode ver o meu perfil?",
            "settings.everyone": "Todos",
            "settings.friends": "Apenas amigos",
            "settings.nobody": "Ninguém",
            "settings.saved": "Configurações atualizadas.",
            "settings.saveSuccess": "Configurações atualizadas com sucesso.",
            "settings.loadError": "Não foi possível carregar as configurações.",
            "settings.saveError": "Não foi possível guardar as configurações.",
            "settings.profileLoadError": "Não foi possível carregar os dados do perfil.",
            "settings.profileSaveError": "Não foi possível atualizar o perfil.",
            "settings.profileSaved": "Perfil atualizado com sucesso.",
            "settings.photoSaved": "Foto de perfil atualizada com sucesso.",
            "settings.photoError": "Não foi possível atualizar a fotografia.",
            "settings.invalidName": "Introduz um nome válido.",
            "settings.invalidPhoto": "Seleciona uma imagem JPG, PNG ou WebP.",
            "settings.photoTooLarge": "A imagem não pode ultrapassar 5 MB.",
            "settings.cancelled": "Alterações canceladas.",
            "settings.saving": "A guardar...",
            "settings.privacySaved": "Configurações de privacidade guardadas com sucesso.",
            "settings.privacyLoadError": "Não foi possível carregar as configurações de privacidade.",
            "settings.privacySaveError": "Não foi possível guardar a privacidade."
        },
        en: {
            "settings.title": "Settings",
            "settings.subtitle": "Personalize your ChatApp experience.",
            "settings.general": "General",
            "settings.generalShort": "Basic preferences",
            "settings.account": "Account",
            "settings.accountShort": "Profile and information",
            "settings.privacy": "Privacy",
            "settings.privacyShort": "Visibility and control",
            "settings.notifications": "Notifications",
            "settings.notificationsShort": "Alerts and sounds",
            "settings.appearance": "Appearance",
            "settings.appearanceShort": "Theme and personalization",
            "settings.security": "Security",
            "settings.securityShort": "Account protection",
            "settings.about": "About",
            "settings.aboutShort": "ChatApp information",
            "settings.generalTitle": "General preferences",
            "settings.generalDescription": "Define your account's basic preferences.",
            "settings.language": "Language",
            "settings.languageDescription": "Choose the language used by ChatApp.",
            "settings.portuguese": "Portuguese",
            "settings.english": "English",
            "settings.french": "French",
            "settings.spanish": "Spanish",
            "settings.timeZone": "Time zone",
            "settings.timeZoneDescription": "Used to display dates and times.",
            "settings.luanda": "Luanda (UTC+01:00)",
            "settings.johannesburg": "Johannesburg (UTC+02:00)",
            "settings.london": "London",
            "settings.lisbon": "Lisbon",
            "settings.saoPaulo": "São Paulo",
            "settings.newYork": "New York",
            "settings.timeFormat": "Time format",
            "settings.timeFormatDescription": "Choose how times are displayed.",
            "settings.hours24": "24-hour",
            "settings.hours12": "12-hour",
            "settings.save": "Save changes",
            "settings.accountTitle": "Account and profile",
            "settings.accountDescription": "Manage your personal information and photo.",
            "settings.profile": "Profile",
            "settings.loading": "Loading...",
            "settings.activeAccount": "Active account",
            "settings.changePhoto": "Change photo",
            "settings.photoHelp": "JPG, PNG or WebP · maximum 5 MB",
            "settings.personalInfo": "Personal information",
            "settings.personalInfoDescription": "This information is part of your profile.",
            "settings.fullName": "Full name",
            "settings.fullNameHelp": "The name displayed in ChatApp.",
            "settings.email": "Email",
            "settings.emailHelp": "Email can be changed through the security area.",
            "settings.username": "Username",
            "settings.usernameHelp": "Your account's current identifier.",
            "settings.phone": "Phone number",
            "settings.phoneHelp": "Optional. Used for account identification.",
            "settings.cancel": "Cancel",
            "settings.accountInfo": "Account information",
            "settings.accountInfoDescription": "Technical information about your ChatApp account.",
            "settings.accountCreated": "Account created",
            "settings.status": "Status",
            "settings.active": "Active",
            "settings.privacyTitle": "Control your privacy",
            "settings.privacyDescription": "Choose who can find you, contact you and view your information.",
            "settings.notificationsTitle": "Control how you receive your alerts.",
            "settings.notificationsDescription": "Options for messages, calls, meetings, friend requests, sounds and browser notifications will be added later.",
            "settings.appearanceTitle": "Personalize the ChatApp look.",
            "settings.appearanceDescription": "Light, dark and automatic themes, color palettes, accent color, interface size, density and accessibility will be added in the next phase.",
            "settings.securityTitle": "Protect your account and sessions.",
            "settings.securitySection": "Account security",
            "settings.securityDescription": "Password, active sessions, two-factor authentication and login alerts will be added in a later phase.",
            "settings.aboutTitle": "Platform information.",
            "settings.platform": "Communication platform",
            "settings.application": "Application",
            "settings.version": "Version",
            "settings.web": "Web",
            "settings.profileVisibility": "Who can see my profile?",
            "settings.everyone": "Everyone",
            "settings.friends": "Friends only",
            "settings.nobody": "Nobody",
            "settings.saved": "Settings updated.",
            "settings.saveSuccess": "Settings updated successfully.",
            "settings.loadError": "Could not load the settings.",
            "settings.saveError": "Could not save the settings.",
            "settings.profileLoadError": "Could not load profile data.",
            "settings.profileSaveError": "Could not update the profile.",
            "settings.profileSaved": "Profile updated successfully.",
            "settings.photoSaved": "Profile photo updated successfully.",
            "settings.photoError": "Could not update the photo.",
            "settings.invalidName": "Enter a valid name.",
            "settings.invalidPhoto": "Select a JPG, PNG or WebP image.",
            "settings.photoTooLarge": "The image cannot exceed 5 MB.",
            "settings.cancelled": "Changes cancelled.",
            "settings.saving": "Saving...",
            "settings.privacySaved": "Privacy settings saved successfully.",
            "settings.privacyLoadError": "Could not load privacy settings.",
            "settings.privacySaveError": "Could not save privacy settings."
        },
        fr: {
            "settings.title": "Paramètres",
            "settings.subtitle": "Personnalisez votre expérience ChatApp.",
            "settings.general": "Général",
            "settings.generalShort": "Préférences de base",
            "settings.account": "Compte",
            "settings.accountShort": "Profil et informations",
            "settings.privacy": "Confidentialité",
            "settings.privacyShort": "Visibilité et contrôle",
            "settings.notifications": "Notifications",
            "settings.notificationsShort": "Alertes et sons",
            "settings.appearance": "Apparence",
            "settings.appearanceShort": "Thème et personnalisation",
            "settings.security": "Sécurité",
            "settings.securityShort": "Protection du compte",
            "settings.about": "À propos",
            "settings.aboutShort": "Informations ChatApp",
            "settings.generalTitle": "Préférences générales",
            "settings.generalDescription": "Définissez les préférences de base de votre compte.",
            "settings.language": "Langue",
            "settings.languageDescription": "Choisissez la langue utilisée par ChatApp.",
            "settings.portuguese": "Portugais",
            "settings.english": "Anglais",
            "settings.french": "Français",
            "settings.spanish": "Espagnol",
            "settings.timeZone": "Fuseau horaire",
            "settings.timeZoneDescription": "Utilisé pour afficher les dates et les heures.",
            "settings.luanda": "Luanda (UTC+01:00)",
            "settings.johannesburg": "Johannesburg (UTC+02:00)",
            "settings.london": "Londres",
            "settings.lisbon": "Lisbonne",
            "settings.saoPaulo": "São Paulo",
            "settings.newYork": "New York",
            "settings.timeFormat": "Format de l'heure",
            "settings.timeFormatDescription": "Choisissez comment les heures sont affichées.",
            "settings.hours24": "24 heures",
            "settings.hours12": "12 heures",
            "settings.save": "Enregistrer les modifications",
            "settings.accountTitle": "Compte et profil",
            "settings.accountDescription": "Gérez vos informations personnelles et votre photo.",
            "settings.profile": "Profil",
            "settings.loading": "Chargement...",
            "settings.activeAccount": "Compte actif",
            "settings.changePhoto": "Modifier la photo",
            "settings.photoHelp": "JPG, PNG ou WebP · maximum 5 Mo",
            "settings.personalInfo": "Informations personnelles",
            "settings.personalInfoDescription": "Ces informations font partie de votre profil.",
            "settings.fullName": "Nom complet",
            "settings.fullNameHelp": "Le nom affiché dans ChatApp.",
            "settings.email": "E-mail",
            "settings.emailHelp": "L'e-mail peut être modifié dans la section sécurité.",
            "settings.username": "Nom d'utilisateur",
            "settings.usernameHelp": "Identifiant actuel de votre compte.",
            "settings.phone": "Numéro de téléphone",
            "settings.phoneHelp": "Facultatif. Utilisé pour identifier le compte.",
            "settings.cancel": "Annuler",
            "settings.accountInfo": "Informations du compte",
            "settings.accountInfoDescription": "Informations techniques de votre compte ChatApp.",
            "settings.accountCreated": "Compte créé",
            "settings.status": "État",
            "settings.active": "Actif",
            "settings.privacyTitle": "Contrôlez votre confidentialité",
            "settings.privacyDescription": "Choisissez qui peut vous trouver, vous contacter et voir vos informations.",
            "settings.notificationsTitle": "Contrôlez la façon dont vous recevez vos alertes.",
            "settings.notificationsDescription": "Les options de messages, appels, réunions, demandes d'amis, sons et notifications du navigateur seront ajoutées ultérieurement.",
            "settings.appearanceTitle": "Personnalisez l'apparence de ChatApp.",
            "settings.appearanceDescription": "Les thèmes clair, sombre et automatique, les palettes de couleurs, la couleur principale, la taille de l'interface, la densité et l'accessibilité seront ajoutés lors de la prochaine phase.",
            "settings.securityTitle": "Protégez votre compte et vos sessions.",
            "settings.securitySection": "Sécurité du compte",
            "settings.securityDescription": "Le mot de passe, les sessions actives, l'authentification à deux facteurs et les alertes de connexion seront ajoutés ultérieurement.",
            "settings.aboutTitle": "Informations sur la plateforme.",
            "settings.platform": "Plateforme de communication",
            "settings.application": "Application",
            "settings.version": "Version",
            "settings.web": "Web",
            "settings.profileVisibility": "Qui peut voir mon profil ?",
            "settings.everyone": "Tout le monde",
            "settings.friends": "Amis uniquement",
            "settings.nobody": "Personne",
            "settings.saved": "Paramètres mis à jour.",
            "settings.saveSuccess": "Paramètres mis à jour avec succès.",
            "settings.loadError": "Impossible de charger les paramètres.",
            "settings.saveError": "Impossible d'enregistrer les paramètres.",
            "settings.profileLoadError": "Impossible de charger les données du profil.",
            "settings.profileSaveError": "Impossible de mettre à jour le profil.",
            "settings.profileSaved": "Profil mis à jour avec succès.",
            "settings.photoSaved": "Photo de profil mise à jour avec succès.",
            "settings.photoError": "Impossible de mettre à jour la photo.",
            "settings.invalidName": "Saisissez un nom valide.",
            "settings.invalidPhoto": "Sélectionnez une image JPG, PNG ou WebP.",
            "settings.photoTooLarge": "L'image ne peut pas dépasser 5 Mo.",
            "settings.cancelled": "Modifications annulées.",
            "settings.saving": "Enregistrement...",
            "settings.privacySaved": "Paramètres de confidentialité enregistrés avec succès.",
            "settings.privacyLoadError": "Impossible de charger les paramètres de confidentialité.",
            "settings.privacySaveError": "Impossible d'enregistrer les paramètres de confidentialité."
        },
        es: {
            "settings.title": "Configuración",
            "settings.subtitle": "Personaliza tu experiencia en ChatApp.",
            "settings.general": "General",
            "settings.generalShort": "Preferencias básicas",
            "settings.account": "Cuenta",
            "settings.accountShort": "Perfil e información",
            "settings.privacy": "Privacidad",
            "settings.privacyShort": "Visibilidad y control",
            "settings.notifications": "Notificaciones",
            "settings.notificationsShort": "Alertas y sonidos",
            "settings.appearance": "Apariencia",
            "settings.appearanceShort": "Tema y personalización",
            "settings.security": "Seguridad",
            "settings.securityShort": "Protección de la cuenta",
            "settings.about": "Acerca de",
            "settings.aboutShort": "Información de ChatApp",
            "settings.generalTitle": "Preferencias generales",
            "settings.generalDescription": "Define las preferencias básicas de tu cuenta.",
            "settings.language": "Idioma",
            "settings.languageDescription": "Elige el idioma utilizado por ChatApp.",
            "settings.portuguese": "Portugués",
            "settings.english": "Inglés",
            "settings.french": "Francés",
            "settings.spanish": "Español",
            "settings.timeZone": "Zona horaria",
            "settings.timeZoneDescription": "Se utiliza para mostrar fechas y horas.",
            "settings.luanda": "Luanda (UTC+01:00)",
            "settings.johannesburg": "Johannesburgo (UTC+02:00)",
            "settings.london": "Londres",
            "settings.lisbon": "Lisboa",
            "settings.saoPaulo": "São Paulo",
            "settings.newYork": "Nueva York",
            "settings.timeFormat": "Formato de hora",
            "settings.timeFormatDescription": "Elige cómo se mostrarán las horas.",
            "settings.hours24": "24 horas",
            "settings.hours12": "12 horas",
            "settings.save": "Guardar cambios",
            "settings.accountTitle": "Cuenta y perfil",
            "settings.accountDescription": "Gestiona tu información personal y tu foto.",
            "settings.profile": "Perfil",
            "settings.loading": "Cargando...",
            "settings.activeAccount": "Cuenta activa",
            "settings.changePhoto": "Cambiar foto",
            "settings.photoHelp": "JPG, PNG o WebP · máximo 5 MB",
            "settings.personalInfo": "Información personal",
            "settings.personalInfoDescription": "Esta información forma parte de tu perfil.",
            "settings.fullName": "Nombre completo",
            "settings.fullNameHelp": "El nombre que se muestra en ChatApp.",
            "settings.email": "Correo electrónico",
            "settings.emailHelp": "El correo se puede cambiar desde el área de seguridad.",
            "settings.username": "Nombre de usuario",
            "settings.usernameHelp": "Identificador actual de tu cuenta.",
            "settings.phone": "Número de teléfono",
            "settings.phoneHelp": "Opcional. Se utiliza para identificar la cuenta.",
            "settings.cancel": "Cancelar",
            "settings.accountInfo": "Información de la cuenta",
            "settings.accountInfoDescription": "Información técnica de tu cuenta de ChatApp.",
            "settings.accountCreated": "Cuenta creada",
            "settings.status": "Estado",
            "settings.active": "Activa",
            "settings.privacyTitle": "Controla tu privacidad",
            "settings.privacyDescription": "Elige quién puede encontrarte, contactarte y ver tu información.",
            "settings.notificationsTitle": "Controla cómo recibes tus alertas.",
            "settings.notificationsDescription": "Las opciones de mensajes, llamadas, reuniones, solicitudes de amistad, sonidos y notificaciones del navegador se añadirán posteriormente.",
            "settings.appearanceTitle": "Personaliza el aspecto de ChatApp.",
            "settings.appearanceDescription": "Los temas claro, oscuro y automático, paletas de colores, color principal, tamaño de interfaz, densidad y accesibilidad se añadirán en la próxima fase.",
            "settings.securityTitle": "Protege tu cuenta y tus sesiones.",
            "settings.securitySection": "Seguridad de la cuenta",
            "settings.securityDescription": "La contraseña, sesiones activas, autenticación de dos factores y alertas de inicio de sesión se añadirán en una fase posterior.",
            "settings.aboutTitle": "Información sobre la plataforma.",
            "settings.platform": "Plataforma de comunicación",
            "settings.application": "Aplicación",
            "settings.version": "Versión",
            "settings.web": "Web",
            "settings.profileVisibility": "¿Quién puede ver mi perfil?",
            "settings.everyone": "Todos",
            "settings.friends": "Solo amigos",
            "settings.nobody": "Nadie",
            "settings.saved": "Configuración actualizada.",
            "settings.saveSuccess": "Configuración actualizada correctamente.",
            "settings.loadError": "No se pudo cargar la configuración.",
            "settings.saveError": "No se pudo guardar la configuración.",
            "settings.profileLoadError": "No se pudieron cargar los datos del perfil.",
            "settings.profileSaveError": "No se pudo actualizar el perfil.",
            "settings.profileSaved": "Perfil actualizado correctamente.",
            "settings.photoSaved": "Foto de perfil actualizada correctamente.",
            "settings.photoError": "No se pudo actualizar la foto.",
            "settings.invalidName": "Introduce un nombre válido.",
            "settings.invalidPhoto": "Selecciona una imagen JPG, PNG o WebP.",
            "settings.photoTooLarge": "La imagen no puede superar los 5 MB.",
            "settings.cancelled": "Cambios cancelados.",
            "settings.saving": "Guardando...",
            "settings.privacySaved": "Configuración de privacidad guardada correctamente.",
            "settings.privacyLoadError": "No se pudo cargar la configuración de privacidad.",
            "settings.privacySaveError": "No se pudo guardar la configuración de privacidad."
        }
    };

    const TEXT_KEY_MAP = {
        "Configurações": "settings.title",
        "Personaliza a tua experiência no ChatApp.": "settings.subtitle",
        "Geral": "settings.general",
        "Preferências básicas": "settings.generalShort",
        "Conta": "settings.account",
        "Perfil e informações": "settings.accountShort",
        "Privacidade": "settings.privacy",
        "Visibilidade e controlo": "settings.privacyShort",
        "Notificações": "settings.notifications",
        "Alertas e sons": "settings.notificationsShort",
        "Aparência": "settings.appearance",
        "Tema e personalização": "settings.appearanceShort",
        "Segurança": "settings.security",
        "Proteção da conta": "settings.securityShort",
        "Sobre": "settings.about",
        "Informações do ChatApp": "settings.aboutShort",
        "Preferências gerais": "settings.generalTitle",
        "Define as preferências básicas da tua conta.": "settings.generalDescription",
        "Idioma": "settings.language",
        "Escolhe o idioma utilizado pelo ChatApp.": "settings.languageDescription",
        "Português": "settings.portuguese",
        "English": "settings.english",
        "Français": "settings.french",
        "Español": "settings.spanish",
        "Fuso horário": "settings.timeZone",
        "Utilizado para apresentar datas e horários.": "settings.timeZoneDescription",
        "Luanda (UTC+01:00)": "settings.luanda",
        "Johannesburg (UTC+02:00)": "settings.johannesburg",
        "Londres": "settings.london",
        "Lisboa": "settings.lisbon",
        "São Paulo": "settings.saoPaulo",
        "Nova Iorque": "settings.newYork",
        "Formato da hora": "settings.timeFormat",
        "Escolhe como os horários serão apresentados.": "settings.timeFormatDescription",
        "24 horas": "settings.hours24",
        "12 horas": "settings.hours12",
        "Guardar alterações": "settings.save",
        "Conta e perfil": "settings.accountTitle",
        "Gere as tuas informações pessoais e a tua fotografia.": "settings.accountDescription",
        "PERFIL": "settings.profile",
        "A carregar...": "settings.loading",
        "Conta ativa": "settings.activeAccount",
        "Alterar fotografia": "settings.changePhoto",
        "JPG, PNG ou WebP · máximo 5 MB": "settings.photoHelp",
        "Informações pessoais": "settings.personalInfo",
        "Estas informações fazem parte do teu perfil.": "settings.personalInfoDescription",
        "Nome completo": "settings.fullName",
        "O nome apresentado no ChatApp.": "settings.fullNameHelp",
        "E-mail": "settings.email",
        "O e-mail será alterado através da área de segurança.": "settings.emailHelp",
        "Nome de utilizador": "settings.username",
        "Identificador atual da tua conta.": "settings.usernameHelp",
        "Número de telefone": "settings.phone",
        "Opcional. Utilizado para identificação da conta.": "settings.phoneHelp",
        "Cancelar": "settings.cancel",
        "Informações da conta": "settings.accountInfo",
        "Informações técnicas da tua conta ChatApp.": "settings.accountInfoDescription",
        "Conta criada": "settings.accountCreated",
        "Estado": "settings.status",
        "Ativa": "settings.active",
        "Controla a tua privacidade": "settings.privacyTitle",
        "Escolhe quem pode encontrar-te, contactar-te e visualizar as tuas informações.": "settings.privacyDescription",
        "Quem pode ver o meu perfil?": "settings.profileVisibility",
        "Todos": "settings.everyone",
        "Apenas amigos": "settings.friends",
        "Ninguém": "settings.nobody",
        "Controla como recebes os teus alertas.": "settings.notificationsTitle",
        "As opções de mensagens, chamadas, reuniões, pedidos de amizade, sons e notificações do navegador serão adicionadas posteriormente.": "settings.notificationsDescription",
        "Personaliza o visual do ChatApp.": "settings.appearanceTitle",
        "Temas claro, escuro e automático, paletas de cores, cor principal, tamanho da interface, densidade e acessibilidade serão adicionados na próxima fase.": "settings.appearanceDescription",
        "Protege a tua conta e as tuas sessões.": "settings.securityTitle",
        "Segurança da conta": "settings.securitySection",
        "Palavra-passe, sessões ativas, autenticação em dois fatores e alertas de login serão adicionados numa fase posterior.": "settings.securityDescription",
        "Informações sobre a plataforma.": "settings.aboutTitle",
        "Plataforma de comunicação": "settings.platform",
        "Aplicação": "settings.application",
        "Versão": "settings.version",
        "Web": "settings.web"
    };

    const TEXT_NODE_KEYS = new WeakMap();
    const ATTRIBUTE_KEYS = new WeakMap();

    const ATTRIBUTE_KEY_MAP = {
        "Alterar foto": "settings.changePhoto",
        "Foto de perfil": "settings.profile",
        "O teu nome completo": "settings.fullName",
        "O teu e-mail": "settings.email",
        "username": "settings.username",
        "+244 9XX XXX XXX": "settings.phone"
    };

    function getLanguage() {
        return window.ChatPreferences?.get?.().language || document.documentElement.dataset.language || "pt";
    }

    function translateKey(key) {
        const language = getLanguage();
        return DICTIONARY[language]?.[key] || DICTIONARY.pt[key] || key;
    }

    function translateNode(node) {
        if (node.nodeType !== Node.TEXT_NODE) {
            return;
        }

        const original = node.nodeValue || "";
        const trimmed = original.trim();
        const knownKey = TEXT_NODE_KEYS.get(node);
        const key = knownKey || TEXT_KEY_MAP[trimmed];

        if (!key) {
            return;
        }

        TEXT_NODE_KEYS.set(node, key);

        const translated = translateKey(key);

        if (original === translated) {
            return;
        }

        if (trimmed === original) {
            node.nodeValue = translated;
            return;
        }

        const start = original.indexOf(trimmed);
        const end = start + trimmed.length;
        node.nodeValue = original.slice(0, start) + translated + original.slice(end);
    }

    function translateElementAttributes(root) {
        root.querySelectorAll("[placeholder], [title], [aria-label]").forEach((element) => {
            ["placeholder", "title", "aria-label"].forEach((attribute) => {
                const value = element.getAttribute(attribute);
                const knownKey = ATTRIBUTE_KEYS.get(element)?.[attribute];
                const key = knownKey || ATTRIBUTE_KEY_MAP[value];

                if (!key) {
                    return;
                }

                const keys = ATTRIBUTE_KEYS.get(element) || {};
                keys[attribute] = key;
                ATTRIBUTE_KEYS.set(element, keys);
                element.setAttribute(attribute, translateKey(key));
            });
        });
    }

    function apply(root = document.body) {
        if (!root) {
            return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        let current;

        while ((current = walker.nextNode())) {
            nodes.push(current);
        }

        nodes.forEach(translateNode);
        translateElementAttributes(root);

        if (document.querySelector(".settings-page")) {
            document.title = `${translateKey("settings.title")} - ChatApp`;
        }

        window.dispatchEvent(
            new CustomEvent("chatapp:language-applied", {
                detail: { language: getLanguage() },
            }),
        );
    }

    function init() {
        apply();

        window.addEventListener("chatapp:preferences-changed", () => {
            apply();
        });

        window.addEventListener("chatapp:content-added", (event) => {
            apply(event.detail?.root || document.body);
        });
    }

    window.ChatI18n = Object.freeze({
        t: translateKey,
        apply,
        getLanguage,
        dictionary: DICTIONARY,
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();

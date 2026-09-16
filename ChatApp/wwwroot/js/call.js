"use strict";

const callConnection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/call")
  .withAutomaticReconnect()
  .build();

const rtcConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

let peerConnection = null;
let localStream = null;

let activeCallId = null;
let remoteConnectionId = null;

let currentCallType = null;
let currentCallerId = null;
let currentCallerName = null;
let currentCallerPhoto = null;

let isCaller = false;
let isCallActive = false;

async function startCallConnection() {
  if (callConnection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  try {
    await callConnection.start();

    console.log("CallHub conectado.");
  } catch (error) {
    console.error("Erro ao ligar ao CallHub:", error);

    setTimeout(startCallConnection, 3000);
  }
}

startCallConnection();

document.getElementById("btnAudioCall")?.addEventListener("click", () => startCall("audio"));

document.getElementById("btnVideoCall")?.addEventListener("click", () => startCall("video"));

document.getElementById("btnHangup")?.addEventListener("click", endCall);

document.getElementById("btnToggleMic")?.addEventListener("click", toggleMicrophone);

document.getElementById("btnToggleCam")?.addEventListener("click", toggleCamera);

document.getElementById("btnAcceptCall")?.addEventListener("click", acceptCall);

document.getElementById("btnRejectCall")?.addEventListener("click", rejectCall);

async function startCall(type) {
  if (!currentFriendId) {
    console.warn("Nenhum utilizador selecionado.");
    return;
  }

  if (callConnection.state !== signalR.HubConnectionState.Connected) {
    alert("O sistema de chamadas ainda não está conectado.");
    return;
  }

  if (activeCallId) {
    return;
  }

  isCaller = true;
  isCallActive = false;

  currentCallType = type;
  currentCallerId = currentFriendId;

  activeCallId = crypto.randomUUID();

  const friendNameElement = document.getElementById("chatFriendName");

  currentCallerName = friendNameElement?.textContent?.trim() || "Utilizador";

  const friendPhotoElement = document.getElementById("chatFriendPhoto");

  currentCallerPhoto = friendPhotoElement?.src || "/images/default-avatar.png";

  try {
    await setupLocalMedia(type === "video");
  } catch (error) {
    console.error("Erro ao acessar mídia:", error);

    alert(`Não foi possível aceder à câmara/microfone.\n\n` + `${error.name}: ${error.message}`,);

    cleanupCall();
    return;
  }

  showOutgoingCall(currentCallerName, currentCallerPhoto, type);

  try {
    await callConnection.invoke("CallUser", currentFriendId, activeCallId, type,);
  } catch (error) {
    console.error("Erro ao chamar utilizador:", error);

    showCallStatus("Não foi possível iniciar a chamada.");

    setTimeout(cleanupCall, 1500);
  }
}

callConnection.on("IncomingCall",
  (callId, callerId, callerName, callerPhoto, type) => {
    console.log("IncomingCall:", {
      callId,
      callerId,
      callerName,
      callerPhoto,
      type,
    });

    if (activeCallId) {
      return;
    }

    activeCallId = callId;

    currentCallerId = callerId;
    currentCallerName = callerName || "Utilizador";
    currentCallerPhoto = callerPhoto || "/images/default-avatar.png";

    currentCallType = type;

    isCaller = false;
    isCallActive = false;
    remoteConnectionId = null;

    showIncomingCall(currentCallerName, currentCallerPhoto, type);
  },
);

async function acceptCall() {
  if (!activeCallId || !currentCallerId) {
    return;
  }

  const callId = activeCallId;
  const callerId = currentCallerId;
  const type = currentCallType;

  hideIncomingCall();

  try {
    await setupLocalMedia(type === "video");

    showActiveCall(currentCallerName, currentCallerPhoto, type);

    await callConnection.invoke("AnswerCall", callerId, callId, true);

    await callConnection.invoke("JoinRoom", callId);

    showCallStatus("A conectar...");
  } catch (error) {
    console.error("Erro ao aceitar chamada:", error);

    try {
      await callConnection.invoke("AnswerCall", callerId, callId, false);
    } catch (_) {}

    cleanupCall();
  }
}

async function rejectCall() {
  if (!activeCallId || !currentCallerId) {
    return;
  }

  const callId = activeCallId;
  const callerId = currentCallerId;

  hideIncomingCall();

  try {
    await callConnection.invoke("AnswerCall", callerId, callId, false);
  } catch (error) {
    console.error("Erro ao recusar chamada:", error);
  }

  cleanupCall();
}

callConnection.on("CallAnswered", async (callId, accepted) => {
  if (callId !== activeCallId) {
    return;
  }

  if (!accepted) {
    showCallStatus("Chamada recusada");

    setTimeout(cleanupCall, 1000);

    return;
  }

  showCallStatus("A conectar...");

  try {
    await callConnection.invoke("JoinRoom", callId);
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);

    cleanupCall();
  }
});

callConnection.on("PeerJoined", async (userId, connectionId) => {
  console.log("PeerJoined:", userId, connectionId);

  remoteConnectionId = connectionId;

  try {
    await createPeerConnection();

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    await callConnection.invoke("SendSignal",connectionId, "offer", JSON.stringify(offer),);
  } catch (error) {
    console.error("Erro ao criar offer:", error);
  }
});

callConnection.on("ReceiveSignal",
  async (fromConnectionId, fromUserId, signalType, payload) => {
    remoteConnectionId = fromConnectionId;

    try {
      if (!peerConnection) {
        await createPeerConnection();
      }

      if (signalType === "offer") {
        const offer = JSON.parse(payload);

        await peerConnection.setRemoteDescription(offer);

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        await callConnection.invoke("SendSignal", fromConnectionId, "answer", JSON.stringify(answer),);

        return;
      }

      if (signalType === "answer") {
        const answer = JSON.parse(payload);

        await peerConnection.setRemoteDescription(answer);

        return;
      }

      if (signalType === "ice") {
        const candidate = JSON.parse(payload);

        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.warn("Erro ICE:", error);
        }
      }
    } catch (error) {
      console.error("Erro WebRTC:", error);
    }
  },
);

callConnection.on("CallEnded", (callId) => {
  if (!activeCallId || callId !== activeCallId) {
    return;
  }

  showCallStatus("Chamada terminada");

  setTimeout(cleanupCall, 500);
});

callConnection.on("PeerLeft", () => {
  if (!activeCallId) {
    return;
  }

  showCallStatus("A outra pessoa saiu da chamada");

  setTimeout(cleanupCall, 1000);
});

async function setupLocalMedia(video) {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: video,
  });

  const localVideo = document.getElementById("localVideo");

  if (!localVideo) {
    return;
  }

  localVideo.srcObject = localStream;

  localVideo.muted = true;
  localVideo.autoplay = true;
  localVideo.playsInline = true;

  if (video) {
    localVideo.classList.remove("d-none");
  } else {
    localVideo.classList.add("d-none");
  }
}

async function createPeerConnection() {
  if (peerConnection) {
    return;
  }

  peerConnection = new RTCPeerConnection(rtcConfig);

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }

  peerConnection.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");

    if (!remoteVideo) {
      return;
    }

    if (event.streams && event.streams.length) {
      remoteVideo.srcObject = event.streams[0];

      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;

      remoteVideo.classList.remove("d-none");

      document.getElementById("remoteVideoPlaceholder")?.classList.add("d-none");

      remoteVideo.play().catch(() => {});
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && remoteConnectionId) {
      callConnection.invoke("SendSignal", remoteConnectionId, "ice", JSON.stringify(event.candidate),)
        .catch((error) => console.error("Erro ICE:", error));
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    if (!peerConnection) {
      return;
    }

    const state = peerConnection.iceConnectionState;

    console.log("ICE:", state);

    if (state === "connected" || state === "completed") {
      showCallStatus("Ligação estabelecida");
    }

    if (state === "failed") {
      showCallStatus("Falha na ligação");
    }
  };

  peerConnection.onconnectionstatechange = () => {
    if (!peerConnection) {
      return;
    }

    const state = peerConnection.connectionState;

    console.log("WebRTC:", state);

    if (state === "connected") {
      isCallActive = true;

      showCallStatus("Ligação estabelecida");
    }

    if (state === "failed") {
      showCallStatus("Falha na ligação");
    }

    if (state === "disconnected") {
      showCallStatus("Ligação interrompida");
    }
  };
}

function showIncomingCall(name, photo, type) {
  const overlay = document.getElementById("incomingCallToast");

  const callerName = document.getElementById("incomingCallerName");

  const callerPhoto = document.getElementById("incomingCallerPhoto");

  const text = document.getElementById("incomingCallText");

  if (callerName) {
    callerName.textContent = name || "Utilizador";
  }

  if (callerPhoto) {
    callerPhoto.src = photo || "/images/default-avatar.png";
  }

  if (text) {
    text.textContent = type === "video" ? "Videochamada recebida" : "Chamada de áudio recebida";
  }

  const acceptButton = document.getElementById("btnAcceptCall");

  if (acceptButton) {
    const icon = acceptButton.querySelector("i");

    if (icon) {
      icon.className = type === "video" ? "bi bi-camera-video-fill" : "bi bi-telephone-fill";
    }
  }

  const incomingLabel = overlay?.querySelector(".incoming-call-label");

  if (incomingLabel) {
    incomingLabel.textContent = type === "video" ? "Videochamada recebida" : "Chamada recebida";
  }

  if (overlay) {
    overlay.classList.remove("d-none");
  }
}

function hideIncomingCall() {
  document.getElementById("incomingCallToast")?.classList.add("d-none");
}

function showOutgoingCall(name, photo, type) {
  showCallOverlay(name, photo, type);

  showCallStatus("A chamar...");
}

function showActiveCall(name, photo, type) {
  showCallOverlay(name, photo, type);

  showCallStatus("A conectar...");
}

function showCallOverlay(name, photo, type) {
  const overlay = document.getElementById("callOverlay");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("d-none");

  const nameElement = document.getElementById("callOverlayName");

  const topName = document.getElementById("callTopName");

  const avatar = document.getElementById("callAvatar");

  const typeElement = document.getElementById("callOverlayType");

  if (nameElement) {
    nameElement.textContent = name || "Utilizador";
  }

  if (topName) {
    topName.textContent = name || "Utilizador";
  }

  if (avatar) {
    avatar.src = photo || "/images/default-avatar.png";
  }

  if (typeElement) {
    typeElement.textContent = type === "video" ? "Videochamada" : "Chamada de áudio";
  }

  configureCallMode(type);
}

function configureCallMode(type) {
  const overlay = document.getElementById("callOverlay");

  const remoteVideo = document.getElementById("remoteVideo");

  const localVideo = document.getElementById("localVideo");

  const placeholder = document.getElementById("remoteVideoPlaceholder");

  const cameraButton = document.getElementById("btnToggleCam");

  if (!overlay) {
    return;
  }

  overlay.classList.remove("audio-call", "video-call");

  if (type === "video") {
    overlay.classList.add("video-call");

    cameraButton?.classList.remove("d-none");

    if (localStream) {
      localVideo?.classList.remove("d-none");
    }

    if (remoteVideo && !remoteVideo.srcObject) {
      remoteVideo.classList.add("d-none");
    }

    placeholder?.classList.remove("d-none");
  } else {
    overlay.classList.add("audio-call");

    cameraButton?.classList.add("d-none");

    localVideo?.classList.add("d-none");

    remoteVideo?.classList.add("d-none");

    placeholder?.classList.remove("d-none");
  }
}

function showCallStatus(status) {
  const statusElement = document.getElementById("callOverlayStatus");

  const topStatus = document.getElementById("callTopStatus");

  if (statusElement) {
    statusElement.textContent = status;
  }

  if (topStatus) {
    topStatus.textContent = status;
  }
}

function toggleMicrophone() {
  if (!localStream) {
    return;
  }

  const track = localStream.getAudioTracks()[0];

  if (!track) {
    return;
  }

  track.enabled = !track.enabled;

  const button = document.getElementById("btnToggleMic");

  const icon = button?.querySelector("i");

  if (!button) {
    return;
  }

  button.classList.toggle("active", !track.enabled);

  if (icon) {
    icon.className = track.enabled ? "bi bi-mic-fill" : "bi bi-mic-mute-fill";
  }
}

function toggleCamera() {
  if (!localStream) {
    return;
  }

  const track = localStream.getVideoTracks()[0];

  if (!track) {
    return;
  }

  track.enabled = !track.enabled;

  const button = document.getElementById("btnToggleCam");

  const icon = button?.querySelector("i");

  if (!button) {
    return;
  }

  button.classList.toggle("active", !track.enabled);

  if (icon) {
    icon.className = track.enabled ? "bi bi-camera-video-fill" : "bi bi-camera-video-off-fill";
  }
}

async function endCall() {
  const callId = activeCallId;

  const otherUserId = currentCallerId;

  try {
    if (otherUserId && callId) {
      await callConnection.invoke("EndCall", otherUserId, callId);
    }

    if (callId) {
      await callConnection.invoke("LeaveRoom", callId);
    }
  } catch (error) {
    console.error("Erro ao desligar:", error);
  } finally {
    cleanupCall();
  }
}

function cleanupCall() {
  if (peerConnection) {
    try {
      peerConnection.close();
    } catch (_) {}

    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (_) {}
    });

    localStream = null;
  }

  const localVideo = document.getElementById("localVideo");

  const remoteVideo = document.getElementById("remoteVideo");

  if (localVideo) {
    localVideo.srcObject = null;
    localVideo.classList.add("d-none");
  }

  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.classList.add("d-none");
  }

  document.getElementById("remoteVideoPlaceholder")?.classList.remove("d-none");

  const overlay = document.getElementById("callOverlay");

  if (overlay) {
    overlay.classList.add("d-none");

    overlay.classList.remove("audio-call", "video-call");
  }

  document.getElementById("btnToggleMic")?.classList.remove("active");

  document.getElementById("btnToggleCam")?.classList.remove("active");

  hideIncomingCall();

  activeCallId = null;
  remoteConnectionId = null;

  currentCallType = null;
  currentCallerId = null;
  currentCallerName = null;
  currentCallerPhoto = null;

  isCaller = false;
  isCallActive = false;
}

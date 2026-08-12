// call.js: chamada de áudio/vídeo 1-para-1 usando WebRTC, sinalizada pelo
// CallHub (SignalR). Ligação P2P direta entre os dois browsers depois do
// "handshake" (offer/answer/ICE) feito através do servidor.

const callConnection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/call")
    .withAutomaticReconnect()
    .build();

callConnection.start().catch(err => console.error("Erro ao ligar ao CallHub:", err));

const rtcConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    // Em produção, adicionar também um servidor TURN para redes restritas
    // (NAT simétrico, firewalls corporativos) onde STUN sozinho não chega.
};

let peerConnection = null;
let localStream = null;
let activeCallId = null;
let remoteConnectionId = null;
let isCaller = false; // só usado para UI/logs; a lógica de sinalização já não depende disto

document.getElementById("btnAudioCall")?.addEventListener("click", () => startCall("audio"));
document.getElementById("btnVideoCall")?.addEventListener("click", () => startCall("video"));
document.getElementById("btnHangup")?.addEventListener("click", () => endCall());

async function startCall(type) {
    if (!currentFriendId) return;
    isCaller = true;
    activeCallId = crypto.randomUUID();

    try {
        await setupLocalMedia(type === "video");
    } catch (err) {
        console.error("Não foi possível aceder à câmara/microfone:", err);
        alert(`Não foi possível aceder à câmara/microfone.\nErro: ${err.name} - ${err.message}`);
        isCaller = false;
        activeCallId = null;
        return;
    }

    showCallOverlay();
    await callConnection.invoke("CallUser", currentFriendId, activeCallId, type);
}

callConnection.on("IncomingCall", (callId, callerId, type) => {
    activeCallId = callId;
    remoteConnectionId = null;
    document.getElementById("incomingCallText").innerText = `Chamada de ${callerId} (${type})`;
    document.getElementById("incomingCallToast").classList.remove("d-none");

    document.getElementById("btnAcceptCall").onclick = async () => {
        document.getElementById("incomingCallToast").classList.add("d-none");
        isCaller = false;

        try {
            await setupLocalMedia(type === "video");
        } catch (err) {
            console.error("Não foi possível aceder à câmara/microfone:", err);
            alert(`Não foi possível aceder à câmara/microfone.\nErro: ${err.name} - ${err.message}`);
            await callConnection.invoke("AnswerCall", callerId, callId, false);
            return;
        }

        showCallOverlay();
        await callConnection.invoke("AnswerCall", callerId, callId, true);
        await callConnection.invoke("JoinRoom", callId);
    };
    document.getElementById("btnRejectCall").onclick = async () => {
        document.getElementById("incomingCallToast").classList.add("d-none");
        await callConnection.invoke("AnswerCall", callerId, callId, false);
    };
});

callConnection.on("CallAnswered", async (callId, accepted) => {
    if (!accepted) {
        alert("Chamada rejeitada.");
        cleanupCall();
        return;
    }
    await callConnection.invoke("JoinRoom", callId);
});

// Disparado pelo servidor para quem JÁ ESTÁ na sala, avisando que outro
// participante entrou. Independentemente de quem ligou ou atendeu, é quem
// recebe este evento que deve criar a offer para o novo participante — por
// isso já não depende de "isCaller" (esse era o bug: o lado que precisava
// de criar a offer nunca cumpria a condição, e a chamada nunca ligava).
callConnection.on("PeerJoined", async (userId, connectionId) => {
    remoteConnectionId = connectionId;
    await createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await callConnection.invoke("SendSignal", connectionId, "offer", JSON.stringify(offer));
});

callConnection.on("ReceiveSignal", async (fromConnectionId, fromUserId, signalType, payload) => {
    remoteConnectionId = fromConnectionId;
    if (!peerConnection) await createPeerConnection();

    if (signalType === "offer") {
        await peerConnection.setRemoteDescription(JSON.parse(payload));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await callConnection.invoke("SendSignal", fromConnectionId, "answer", JSON.stringify(answer));
    } else if (signalType === "answer") {
        await peerConnection.setRemoteDescription(JSON.parse(payload));
    } else if (signalType === "ice") {
        try {
            await peerConnection.addIceCandidate(JSON.parse(payload));
        } catch (e) {
            console.warn(e);
        }
    }
});

callConnection.on("CallEnded", () => cleanupCall());

async function setupLocalMedia(video) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    document.getElementById("localVideo").srcObject = localStream;
}

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        document.getElementById("remoteVideo").srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate && remoteConnectionId) {
            callConnection.invoke("SendSignal", remoteConnectionId, "ice", JSON.stringify(event.candidate));
        }
    };

    // Ajuda a perceber, na consola, se a ligação P2P está mesmo a fechar
    // (útil ao testar entre duas redes diferentes sem TURN configurado).
    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE state:", peerConnection.iceConnectionState);
    };
}

function showCallOverlay() {
    document.getElementById("callOverlay").classList.remove("d-none");
}

async function endCall() {
    if (currentFriendId && activeCallId) {
        await callConnection.invoke("EndCall", currentFriendId, activeCallId);
        await callConnection.invoke("LeaveRoom", activeCallId);
    }
    cleanupCall();
}

function cleanupCall() {
    if (peerConnection) { peerConnection.close(); peerConnection = null; }
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    activeCallId = null;
    remoteConnectionId = null;
    document.getElementById("callOverlay").classList.add("d-none");
}

document.getElementById("btnToggleMic")?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
});

document.getElementById("btnToggleCam")?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) track.enabled = !track.enabled;
});
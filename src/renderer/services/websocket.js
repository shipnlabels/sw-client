import CryptoJS from 'crypto-js';
import { ref } from 'vue';

const ENCRYPTION_KEY = import.meta.env.VITE_WS_SECRET;
const ws = ref(null);
const isConnected = ref(false);
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;
const messageQueue = ref([]);
const currentMessage = ref(null);

export const WebSocketService = {
  message: currentMessage,
  isConnected,
  connect(sessionId) {
    ws.value = new WebSocket(`${import.meta.env.VITE_WS_URL}?session=${sessionId}`, ['ws']);
    
    ws.value.onopen = () => {
      console.log('Connected to Red5 WebSocket');
      isConnected.value = true;
      reconnectAttempts.value = 0;
      this.processQueue();
    };

    ws.value.onmessage = (e) => {
      // Decrypt the string; decryptMessage returns null for empty/garbled
      // frames, which we simply ignore rather than propagate as a bad message.
      const decryptedData = this.decryptMessage(e.data);
      if (decryptedData == null) return;
      console.log('Message from Red5:', decryptedData);
      currentMessage.value = decryptedData;
    };

    ws.value.onerror = (e) => {
      console.error('WebSocket error:', e);
      isConnected.value = false;
    };
  },

  processQueue() {
    while (messageQueue.value.length > 0) {
      const { message, path } = messageQueue.value.shift();
      this.sendMessage(message, path);
    }
  },

  sendMessage(message, path = 'default') {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      messageQueue.value.push({ message, path });
      return;
    }

    try {
      const payload = {
        path: path || 'default',
        protocol: 'ws',
        content: this.encryptMessage(message),
        timestamp: Date.now()
      };

      ws.value.send(JSON.stringify(payload));
      console.log('Message sent to Red5:', message);
    } catch (error) {
      console.error('Error sending message:', error);
      messageQueue.value.push({ message, path });
    }
  },

  encryptMessage(message) {
    return CryptoJS.AES.encrypt(JSON.stringify(message), ENCRYPTION_KEY).toString();
  },
  decryptMessage(encryptedMessage) {
    // Red5 occasionally sends empty or non-JSON frames (keepalives, partial
    // messages). Decrypting those yielded "" and JSON.parse threw an uncaught
    // SyntaxError on every one. Guard both the empty case and a parse failure
    // so a stray frame never takes the socket handler down.
    if (!encryptedMessage) return null;
    let text;
    try {
      text = CryptoJS.AES.decrypt(encryptedMessage, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return null;
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }
};
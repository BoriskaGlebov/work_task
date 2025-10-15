export class WebSocketClient {
    constructor({ url, userId, onMessage = null, onOpen = null, onClose = null, onError = null }) {
        this.url = url.replace(/^http/, "ws"); // Автоматически подставит ws:// вместо http://
        this.userId = userId;
        this.socket = null;
        this.onMessage = onMessage;
        this.onOpen = onOpen;
        this.onClose = onClose;
        this.onError = onError;
        this.reconnectDelay = 3000; // мс
        this._connect();
    }

    _connect() {
        const fullUrl = `${this.url}/ws/stickers/${this.userId}/`;
        this.socket = new WebSocket(fullUrl);

        this.socket.onopen = (event) => {
            console.log("✅ WebSocket connected:", fullUrl);
            if (this.onOpen) this.onOpen(event);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📩 WebSocket message:", data);
                if (this.onMessage) this.onMessage(data);
            } catch (e) {
                console.error("Ошибка парсинга WebSocket-сообщения:", e);
            }
        };

        this.socket.onclose = (event) => {
            console.warn("⚠️ WebSocket closed:", event);
            if (this.onClose) this.onClose(event);
            setTimeout(() => this._reconnect(), this.reconnectDelay);
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket error:", error);
            if (this.onError) this.onError(error);
            this.socket.close();
        };
    }

    _reconnect() {
        console.log("🔄 Reconnecting WebSocket...");
        this._connect();
    }

    send(data) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn("⚠️ WebSocket not open, cannot send:", data);
        }
    }

    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

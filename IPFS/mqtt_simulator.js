/**
 * MQTT Simulator — Module giả lập IoT Broker (Aedes/Mosquitto)
 * Dùng cho KT-03: Đo lường Hardware Sync Latency (E5)
 * 
 * Giả lập hành vi Publish/Subscribe của smart lock trên tủ sách.
 */

const crypto = require('crypto');

// Simulated network delay range (ms)
const MIN_NETWORK_DELAY_MS = 20;
const MAX_NETWORK_DELAY_MS = 150;

// In-memory message store
const topics = {};       // { topicName: [{ message, timestamp, id }] }
const subscribers = {};  // { topicName: [callback] }
const latencyLog = [];   // [{ id, topic, publishedAt, deliveredAt, latencyMs }]

/**
 * Giả lập network delay ngẫu nhiên
 * @returns {number} Delay in milliseconds
 */
function simulateNetworkDelay() {
    return Math.floor(Math.random() * (MAX_NETWORK_DELAY_MS - MIN_NETWORK_DELAY_MS)) + MIN_NETWORK_DELAY_MS;
}

/**
 * Subscribe vào một topic
 * @param {string} topic - Tên topic (vd: "smartlock/cabinet-01/command")
 * @param {function} callback - Hàm xử lý khi nhận message: (message, metadata) => void
 */
function subscribe(topic, callback) {
    if (!subscribers[topic]) {
        subscribers[topic] = [];
    }
    subscribers[topic].push(callback);
    console.log(`[MQTT] Subscribed to topic: ${topic}`);
}

/**
 * Publish message lên một topic (giả lập network delay)
 * @param {string} topic - Tên topic
 * @param {string} message - Nội dung message (vd: "LOCK_OPEN", "LOCK_CLOSE")
 * @param {object} [meta] - Metadata bổ sung (bookId, txHash, etc.)
 * @returns {{ id: string, latencyMs: number, deliveredAt: number }} Kết quả publish
 */
function publish(topic, message, meta = {}) {
    const publishedAt = Date.now();
    const delay = simulateNetworkDelay();
    const deliveredAt = publishedAt + delay;
    const id = crypto.randomBytes(8).toString('hex');

    // Store message
    if (!topics[topic]) {
        topics[topic] = [];
    }

    const record = {
        id,
        message,
        publishedAt,
        deliveredAt,
        latencyMs: delay,
        meta
    };

    topics[topic].push(record);

    // Log latency
    latencyLog.push({
        id,
        topic,
        message,
        publishedAt,
        deliveredAt,
        latencyMs: delay,
        ...meta
    });

    // Notify subscribers
    if (subscribers[topic]) {
        subscribers[topic].forEach(cb => {
            try {
                cb(message, record);
            } catch (err) {
                console.error(`[MQTT] Subscriber error on topic ${topic}:`, err.message);
            }
        });
    }

    return record;
}

/**
 * Lấy toàn bộ log latency
 * @returns {Array} Mảng các record latency
 */
function getLatencyLog() {
    return [...latencyLog];
}

/**
 * Lấy messages từ một topic
 * @param {string} topic - Tên topic
 * @returns {Array} Mảng messages
 */
function getMessages(topic) {
    return topics[topic] || [];
}

/**
 * Tính thống kê latency
 * @returns {{ count: number, avgMs: number, minMs: number, maxMs: number, p95Ms: number }}
 */
function getLatencyStats() {
    if (latencyLog.length === 0) {
        return { count: 0, avgMs: 0, minMs: 0, maxMs: 0, p95Ms: 0 };
    }

    const latencies = latencyLog.map(r => r.latencyMs).sort((a, b) => a - b);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(latencies.length * 0.95);

    return {
        count: latencies.length,
        avgMs: Math.round(sum / latencies.length),
        minMs: latencies[0],
        maxMs: latencies[latencies.length - 1],
        p95Ms: latencies[p95Index] || latencies[latencies.length - 1]
    };
}

/**
 * Reset toàn bộ state (dùng giữa các lần chạy test)
 */
function reset() {
    Object.keys(topics).forEach(k => delete topics[k]);
    Object.keys(subscribers).forEach(k => delete subscribers[k]);
    latencyLog.length = 0;
    console.log("[MQTT] Simulator state reset.");
}

// Self-test khi chạy trực tiếp
if (require.main === module) {
    console.log("--- BẮT ĐẦU GIẢ LẬP MQTT / STARTING MQTT SIMULATOR ---");

    subscribe("smartlock/cabinet-01/command", (msg, meta) => {
        console.log(`[SUB] Received: ${msg} (latency: ${meta.latencyMs}ms)`);
    });

    const result = publish("smartlock/cabinet-01/command", "LOCK_OPEN", { bookId: 1 });
    console.log(`[TEST] Published with latency: ${result.latencyMs}ms`);

    const stats = getLatencyStats();
    console.log("[TEST] Stats:", stats);
}

module.exports = {
    subscribe,
    publish,
    getLatencyLog,
    getMessages,
    getLatencyStats,
    reset
};

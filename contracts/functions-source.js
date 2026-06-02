// This code executes in the Chainlink Functions Decentralized Oracle Network
const deviceId = args[0];
// const startDate = args[1]; // e.g. "2025-01-01"

// Access the Tuya API URL from secrets
// In production this is Encrypted. In local, we pass it plaintext.
const apiUrl = secrets.tuyaApiUrl;

if (!apiUrl) {
    throw Error("Missing tuyaApiUrl secret");
}

console.log(`Sending request to ${apiUrl}/devices/${deviceId}/logs`);

const request = Functions.makeHttpRequest({
    url: `${apiUrl}/devices/${deviceId}/logs`,
    method: "GET",
    headers: {
        "Content-Type": "application/json"
    }
});

const response = await request;

if (response.error) {
    throw Error(`Request failed: ${response.error}`);
}

const data = response.data;
// Logic to parse logs and determine something
// For simple demo, just return the number of logs
const totalLogs = data.result.total || 0;

return Functions.encodeUint256(totalLogs);

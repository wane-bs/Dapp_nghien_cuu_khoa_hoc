const axios = require('axios');

class MockIoTAdapter {
    static async generatePasscode(deviceId) {
        console.log("MockIoTAdapter: Calling Mock Tuya Server...");
        const response = await axios.post(`http://localhost:4000/tuya/v1.0/devices/${deviceId}/door-lock/password-free/door-operate`);

        if (response.data.success) {
            return response.data.result;
        } else {
            throw new Error("Failed to generate code");
        }
    }
}

module.exports = MockIoTAdapter;

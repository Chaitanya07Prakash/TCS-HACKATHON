const axios = require('axios');

async function runTest() {
  try {
    console.log("=== 1. Logging in ===");
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'arjun@campus.edu',
      password: 'password123'
    });
    
    const token = loginRes.data.data.token;
    console.log("Login Success! Token received.\n");

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    console.log("=== 2. Fetching Dashboard ===");
    const dashboardRes = await axios.get('http://localhost:5000/api/dashboard', config);
    console.log(JSON.stringify(dashboardRes.data, null, 2));
    console.log("\n");

    console.log("=== 3. Chatting with Assistant ===");
    const chatRes = await axios.post('http://localhost:5000/api/assistant/chat', {
      message: "What do I need to complete this week?"
    }, config);
    console.log(JSON.stringify(chatRes.data, null, 2));

  } catch (error) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

runTest();

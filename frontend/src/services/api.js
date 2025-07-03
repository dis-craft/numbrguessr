// frontend/src/services/api.js

// IMPORTANT: Replace this with your actual Cloudflare Worker URL in production.
const BASE_URL = 'https://guessing-game.mrsrikart.workers.dev/api/';

/**
 * A helper function for making API requests.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - The options for the fetch call (method, headers, body).
 * @returns {Promise<any>} - The JSON response from the API.
 */
async function apiRequest(endpoint, options = {}) {
    const { method = 'GET', body = null } = options;

    const headers = {
        'Content-Type': 'application/json',
    };

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error: ${errorData.message || 'Unknown error'}`);
    }

    return response.json();
}

// --- API Functions ---

export const submitSingle = (playerName, guesses, timeMs) => {
    return apiRequest('single', {
        method: 'POST',
        body: { playerName, guesses, timeMs },
    });
};

export const fetchLeaderboard = () => {
    return apiRequest('leaderboard');
};

export const joinRoom = (roomId, playerName) => {
    return apiRequest(`multi/room/${roomId}/join`, {
        method: 'POST',
        body: { playerName },
    });
};

export const makeGuess = (roomId, playerIndex, guess) => {
    return apiRequest(`multi/room/${roomId}/guess`, {
        method: 'POST',
        body: { playerIndex, guess },
    });
};

export const getRoomState = (roomId) => {
    return apiRequest(`multi/room/${roomId}/state`);
};
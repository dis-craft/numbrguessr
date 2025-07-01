const API = import.meta.env.VITE_API_BASE;

export function submitSingle(playerName, guesses, timeMs) {
  return fetch(`${API}api/single`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ playerName, guesses, timeMs })
  });
}

export function joinRoom(roomId, playerName) {
  return fetch(`${API}api/multi/room/${roomId}/join`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ playerName })
  }).then(r => r.json());
}

export function makeGuess(roomId, playerIndex, guess) {
  return fetch(`${API}api/multi/room/${roomId}/guess`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ playerIndex, guess })
  }).then(r => r.json());
}

// ← new
export async function fetchLeaderboard() {
  const res = await fetch(`${API}api/leaderboard`);
  if (!res.ok) throw new Error('Leaderboard fetch failed');
  return res.json();
}

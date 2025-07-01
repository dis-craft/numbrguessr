import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { submitSingle, joinRoom, makeGuess } from '../services/api';

export default function Game() {
  const [params] = useSearchParams();
  const mode      = params.get('mode');
  const name      = params.get('name');
  const roomId    = params.get('room');
  const nav       = useNavigate();

  // Single‑player secret
  const [secret]    = useState(mode==='single' ? Math.floor(Math.random()*100)+1 : null);
  const [guess, setGuess]     = useState('');
  const [hint, setHint]       = useState('');
  const [count, setCount]     = useState(0);
  const [timeStart] = useState(Date.now());
  const [playerIndex, setPlayerIndex] = useState(null);

  // Join multiplayer on mount
  useEffect(() => {
    if (mode==='multiplayer') {
      if (!roomId) return nav('/');
      joinRoom(roomId, name).then(data => {
        // ✅ FIX: The API now returns { room: {...}, playerIndex: X }.
        // We correctly access `data.playerIndex` here.
        setPlayerIndex(data.playerIndex);
      }).catch(() => {
        alert('Join failed');
        nav('/');
      });
    }
  }, []);

  // Handler for both modes
  const handleSubmit = async e => {
    e.preventDefault();
    const g = parseInt(guess, 10);
    if (isNaN(g)) return;
    setCount(c => c+1);

    if (mode === 'single') {
      if (g === secret) {
        const elapsed = Date.now() - timeStart;
        await submitSingle(name, count+1, elapsed);
        alert(`Correct! ${count+1} guesses in ${Math.round(elapsed/1000)}s`);
        return nav('/leaderboard');
      } else {
        setHint(g < secret ? 'Higher!' : 'Lower!');
      }
    } else {
      // multiplayer
      const res = await makeGuess(roomId, playerIndex, g);
      if (res.feedback === 'correct') {
        alert(`You won in ${count+1} guesses!`);
        return nav('/leaderboard');
      } else {
        setHint(res.feedback === 'higher' ? 'Higher!' : 'Lower!');
      }
    }

    setGuess('');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>{ mode==='single' ? 'Single Player' : `Room: ${roomId}` }</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Guesses:</strong> {count}</p>
      <p style={{ minHeight: '1.2em' }}><strong>Hint:</strong> {hint}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={guess}
          onChange={e=>setGuess(e.target.value)}
          placeholder="Enter your guess"
          autoFocus
          style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
        />
        <button
          type="submit"
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem'
          }}
        >
          Guess
        </button>
      </form>
    </div>
  );
}
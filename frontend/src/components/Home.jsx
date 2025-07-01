import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('single');
  const [room, setRoom] = useState('');
  const nav = useNavigate();

  function start() {
    if (!name) return alert('Enter your name');
    if (mode === 'multiplayer' && !room) return alert('Enter or create room ID');
    nav(`/game?mode=${mode}&name=${encodeURIComponent(name)}&room=${room}`);
  }

  return (
    <div>
      <h1>Number Guessing</h1>
      <div>
        <label>Your Name:<br/>
          <input value={name} onChange={e=>setName(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio" value="single"
            checked={mode==='single'}
            onChange={()=>setMode('single')}
          /> Single Player
        </label>
        <label style={{marginLeft: '1rem'}}>
          <input
            type="radio" value="multiplayer"
            checked={mode==='multiplayer'}
            onChange={()=>setMode('multiplayer')}
          /> Multiplayer
        </label>
      </div>
      {mode==='multiplayer' && (
        <div>
          <button onClick={()=>setRoom(crypto.randomUUID())}>
            Create New Room
          </button>
          <div>
            <label>Or join Room ID:<br/>
              <input value={room} onChange={e=>setRoom(e.target.value)} />
            </label>
          </div>
        </div>
      )}
      <button onClick={start}>Start Game</button>
    </div>
  );
}

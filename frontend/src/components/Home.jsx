import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

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
        <div className="home-container">
            <div className="game-header">
                <h1 className="game-title">NUMBER<span className="highlight">GUESSER</span></h1>
                <div className="game-subtitle">Code Breaker Challenge</div>
            </div>
            
            <div className="game-card">
                <div className="input-group">
                    <label>Agent Identification</label>
                    <input 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Enter codename"
                        className="agent-input"
                    />
                </div>
                
                <div className="mode-selector">
                    <div className="mode-title">Mission Type:</div>
                    <div className="mode-options">
                        <label className={`mode-card ${mode === 'single' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                value="single"
                                checked={mode === 'single'}
                                onChange={() => setMode('single')}
                                style={{ display: 'none' }}
                            />
                            <div className="mode-content">
                                <div className="mode-icon">👤</div>
                                <div className="mode-label">Solo Operation</div>
                            </div>
                        </label>
                        
                        <label className={`mode-card ${mode === 'multiplayer' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                value="multiplayer"
                                checked={mode === 'multiplayer'}
                                onChange={() => setMode('multiplayer')}
                                style={{ display: 'none' }}
                            />
                            <div className="mode-content">
                                <div className="mode-icon">👥</div>
                                <div className="mode-label">Team Battle</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                {mode === 'multiplayer' && (
                    <div className="room-section">
                        <button onClick={() => setRoom(crypto.randomUUID())} className="btn create-room">
                            Create New War Room
                        </button>
                        
                        <div className="input-group">
                            <label>Or Enter Room ID:</label>
                            <input 
                                value={room} 
                                onChange={e => setRoom(e.target.value)} 
                                placeholder="Enter room code"
                                className="room-input"
                            />
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={start} 
                    className="start-btn"
                    disabled={!name || (mode === 'multiplayer' && !room)}
                >
                    {!name ? 'ENTER CODENAME' : 'BEGIN MISSION'}
                </button>
            </div>
            
            <div className="game-footer">
                <button onClick={() => nav('/leaderboard')} className="btn leaderboard-link">
                    View Command Center
                </button>
            </div>
        </div>
    );
}
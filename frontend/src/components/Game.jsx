import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { submitSingle, joinRoom, makeGuess, getRoomState } from '../services/api';
import './Game.css';

export default function Game() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const mode = params.get('mode');
    const name = params.get('name');
    const roomId = params.get('room');
    const [secret] = useState(mode === 'single' ? Math.floor(Math.random() * 100) + 1 : null);
    const [timeStart] = useState(Date.now());
    const [guess, setGuess] = useState('');
    const [hint, setHint] = useState('');
    const [guessCount, setGuessCount] = useState(0);
    const [playerIndex, setPlayerIndex] = useState(null);
    const [room, setRoom] = useState(null);
    const [hintAnimation, setHintAnimation] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (hint) {
            setHintAnimation(true);
            const timer = setTimeout(() => setHintAnimation(false), 500);
            return () => clearTimeout(timer);
        }
    }, [hint]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        if (mode === 'multiplayer') {
            if (!roomId || !name) return navigate('/');

            joinRoom(roomId, name)
                .then(data => {
                    setPlayerIndex(data.playerIndex);
                    setRoom(data.room);
                })
                .catch(err => {
                    alert(`Failed to join room: ${err.message}`);
                    navigate('/');
                });
        }
    }, [mode, roomId, name, navigate]);

    useEffect(() => {
        if (mode !== 'multiplayer' || !roomId || (room && room.gameOver)) {
            return;
        }

        const pollInterval = setInterval(() => {
            getRoomState(roomId)
                .then(currentState => {
                    setRoom(currentState);
                    if (currentState.gameOver) {
                        clearInterval(pollInterval);
                    }
                })
                .catch(err => {
                    console.error("Polling failed:", err);
                    clearInterval(pollInterval);
                });
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [mode, roomId, room]);

    const handleSubmit = async e => {
        e.preventDefault();
        const g = parseInt(guess, 10);
        if (isNaN(g)) return;

        setGuessCount(c => c + 1);

        if (mode === 'single') {
            if (g === secret) {
                const elapsed = Date.now() - timeStart;
                await submitSingle(name, guessCount + 1, elapsed);
                alert(`Correct! ${guessCount + 1} guesses in ${Math.round(elapsed / 1000)}s`);
                return navigate('/leaderboard');
            } else {
                setHint(g < secret ? 'Higher!' : 'Lower!');
            }
        } else {
            try {
                const res = await makeGuess(roomId, playerIndex, g);
                if (res.feedback === 'correct') {
                    setRoom(res.finalState);
                } else {
                    setHint(res.feedback === 'higher' ? 'Higher!' : 'Lower!');
                }
            } catch (err) {
                alert(`Error making guess: ${err.message}`);
            }
        }
        setGuess('');
    };

    if (mode === 'multiplayer' && room && room.gameOver) {
        return (
            <div className="game-over-screen">
                <div className="confetti"></div>
                <h2 className="game-over-title">Game Over!</h2>
                <div className="winner-badge">
                    <div className="crown">👑</div>
                    <h3>Winner: {room.winner}</h3>
                </div>
                
                <div className="player-stats">
                    {room.players.map(p => (
                        <div key={p.name} className={`player-card ${p.name === name ? 'current-player' : ''}`}>
                            <div className="player-name">{p.name} {p.name === name && <span className="you-badge">(YOU)</span>}</div>
                            <div className="guesses-count">{p.guesses} guesses</div>
                        </div>
                    ))}
                </div>
                
                <div className="action-buttons">
                    <button onClick={() => navigate('/leaderboard')} className="btn leaderboard-btn">
                        View Leaderboard
                    </button>
                    <button onClick={() => navigate('/')} className="btn play-again-btn">
                        Play Again
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="game-container">
            <div className="game-header">
                <h2>{mode === 'single' ? 'Solo Mission' : `Battle Room: ${roomId}`}</h2>
                <div className="player-info">
                    <div className="player-avatar">{name.charAt(0).toUpperCase()}</div>
                    <div className="player-name">{name}</div>
                </div>
            </div>
            
            <div className="game-body">
                {mode === 'single' ? (
                    <div className="solo-game">
                        <div className="stats-panel">
                            <div className="stat-box">
                                <div className="stat-label">Guesses</div>
                                <div className="stat-value">{guessCount}</div>
                            </div>
                        </div>
                        
                        <div className={`hint-box ${hintAnimation ? 'pulse' : ''}`}>
                            {hint || "Enter your first guess!"}
                        </div>
                        
                        <form onSubmit={handleSubmit} className="guess-form">
                            <input
                                ref={inputRef}
                                type="number"
                                value={guess}
                                onChange={e => setGuess(e.target.value)}
                                placeholder="1-100"
                                min="1"
                                max="100"
                                className="guess-input"
                            />
                            <button type="submit" className="submit-guess">
                                Fire! 🔥
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="multiplayer-game">
                        {!room ? (
                            <div className="loading-room">
                                <div className="spinner"></div>
                                <p>Entering battle room...</p>
                            </div>
                        ) : (
                            <>
                                <div className="multiplayer-stats">
                                    <div className="stat-box">
                                        <div className="stat-label">Your Guesses</div>
                                        <div className="stat-value">{room.players[playerIndex]?.guesses || 0}</div>
                                    </div>
                                    
                                    <div className={`hint-box ${hintAnimation ? 'pulse' : ''}`}>
                                        {hint || "Waiting for your move..."}
                                    </div>
                                </div>
                                
                                <form onSubmit={handleSubmit} className="guess-form" disabled={room.players.length < 2}>
                                    <input
                                        ref={inputRef}
                                        type="number"
                                        value={guess}
                                        onChange={e => setGuess(e.target.value)}
                                        placeholder="1-100"
                                        min="1"
                                        max="100"
                                        className="guess-input"
                                        disabled={room.players.length < 2}
                                    />
                                    <button 
                                        type="submit" 
                                        className="submit-guess"
                                        disabled={room.players.length < 2}
                                    >
                                        {room.players.length < 2 ? "Waiting for opponent..." : "Launch Attack!"}
                                    </button>
                                </form>

                                <div className="players-panel">
                                    <h4>Battle Arena</h4>
                                    <div className="player-list">
                                        {room.players.map((p, index) => (
                                            <div 
                                                key={p.name} 
                                                className={`player-tag ${index === playerIndex ? 'you' : ''}`}
                                            >
                                                <div className="player-status">
                                                    <div className="player-name">{p.name}</div>
                                                    <div className="player-guesses">{p.guesses} shots</div>
                                                </div>
                                                {index === playerIndex && <div className="you-indicator">YOU</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            <div className="game-footer">
                <button onClick={() => navigate('/')} className="btn exit-btn">
                    Exit Mission
                </button>
            </div>
        </div>
    );
}
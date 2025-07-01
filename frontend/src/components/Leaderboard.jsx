import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

export default function Leaderboard() {
    const [list, setList] = useState([]);
    const nav = useNavigate();

    useEffect(() => {
        fetchLeaderboard().then(setList).catch(console.error);
    }, []);

    return (
        <div className="leaderboard-container">
            <div className="game-header">
                <h1>COMMAND CENTER</h1>
                <div className="subtitle">Elite Code Breakers</div>
            </div>
            
            <div className="leaderboard-card">
                <button onClick={() => nav('/')} className="btn home-btn">
                    Return to Base
                </button>
                
                <div className="table-container">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Mission</th>
                                <th>Shots Fired</th>
                                <th>Time (s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((r, index) => (
                                <tr key={r.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                                    <td>
                                        {index < 3 && <span className="rank-badge">{index + 1}</span>}
                                        {r.player_name}
                                    </td>
                                    <td>{r.mode}</td>
                                    <td>{r.guesses}</td>
                                    <td>{Math.round(r.time_ms/1000)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="game-footer">
                <div className="hint-text">Can you crack the top 10?</div>
            </div>
        </div>
    );
}
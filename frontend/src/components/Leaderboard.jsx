import { useEffect, useState } from 'react';
import { fetchLeaderboard } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const [list, setList] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    fetchLeaderboard().then(setList).catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Leaderboard</h1>
      <button onClick={()=>nav('/')} style={{ marginBottom: '1rem' }}>
        Home
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Player','Mode','Guesses','Time (s)'].map(h => (
              <th key={h} style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id}>
              <td style={{ border: '1px solid #eee', padding: '0.5rem' }}>{r.player_name}</td>
              <td style={{ border: '1px solid #eee', padding: '0.5rem' }}>{r.mode}</td>
              <td style={{ border: '1px solid #eee', padding: '0.5rem' }}>{r.guesses}</td>
              <td style={{ border: '1px solid #eee', padding: '0.5rem' }}>
                {Math.round(r.time_ms/1000)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

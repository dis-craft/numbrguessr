import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
// import Lobby from './components/Lobby';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* <Route path="/lobby" element={<Lobby />} /> */}
      <Route path="/game" element={<Game />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
    </Routes>
  );
}

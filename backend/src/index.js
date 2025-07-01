// backend/src/index.js

import { getSupabaseClient } from './utils/supabaseClient';

// Define reusable CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allows requests from any origin. For production, restrict this to your frontend's domain.
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// =======================================================
// The Main Worker Fetch Handler (Acts as a Router)
// =======================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle all CORS preflight requests first.
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      // --- API ROUTING ---

      // Route: /api/single (Stateless)
      if (url.pathname === '/api/single' && request.method === 'POST') {
        const supabase = getSupabaseClient(env);
        const body = await request.json();
        const { playerName, guesses, timeMs } = body;

        const { error } = await supabase.from('leaderboard').insert([
          { player_name: playerName, guesses, time_ms: timeMs, mode: 'single' }
        ]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // Route: /api/leaderboard (Stateless)
      if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        const supabase = getSupabaseClient(env);
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('guesses', { ascending: true })
          .order('time_ms', { ascending: true })
          .limit(10);

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // Route for all Multiplayer actions (Stateful)
      // ✅ FIX: The regex now includes a hyphen (-) to correctly parse room IDs.
      const match = url.pathname.match(/^\/api\/multi\/room\/([a-zA-Z0-9-]+)\//);
      if (match) {
        const roomId = match[1];
        const id = env.GAME_SESSIONS.idFromName(roomId);
        const stub = env.GAME_SESSIONS.get(id);
        return stub.fetch(request);
      }

      // If no route matches, return 404.
      return new Response('Not found', {
        status: 404,
        headers: { ...CORS_HEADERS },
      });

    } catch (err) {
      // Log the full error to the worker console and send details to the client
      console.error(err);
      const errorResponse = {
        message: err.message,
        stack: err.stack, // The stack trace can be very helpful
        details: err.details, // Supabase-specific details
        hint: err.hint     // Supabase-specific hints
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};

// =======================================================
// The Durable Object Class (Handles state for one game room)
// =======================================================
export class GameSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.supabase = null;
    this.room = {};

    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('room');
      this.room = stored || {
        players: [],
        secret: null,
        start: null,
        turn: 0,
      };
    });
  }

  getSupabase() {
    if (!this.supabase) {
      this.supabase = getSupabaseClient(this.env);
    }
    return this.supabase;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    // Endpoint: /api/multi/room/{id}/join
    if (url.pathname.endsWith('/join')) {
      if (this.room.players.length >= 2) {
        return new Response('Room is full', { status: 403, headers: CORS_HEADERS });
      }
      const { playerName } = await request.json();
      
      // ✅ FIX: Get the player's index before they are added to the array.
      const playerIndex = this.room.players.length;
      this.room.players.push({ name: playerName, guesses: 0 });

      if (this.room.players.length === 1) {
        this.room.secret = Math.floor(Math.random() * 100) + 1;
        this.room.start = Date.now();
      }

      await this.state.storage.put('room', this.room);

      // ✅ FIX: Return an object containing both the room state and the new player's index.
      return new Response(JSON.stringify({ room: this.room, playerIndex }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Endpoint: /api/multi/room/{id}/guess
    if (url.pathname.endsWith('/guess')) {
      const { playerIndex, guess } = await request.json();
      const p = this.room.players[playerIndex];
      if (!p) {
        return new Response('Player not found', { status: 400, headers: CORS_HEADERS });
      }
      p.guesses++;

      let feedback = 'lower';
      if (guess < this.room.secret) feedback = 'higher';
      if (guess === this.room.secret) feedback = 'correct';

      if (feedback === 'correct') {
        const duration = Date.now() - this.room.start;
        await this.getSupabase().from('leaderboard').insert({
          player_name: p.name,
          guesses: p.guesses,
          time_ms: duration,
          mode: 'multiplayer'
        });
      }

      await this.state.storage.put('room', this.room);
      return new Response(JSON.stringify({ feedback }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
    
    // Endpoint: /api/multi/room/{id}/state (For polling)
    if (url.pathname.endsWith('/state')) {
        return new Response(JSON.stringify(this.room), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
    }

    return new Response('Durable Object endpoint not found', { status: 404, headers: CORS_HEADERS });
  }
}
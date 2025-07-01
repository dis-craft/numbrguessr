export class GameSession {
    constructor(state, env) {
      this.state = state;
      this.env   = env;
      // Load or initialize room state
      this.state.blockConcurrencyWhile(async () => {
        const stored = await state.storage.get('room');
        this.room = stored || {
          players: [],    // each: { name, guesses }
          secret: null,   // the target number
          start: null     // timestamp
        };
      });
    }
  
    async fetch(request) {
      const url = new URL(request.url);
      // Join endpoint: POST /api/multi/room/{id}/join
      if (url.pathname.endsWith('/join')) {
        const { playerName } = await request.json();
        if (this.room.players.length >= 2) {
          return new Response('Room full', { status: 403 });
        }
        this.room.players.push({ name: playerName, guesses: 0 });
        // On first join, generate secret and start time
        if (!this.room.secret) {
          this.room.secret = Math.floor(Math.random() * 100) + 1;
          this.room.start  = Date.now();
        }
        await this.state.storage.put('room', this.room);
        return new Response(
          JSON.stringify({ sessionId: this.state.id.toString() }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
  
      // Guess endpoint: POST /api/multi/room/{id}/guess
      if (url.pathname.endsWith('/guess')) {
        const { playerIndex, guess } = await request.json();
        const p = this.room.players[playerIndex];
        p.guesses++;
        // Provide hint
        let feedback = guess === this.room.secret
          ? 'correct'
          : guess < this.room.secret
            ? 'higher'
            : 'lower';
  
        // On correct guess, record to Supabase
        if (feedback === 'correct') {
          const duration = Date.now() - this.room.start;
          await this.env.SUPABASE
            .from('leaderboard')
            .insert({
              player_name: p.name,
              guesses:     p.guesses,
              time_ms:     duration,
              mode:        'multiplayer'
            });
        }
  
        await this.state.storage.put('room', this.room);
        return new Response(
          JSON.stringify({ feedback }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
  
      return new Response('Not found', { status: 404 });
    }
  }
  
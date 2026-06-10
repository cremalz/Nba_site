    const LOGO = a => `https://a.espncdn.com/i/teamlogos/nba/500/${a.toLowerCase()}.png`;
    const pad = n => String(n).padStart(2,'0');
 
    // Date label
    const now = new Date();
    document.getElementById('date-label').textContent =
      now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
 
    // Ghost number rotation
    const jerseys = ['23','24','33','6','3','30','35','11','13'];
    document.getElementById('ghost-number').textContent = jerseys[Math.floor(Math.random() * jerseys.length)];
 
    // ── GAMES ──────────────────────────────────────────────
    async function loadGames() {
      const list = document.getElementById('games-list');
      try {
        const ds = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
        const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ds}`);
        const data = await r.json();
        const events = data.events || [];
 
        document.getElementById('stat-games').textContent = events.length || '0';
        const liveCount = events.filter(e => e.competitions[0].status.type.state === 'in').length;
        document.getElementById('stat-live').textContent = liveCount;
        if (liveCount > 0) document.getElementById('live-indicator').style.display = 'block';
 
        if (!events.length) {
          list.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:1rem 0;text-align:center">Sem jogos agendados para hoje.</p>';
          return;
        }
 
        const TROPHY_SVG = `
          <svg class="trophy-svg glow" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- base plate -->
            <rect x="8" y="50" width="24" height="4" rx="1.5" fill="#c8a830"/>
            <!-- stem -->
            <rect x="17" y="42" width="6" height="9" fill="#c8a830"/>
            <!-- stem wide -->
            <rect x="13" y="46" width="14" height="3" rx="1" fill="#b8940a"/>
            <!-- cup body -->
            <path d="M10 10 Q10 38 20 40 Q30 38 30 10 Z" fill="#c8a830"/>
            <!-- cup shine -->
            <path d="M13 13 Q12 28 16 34" stroke="#f0d060" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
            <!-- left handle -->
            <path d="M10 14 Q2 16 3 24 Q4 30 10 30" stroke="#c8a830" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <!-- right handle -->
            <path d="M30 14 Q38 16 37 24 Q36 30 30 30" stroke="#c8a830" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <!-- top rim -->
            <rect x="9" y="8" width="22" height="4" rx="2" fill="#b8940a"/>
            <!-- top ball -->
            <circle cx="20" cy="6" r="3" fill="#c8a830"/>
            <!-- inner detail -->
            <path d="M15 18 Q20 22 25 18" stroke="#b8940a" stroke-width="1" fill="none" opacity="0.7"/>
          </svg>`;
 
        list.innerHTML = events.map(ev => {
          const comp = ev.competitions[0];
          const home = comp.competitors.find(c => c.homeAway === 'home') || comp.competitors[0];
          const away = comp.competitors.find(c => c.homeAway === 'away') || comp.competitors[1];
          const st = comp.status;
          const isLive = st.type.state === 'in';
          const isFinalScore = st.type.state === 'post';
          const hasScore = isLive || isFinalScore;
          const hs = parseInt(home.score || 0);
          const as_ = parseInt(away.score || 0);
 
          // Detect NBA Finals
          const notes = comp.notes || [];
          const headline = ev.name || ev.shortName || '';
          const isNBAFinals = notes.some(n =>
            (n.headline || '').toLowerCase().includes('final') ||
            (n.type || '').toLowerCase().includes('final')
          ) || headline.toLowerCase().includes('nba finals') ||
            (ev.season?.slug || '').includes('nba-finals') ||
            comp.series != null;
 
          const seriesText = comp.series
            ? (() => {
                const s = comp.series;
                return `Série: ${s.completed ? 'Encerrada' : `${s.title || ''}`}`;
              })()
            : '';
 
          const gameNum = notes.find(n => n.headline)?.headline || '';
 
          let statusHTML = '';
          if (isLive) {
            const q = st.period ? `Q${st.period}` : '';
            const clk = st.displayClock || '';
            statusHTML = `<span class="game-status-text live">${clk}<br>${q}</span>`;
          } else if (isFinalScore) {
            statusHTML = `<span class="game-status-text">FINAL</span>`;
          } else {
            const d = new Date(comp.date);
            statusHTML = `<span class="game-status-text">${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>`;
          }
 
          const venue = comp.venue ? `<span class="game-venue">${comp.venue.fullName?.split(',')[0] || ''}</span>` : '';
 
          const finalsHeader = isNBAFinals ? `
            <div class="finals-banner">
              ${TROPHY_SVG.replace('class="trophy-svg glow"','class="trophy-svg glow" style="width:18px;height:24px;margin-right:2px"')}
              <span class="finals-label">NBA Finals</span>
              ${gameNum ? `<span class="finals-game-num">· ${gameNum}</span>` : ''}
            </div>` : '';
 
          const trophyCol = isNBAFinals ? `
            <div class="trophy-wrap">
              ${TROPHY_SVG}
              ${seriesText ? `<span class="trophy-series">${seriesText}</span>` : ''}
            </div>` : `<div class="game-meta">${statusHTML}${venue}</div>`;
 
          return `
            <div class="game-card ${isLive ? 'live' : ''} ${isNBAFinals ? 'finals' : ''}">
              <div class="${isLive ? 'live-pip' : 'dead-pip'}"></div>
              <div class="game-teams">
                ${finalsHeader}
                <div class="team-row ${hasScore && as_ > hs ? 'winner' : ''}">
                  <img class="team-logo" src="${LOGO(away.team.abbreviation)}" alt="${away.team.abbreviation}" onerror="this.style.opacity=0">
                  <span class="team-name">${away.team.shortDisplayName || away.team.abbreviation}</span>
                  <span class="team-score ${hasScore && as_ >= hs ? 'winning' : ''}">${hasScore ? as_ : '–'}</span>
                </div>
                <div class="team-row ${hasScore && hs > as_ ? 'winner' : ''}">
                  <img class="team-logo" src="${LOGO(home.team.abbreviation)}" alt="${home.team.abbreviation}" onerror="this.style.opacity=0">
                  <span class="team-name">${home.team.shortDisplayName || home.team.abbreviation}</span>
                  <span class="team-score ${hasScore && hs >= as_ ? 'winning' : ''}">${hasScore ? hs : '–'}</span>
                </div>
                ${isNBAFinals ? `<div class="game-meta" style="margin-top:4px">${statusHTML}${venue}</div>` : ''}
              </div>
              ${trophyCol}
            </div>`;
        }).join('');
      } catch {
        list.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:1rem 0;text-align:center">Não foi possível carregar os jogos.</p>';
      }
    }
 
    // ── STANDINGS ──────────────────────────────────────────
    async function loadStandings() {
      const wrap = document.getElementById('standings-wrap');
      try {
        const r = await fetch('https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&type=0');
        const data = await r.json();
        const confs = data.children || [];
        if (!confs.length) throw new Error();
 
        const renderConf = (conf, label) => {
          const entries = (conf.standings?.entries || []).slice(0, 8);
          const rows = entries.map((entry, i) => {
            const t = entry.team;
            const wins = Math.round(entry.stats?.find(s => s.name === 'wins')?.value ?? 0);
            const losses = Math.round(entry.stats?.find(s => s.name === 'losses')?.value ?? 0);
            return `
              <div class="standing-row">
                <span class="s-rank">${i+1}</span>
                <img class="s-logo" src="${LOGO(t.abbreviation)}" alt="${t.abbreviation}" onerror="this.style.opacity=0">
                <span class="s-name">${t.shortDisplayName || t.abbreviation}</span>
                <span class="s-record">${wins}–${losses}</span>
              </div>`;
          }).join('');
          return `<div><div class="conf-label">${label}</div>${rows}</div>`;
        };
 
        const east = confs.find(c => (c.name||'').toLowerCase().includes('east')) || confs[0];
        const west = confs.find(c => (c.name||'').toLowerCase().includes('west')) || confs[1];
        wrap.innerHTML = renderConf(east, 'Leste') + renderConf(west, 'Oeste');
      } catch {
        wrap.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:1rem 0;grid-column:1/-1;text-align:center">Não foi possível carregar a classificação.</p>';
      }
    }
 
    // ── CHATBOT ────────────────────────────────────────────
    const SYSTEM = `Você é um assistente especializado exclusivamente em NBA e basquete.
Responda APENAS perguntas sobre NBA: times, jogadores, estatísticas, regras, história, playoffs, Draft, records e curiosidades.
Se a pergunta não for sobre basquete ou NBA, diga educadamente: "Só posso ajudar com assuntos de NBA e basquete!"
Seja direto, informativo e use linguagem natural em português brasileiro.
Máximo 3 parágrafos curtos por resposta.`;
 
    const chatHistory = [];
    let isSending = false;
 
    function appendMsg(role, text, isTyping = false) {
      const msgs = document.getElementById('chat-messages');
      const div = document.createElement('div');
      div.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
      const initials = role === 'user' ? '👤' : 'N';
      div.innerHTML = `
        <div class="msg-avatar">${initials}</div>
        <div class="msg-bubble ${isTyping ? 'typing' : ''}" id="${isTyping ? 'typing-bubble' : ''}">${text}</div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
      return div;
    }
 
    async function sendMessage() {
      if (isSending) return;
      const input = document.getElementById('chat-input');
      const text = input.value.trim();
      if (!text) return;
 
      isSending = true;
      input.value = '';
      document.getElementById('chat-send').disabled = true;
 
      appendMsg('user', text);
      chatHistory.push({ role: 'user', content: text });
 
      const typingEl = appendMsg('bot', 'Digitando…', true);
 
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            system: SYSTEM,
            messages: chatHistory
          })
        });
        const data = await res.json();
        const reply = data.content?.[0]?.text || 'Desculpe, não consegui processar sua pergunta.';
        typingEl.querySelector('.msg-bubble').textContent = reply;
        typingEl.querySelector('.msg-bubble').classList.remove('typing');
        chatHistory.push({ role: 'assistant', content: reply });
      } catch {
        typingEl.querySelector('.msg-bubble').textContent = 'Erro ao conectar. Tente novamente.';
      }
 
      isSending = false;
      document.getElementById('chat-send').disabled = false;
      input.focus();
    }
 
    function sendSuggestion(btn) {
      document.getElementById('chat-input').value = btn.textContent;
      sendMessage();
    }
 
    document.getElementById('chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
 
    // Init
    loadGames();
    loadStandings();
 
    // Auto-refresh jogos a cada 60s
    setInterval(loadGames, 60000);
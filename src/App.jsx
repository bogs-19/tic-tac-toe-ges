import React, { useState, useMemo, useEffect } from 'react';
import './index.css'; 

// --- BACKGROUND & HOLOGRAM KOMPONEN ---
function BackgroundPattern() {
  const elements = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({
    id: i, type: i % 2 === 0 ? 'X' : 'O', left: `${Math.random() * 100}vw`, top: `${Math.random() * 100}vh`,
    size: `${Math.floor(Math.random() * 25 + 20)}px`, opacity: Math.random() * 0.2 + 0.1, 
    animationDuration: `${15 + Math.random() * 15}s`, animationDelay: `-${Math.random() * 10}s`
  })), []);
  return <div className="particle-bg">{elements.map(el => <div key={el.id} className={`particle ${el.type === 'X' ? 'p-red' : 'p-blue'}`} style={{ left: el.left, top: el.top, fontSize: el.size, opacity: el.opacity, animation: `float-aesthetic ${el.animationDuration} infinite linear ${el.animationDelay}` }}>{el.type}</div>)}</div>;
}

function BrainHologram() {
  const points = useMemo(() => {
    const pts = [];
    for(let i=0; i<60; i++) { const rx = 140 + Math.random() * 20; const ry = 100 + Math.random() * 15; const angle = Math.random() * Math.PI * 2; pts.push({ x: 250 + Math.cos(angle) * rx, y: 150 + Math.sin(angle) * ry, connectionCount: Math.floor(Math.random() * 2) + 1 }); }
    for(let i=0; i<25; i++) { pts.push({ x: 150 + Math.random() * 200, y: 80 + Math.random() * 140, connectionCount: 3 }); } return pts;
  }, []);
  const lines = useMemo(() => {
    const lns = [];
    for(let i=0; i<points.length; i++) { for(let j=0; j<points[i].connectionCount; j++) { const target = Math.floor(Math.random() * points.length); if(i !== target) lns.push({ x1: points[i].x, y1: points[i].y, x2: points[target].x, y2: points[target].y }); } } return lns;
  }, [points]);
  return <svg viewBox="0 0 500 300" className="hologram-svg"><defs><radialGradient id="glowGradient"><stop offset="0%" stopColor="#fff" stopOpacity="0.8" /><stop offset="100%" stopColor="#0fa" stopOpacity="0" /></radialGradient></defs>{lines.map((l, i) => <line key={`l-${i}`} className="hologram-line" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} style={{ animationDelay: `${Math.random() * 2}s` }} />)}{points.map((p, i) => <circle key={`p-${i}`} className="hologram-point" cx={p.x} cy={p.y} r="2" style={{ animationDelay: `${Math.random() * 3}s` }} />)}</svg>;
}

// --- KOMPONEN PAPAN ---
function Square({ value, onSquareClick }) {
  return <div className="square" onClick={onSquareClick}>{value && <span className={value === 'X' ? 'xo-symbol-x' : 'xo-symbol-o'}>{value}</span>}</div>;
}

function Board({ xIsNext, squares, onPlay }) {
  const gridSize = 9;
  function handleClick(i) { if (squares[i] || calculateWinner(squares)) return; const nextSquares = squares.slice(); nextSquares[i] = xIsNext ? 'X' : 'O'; onPlay(nextSquares); }
  const winData = calculateWinner(squares); const winner = winData ? winData.winner : null; const winLine = winData ? winData.line : [];
  let status = winner ? <span className={winner === 'X' ? 'neon-x-glow' : 'neon-o-glow'}>WINNER: {winner}</span> : <span style={{ color: '#ccc' }}>NEXT PLAYER: <span className={xIsNext ? 'neon-x-glow' : 'neon-o-glow'}>{xIsNext ? 'X' : 'O'}</span></span>;
  
  const boardUI = [];
  for (let row = 0; row < gridSize; row++) { for (let col = 0; col < gridSize; col++) { const index = row * gridSize + col; boardUI.push(<Square key={index} value={squares[index]} onSquareClick={() => handleClick(index)} />); } }
  
  let lineStyle = {};
  if (winner && winLine.length === 5) {
    const startX = winLine[0] % 9; const startY = Math.floor(winLine[0] / 9); const endX = winLine[4] % 9; const endY = Math.floor(winLine[4] / 9);
    const dx = endX - startX; const dy = endY - startY; const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const isDiagonal = Math.abs(dx) === Math.abs(dy); const lineLength = isDiagonal ? 'calc(var(--step) * 5.6568 + var(--sq))' : 'calc(var(--step) * 4 + var(--sq))';
    lineStyle = { top: `calc(var(--pad) + var(--sq) / 2 + var(--step) * ${startY})`, left: `calc(var(--pad) + var(--sq) / 2 + var(--step) * ${startX})`, transform: `translateY(-50%) rotate(${angle}deg) translateX(calc(var(--sq) / -2))`, '--line-length': lineLength };
  }

  return (
    <div className="board-container">
      <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '10px', letterSpacing: '2px' }}>{status}</div>
      {!winner && <div style={{ color: '#888', letterSpacing: '4px', fontSize: '1rem', marginBottom: '15px' }}>GET 5 IN A ROW TO WIN</div>}
      <div className="board-flat"><div className="board-grid">{boardUI}{winner && <div className={`winning-line ${winner}`} style={lineStyle}></div>}</div></div>
    </div>
  );
}

// --- LOGIKA AI BERDASARKAN LEVEL KESULITAN ---
function getAIMove(squares, difficulty) {
  const emptyMoves = [];
  for (let i = 0; i < 81; i++) if (!squares[i]) emptyMoves.push(i);
  if (emptyMoves.length === 81) return 40; // Jika AI mulai duluan, taruh di tengah
  if (emptyMoves.length === 0) return null;

  // Level EASY: Cuma taruh acak di dekat bidak yang ada
  if (difficulty === 'easy') return getRandomAdjacent(squares, emptyMoves);

  // Semua level Medium/Hard/Insane WAJIB ambil kemenangan atau blokir jika sudah 4 sejajar
  const winMove = findWinningMove(squares, 'O');
  if (winMove !== null) return winMove;
  const blockMove = findWinningMove(squares, 'X');
  if (blockMove !== null) return blockMove;

  // Level MEDIUM: Selain block darurat, dia main acak
  if (difficulty === 'medium') return getRandomAdjacent(squares, emptyMoves);

  // Level HARD & INSANE: Kalkulasi Skoring (Heuristic)
  return getHeuristicMove(squares, difficulty);
}

function getRandomAdjacent(squares, emptyMoves) {
  const adjacentMoves = emptyMoves.filter(i => hasAdjacent(squares, i, 1));
  if (adjacentMoves.length > 0) return adjacentMoves[Math.floor(Math.random() * adjacentMoves.length)];
  return emptyMoves[Math.floor(Math.random() * emptyMoves.length)];
}

function findWinningMove(squares, player) {
  for (let i = 0; i < 81; i++) {
    if (!squares[i]) {
      const sqCopy = squares.slice(); sqCopy[i] = player;
      if (calculateWinner(sqCopy)) return i;
    }
  }
  return null;
}

function hasAdjacent(squares, index, radius) {
  const size = 9; const x = index % size; const y = Math.floor(index / size);
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx; const ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) { if (squares[ny * size + nx] !== null) return true; }
    }
  }
  return false;
}

// Evaluasi kotak dengan poin untuk AI tingkat tinggi
function getHeuristicMove(squares, difficulty) {
  let bestScore = -Infinity;
  let bestMoves = [];

  for (let i = 0; i < 81; i++) {
    if (squares[i]) continue;
    if (!hasAdjacent(squares, i, 2)) continue; // Optimasi performa

    // Skor Offense (O) + Skor Defense (X dikali 1.2 agar AI lebih suka memblokir Player)
    let score = evaluateCell(squares, i, 'O') + (evaluateCell(squares, i, 'X') * 1.2);

    // Hard Level kadang blunder dikit (ada elemen RNG/Noise)
    if (difficulty === 'hard') score += Math.random() * 300; 

    if (score > bestScore) {
      bestScore = score; bestMoves = [i];
    } else if (score === bestScore) {
      bestMoves.push(i);
    }
  }
  if (bestMoves.length === 0) return getRandomAdjacent(squares, []);
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function evaluateCell(squares, index, player) {
  let totalScore = 0;
  const size = 9; const x = index % size; const y = Math.floor(index / size);
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (let [dx, dy] of directions) {
    let consecutive = 1; let openEnds = 0;
    // Cek maju
    let nx = x + dx; let ny = y + dy;
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && squares[ny * size + nx] === player) { consecutive++; nx += dx; ny += dy; }
    if (nx >= 0 && nx < size && ny >= 0 && ny < size && squares[ny * size + nx] === null) openEnds++;
    // Cek mundur
    nx = x - dx; ny = y - dy;
    while (nx >= 0 && nx < size && ny >= 0 && ny < size && squares[ny * size + nx] === player) { consecutive++; nx -= dx; ny -= dy; }
    if (nx >= 0 && nx < size && ny >= 0 && ny < size && squares[ny * size + nx] === null) openEnds++;

    // Kalkulasi Skor Pola (Gomoku Rules)
    if (consecutive >= 5) totalScore += 100000;
    else if (consecutive === 4) totalScore += (openEnds > 0) ? 10000 : 1000;
    else if (consecutive === 3) totalScore += (openEnds === 2) ? 1000 : (openEnds === 1 ? 100 : 0);
    else if (consecutive === 2) totalScore += (openEnds === 2) ? 100 : (openEnds === 1 ? 10 : 0);
    else totalScore += 1;
  }
  return totalScore;
}

// --- APP UTAMA ---
export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState('pve'); // 'pvp' atau 'pve'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard', 'insane'
  
  const [history, setHistory] = useState([Array(81).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];
  const winData = calculateWinner(currentSquares);
  const winner = winData ? winData.winner : null;

  useEffect(() => {
    if (winner) { const timer = setTimeout(() => setShowModal(true), 1200); return () => clearTimeout(timer); }
    else setShowModal(false);
  }, [winner]);

  // Efek AI
  useEffect(() => {
    if (isPlaying && gameMode === 'pve' && !xIsNext && !winner) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(currentSquares, difficulty);
        if (aiMove !== null) {
          const nextSquares = currentSquares.slice(); nextSquares[aiMove] = 'O';
          handlePlay(nextSquares, true); 
        }
      }, 500); // Waktu AI berpikir
      return () => clearTimeout(timer);
    }
  }, [xIsNext, isPlaying, gameMode, difficulty, currentSquares, winner]);

  function jumpTo(nextMove) { setCurrentMove(nextMove); setShowModal(false); }
  function handlePlay(nextSquares, isAutoMove = false) {
    if (gameMode === 'pve' && !xIsNext && !isAutoMove) return; 
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory); setCurrentMove(nextHistory.length - 1);
  }
  function resetGame() { setHistory([Array(81).fill(null)]); setCurrentMove(0); setShowModal(false); }

  if (!isPlaying) {
    return (
      <div className="app-container">
        <BackgroundPattern />
        <div className="dashboard-view">
          <h1 className="title-main neon-o-glow">TIC TAC TOE<br/><span className="title-sub neon-x-glow">GES</span></h1>
          
          <div className="menu-panel">
            <div className="setting-label">SELECT MODE</div>
            <div className="btn-group">
              <button className={`btn-opt ${gameMode === 'pve' ? 'active' : ''}`} onClick={() => setGameMode('pve')}>🤖 VS AI</button>
              <button className={`btn-opt ${gameMode === 'pvp' ? 'active' : ''}`} onClick={() => setGameMode('pvp')}>👥 VS FRIEND</button>
            </div>

            {gameMode === 'pve' && (
              <>
                <div className="setting-label" style={{marginTop: '20px'}}>AI DIFFICULTY</div>
                <div className="btn-group">
                  <button className={`btn-opt ${difficulty === 'easy' ? 'active easy' : ''}`} onClick={() => setDifficulty('easy')}>EASY</button>
                  <button className={`btn-opt ${difficulty === 'medium' ? 'active medium' : ''}`} onClick={() => setDifficulty('medium')}>MEDIUM</button>
                  <button className={`btn-opt ${difficulty === 'hard' ? 'active hard' : ''}`} onClick={() => setDifficulty('hard')}>HARD</button>
                  <button className={`btn-opt ${difficulty === 'insane' ? 'active insane' : ''}`} onClick={() => setDifficulty('insane')}>INSANE</button>
                </div>
              </>
            )}
          </div>

          <button className="btn-neon btn-play" onClick={() => setIsPlaying(true)}>START GAME</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ justifyContent: 'flex-start' }}>
      <BackgroundPattern />
      <button className="btn-neon btn-back" onClick={() => { setIsPlaying(false); resetGame(); }}>← MENU</button>

      <div className="game-view">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />

        <div className="timeline-box">
          <button className="btn-neon btn-timeline" onClick={() => setIsTimelineOpen(!isTimelineOpen)}>
            <span>TIMELINE</span><span>{isTimelineOpen ? '▲' : '▼'}</span>
          </button>
          <div style={{ maxHeight: isTimelineOpen ? '400px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
            <ul className="timeline-list">
              {history.map((_, move) => (
                <li key={move}><button className="btn-history" onClick={() => jumpTo(move)}>{move > 0 ? `Go to move #${move}` : '🚀 Game Start (Reset)'}</button></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '3.5rem', margin: 0, textTransform: 'uppercase' }} className={winner === 'X' ? 'neon-x-glow' : 'neon-o-glow'}>
              {gameMode === 'pve' && winner === 'O' ? 'YOU LOSE!' : 'YOU WIN!'}
            </h2>
            <p style={{ fontSize: '1.5rem', margin: '15px 0' }}>
              {gameMode === 'pve' && winner === 'O' ? 'THE AI IS TOO SMART' : `PLAYER `} 
              {gameMode === 'pve' && winner === 'O' ? '' : <span className={winner === 'X' ? 'neon-x-glow' : 'neon-o-glow'} style={{ fontWeight: 'bold' }}>{winner}</span>}
              {gameMode === 'pve' && winner === 'O' ? '' : ' HAS WON'}
            </p>
            <BrainHologram />
            <div className="modal-actions">
               <button className="btn-neon" onClick={resetGame}>PLAY AGAIN</button>
               <button className="btn-neon" style={{ borderColor: '#666', color: '#ccc', boxShadow: 'none' }} onClick={() => { setIsPlaying(false); resetGame(); }}>EXIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// LOGIKA KEMENANGAN 5 SEJAJAR
function calculateWinner(squares) {
  const size = 9; const winLength = 5;
  function checkLine(x, y, dx, dy) {
    const first = squares[y * size + x];
    if (!first) return null;
    const lineIndices = [y * size + x]; 
    for (let i = 1; i < winLength; i++) {
      const nx = x + dx * i; const ny = y + dy * i;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) return null;
      if (squares[ny * size + nx] !== first) return null;
      lineIndices.push(ny * size + nx);
    }
    return { winner: first, line: lineIndices };
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (squares[y * size + x]) {
        const winResult = checkLine(x, y, 1, 0) || checkLine(x, y, 0, 1) || checkLine(x, y, 1, 1) || checkLine(x, y, -1, 1);  
        if (winResult) return winResult;
      }
    }
  }
  return null;
}
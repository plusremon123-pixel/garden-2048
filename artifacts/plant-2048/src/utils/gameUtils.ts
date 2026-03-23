export type TileData = {
  id: string;
  value: number;
  x: number; // col
  y: number; // row
  isNew?: boolean;
  isMerged?: boolean;
};

export type GameState = {
  board: (TileData | null)[][];
  activeTiles: Record<string, TileData>;
  graveyard: TileData[]; // Tiles kept temporarily for merge animation
  score: number;
  hasWon: boolean;
  hasLost: boolean;
};

let nextId = 0;
export const generateId = () => `tile-${Date.now()}-${nextId++}`;

export const createEmptyBoard = (): (TileData | null)[][] => 
  Array(4).fill(null).map(() => Array(4).fill(null));

export const getEmptyCells = (board: (TileData | null)[][]) => {
  const cells: {x: number, y: number}[] = [];
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === null) cells.push({x, y});
    });
  });
  return cells;
};

export const spawnRandomTile = (board: (TileData | null)[][]): TileData | null => {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return null;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  
  return {
    id: generateId(),
    value,
    x: randomCell.x,
    y: randomCell.y,
    isNew: true
  };
};

export const initializeGame = (): GameState => {
  const board = createEmptyBoard();
  const activeTiles: Record<string, TileData> = {};
  
  const tile1 = spawnRandomTile(board);
  if (tile1) {
    board[tile1.y][tile1.x] = tile1;
    activeTiles[tile1.id] = tile1;
  }
  
  const tile2 = spawnRandomTile(board);
  if (tile2) {
    board[tile2.y][tile2.x] = tile2;
    activeTiles[tile2.id] = tile2;
  }

  return {
    board,
    activeTiles,
    graveyard: [],
    score: 0,
    hasWon: false,
    hasLost: false
  };
};

type Vector = { x: number; y: number };

export const checkWin = (board: (TileData | null)[][]) => {
  return board.some(row => row.some(cell => cell?.value === 2048));
};

export const checkLose = (board: (TileData | null)[][]) => {
  if (getEmptyCells(board).length > 0) return false;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const current = board[y][x]?.value;
      if (
        (x < 3 && board[y][x + 1]?.value === current) ||
        (y < 3 && board[y + 1][x]?.value === current)
      ) {
        return false; // Found a possible merge
      }
    }
  }
  return true; // No empty cells, no possible merges
};

// Returns ordered pairs of coordinates to traverse based on direction
const getTraversals = (vector: Vector) => {
  const traversals = { x: [] as number[], y: [] as number[] };
  for (let pos = 0; pos < 4; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }
  // Reverse traversal to iterate from the edge we're moving towards
  if (vector.x === 1) traversals.x.reverse();
  if (vector.y === 1) traversals.y.reverse();
  return traversals;
};

export const moveBoard = (
  currentState: GameState,
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
): { newState: GameState; moved: boolean } => {
  const vectorMap: Record<string, Vector> = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  };
  
  const vector = vectorMap[direction];
  const traversals = getTraversals(vector);
  
  const newBoard = createEmptyBoard();
  const newActiveTiles: Record<string, TileData> = {};
  const graveyard: TileData[] = [...currentState.graveyard];
  let scoreGained = 0;
  let moved = false;
  
  // Track which cells have already merged this turn
  const mergedFlags = createEmptyBoard().map(r => r.map(() => false));

  // Deep copy existing tiles and clear animation flags
  Object.values(currentState.activeTiles).forEach(t => {
    newActiveTiles[t.id] = { ...t, isNew: false, isMerged: false };
  });

  // Re-build board reference from active tiles
  Object.values(newActiveTiles).forEach(t => {
    newBoard[t.y][t.x] = t;
  });

  // Process slide & merge
  traversals.y.forEach(y => {
    traversals.x.forEach(x => {
      const tile = newBoard[y][x];
      if (!tile) return;

      let current = { x, y };
      let next = { x: x + vector.x, y: y + vector.y };
      
      // Slide as far as possible
      while (
        next.x >= 0 && next.x < 4 && 
        next.y >= 0 && next.y < 4 && 
        newBoard[next.y][next.x] === null
      ) {
        current = { ...next };
        next = { x: next.x + vector.x, y: next.y + vector.y };
      }

      // Check for merge
      if (
        next.x >= 0 && next.x < 4 && 
        next.y >= 0 && next.y < 4 && 
        newBoard[next.y][next.x]?.value === tile.value &&
        !mergedFlags[next.y][next.x]
      ) {
        // MERGE
        const targetTile = newBoard[next.y][next.x]!;
        const newValue = tile.value * 2;
        scoreGained += newValue;
        mergedFlags[next.y][next.x] = true;

        // Mark old tiles to move to target visually, then die
        const dyingTile1 = { ...tile, x: next.x, y: next.y };
        const dyingTile2 = { ...targetTile, x: next.x, y: next.y };
        
        // Remove old tiles from active
        delete newActiveTiles[tile.id];
        delete newActiveTiles[targetTile.id];
        
        // Add to graveyard for animation
        graveyard.push(dyingTile1, dyingTile2);
        
        // Create new merged tile
        const mergedTile: TileData = {
          id: generateId(),
          value: newValue,
          x: next.x,
          y: next.y,
          isMerged: true
        };
        
        newActiveTiles[mergedTile.id] = mergedTile;
        newBoard[next.y][next.x] = mergedTile;
        newBoard[y][x] = null;
        moved = true;
      } else if (current.x !== x || current.y !== y) {
        // SLIDE (no merge)
        newBoard[current.y][current.x] = tile;
        newBoard[y][x] = null;
        newActiveTiles[tile.id].x = current.x;
        newActiveTiles[tile.id].y = current.y;
        moved = true;
      }
    });
  });

  if (moved) {
    const newTile = spawnRandomTile(newBoard);
    if (newTile) {
      newBoard[newTile.y][newTile.x] = newTile;
      newActiveTiles[newTile.id] = newTile;
    }
  }

  const hasWon = currentState.hasWon || checkWin(newBoard);
  const hasLost = !hasWon && checkLose(newBoard);

  return {
    moved,
    newState: {
      board: newBoard,
      activeTiles: newActiveTiles,
      graveyard,
      score: currentState.score + scoreGained,
      hasWon,
      hasLost
    }
  };
};

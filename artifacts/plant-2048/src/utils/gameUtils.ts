/* ── 타일 타입 ────────────────────────────────────────────── */
export type TileType = "number" | "soil" | "thorn";

export type TileData = {
  id: string;
  value: number;
  x: number; // col
  y: number; // row
  isNew?: boolean;
  isMerged?: boolean;
  tileType?: TileType; // undefined | "number" = 일반 숫자 타일
};

export type GameState = {
  board: (TileData | null)[][];
  activeTiles: Record<string, TileData>;
  graveyard: TileData[]; // Tiles kept temporarily for merge animation
  score: number;
  hasWon: boolean;
  hasLost: boolean;
  turnsLeft?: number;  // -1 or undefined = 제한 없음
  maxTurns?:  number;
  goalValue?: number;  // undefined = 2048
  boardSize?: number;  // undefined = 4 (default)
};

/* 장애물 여부 */
export const isObstacle = (tile: TileData | null): boolean =>
  tile?.tileType === "soil" || tile?.tileType === "thorn";

let nextId = 0;
export const generateId = () => `tile-${Date.now()}-${nextId++}`;

export const createEmptyBoard = (size = 4): (TileData | null)[][] =>
  Array(size).fill(null).map(() => Array(size).fill(null));

export const getEmptyCells = (board: (TileData | null)[][]) => {
  const cells: { x: number; y: number }[] = [];
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === null) cells.push({ x, y });
    });
  });
  return cells;
};

export const spawnRandomTile = (
  board: (TileData | null)[][],
  spawnRate: number = 0.9,
): TileData | null => {
  const emptyCells = getEmptyCells(board);
  if (emptyCells.length === 0) return null;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < spawnRate ? 2 : 4;

  return {
    id: generateId(),
    value,
    x: randomCell.x,
    y: randomCell.y,
    isNew: true,
  };
};

export const initializeGame = (size = 4): GameState => {
  const board = createEmptyBoard(size);
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
    hasLost: false,
    boardSize: size,
  };
};

type Vector = { x: number; y: number };

/* goalValue 기준 타일 달성 여부 (장애물 제외) */
export const checkWin = (
  board: (TileData | null)[][],
  goalValue: number = 2048,
) => {
  return board.some((row) =>
    row.some((cell) => cell && !isObstacle(cell) && cell.value === goalValue),
  );
};

/* 이동 불가 판정 (장애물은 합산 대상에서 제외) */
export const checkLose = (board: (TileData | null)[][]): boolean => {
  if (getEmptyCells(board).length > 0) return false;

  const rows = board.length;
  const cols = board[0]?.length ?? rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const current = board[y][x];
      if (!current || isObstacle(current)) continue;
      if (
        (x < cols - 1 &&
          !isObstacle(board[y][x + 1]) &&
          board[y][x + 1]?.value === current.value) ||
        (y < rows - 1 &&
          !isObstacle(board[y + 1][x]) &&
          board[y + 1][x]?.value === current.value)
      ) {
        return false; // Found a possible merge
      }
    }
  }
  return true; // No empty cells, no possible merges
};

// Returns ordered pairs of coordinates to traverse based on direction
const getTraversals = (vector: Vector, size = 4) => {
  const traversals = { x: [] as number[], y: [] as number[] };
  for (let pos = 0; pos < size; pos++) {
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
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
  spawnRate?: number,
): { newState: GameState; moved: boolean } => {
  const vectorMap: Record<string, Vector> = {
    UP:    { x: 0,  y: -1 },
    DOWN:  { x: 0,  y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x: 1,  y:  0 },
  };

  const size       = currentState.boardSize ?? 4;
  const vector     = vectorMap[direction];
  const traversals = getTraversals(vector, size);

  const newBoard       = createEmptyBoard(size);
  const newActiveTiles: Record<string, TileData> = {};
  const graveyard: TileData[] = [...currentState.graveyard];
  let scoreGained = 0;
  let moved       = false;

  // Track which cells have already merged this turn
  const mergedFlags = createEmptyBoard(size).map((r) => r.map(() => false));

  // Deep copy existing tiles and clear animation flags
  Object.values(currentState.activeTiles).forEach((t) => {
    newActiveTiles[t.id] = { ...t, isNew: false, isMerged: false };
  });

  // Re-build board reference from active tiles
  Object.values(newActiveTiles).forEach((t) => {
    newBoard[t.y][t.x] = t;
  });

  // Process slide & merge
  traversals.y.forEach((y) => {
    traversals.x.forEach((x) => {
      const tile = newBoard[y][x];
      if (!tile) return;

      // 장애물은 이동하지 않음
      if (isObstacle(tile)) return;

      let current = { x, y };
      let next    = { x: x + vector.x, y: y + vector.y };

      // Slide as far as possible (obstacles and other tiles block)
      while (
        next.x >= 0 &&
        next.x < size &&
        next.y >= 0 &&
        next.y < size &&
        newBoard[next.y][next.x] === null
      ) {
        current = { ...next };
        next    = { x: next.x + vector.x, y: next.y + vector.y };
      }

      // Check for merge (장애물과는 합산 불가)
      if (
        next.x >= 0 &&
        next.x < size &&
        next.y >= 0 &&
        next.y < size &&
        !isObstacle(newBoard[next.y][next.x]) &&
        newBoard[next.y][next.x]?.value === tile.value &&
        !mergedFlags[next.y][next.x]
      ) {
        // MERGE
        const targetTile = newBoard[next.y][next.x]!;
        const newValue   = tile.value * 2;
        scoreGained += newValue;
        mergedFlags[next.y][next.x] = true;

        // Mark old tiles to move to target visually, then die
        const dyingTile1 = { ...tile,       x: next.x, y: next.y };
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
          isMerged: true,
        };

        newActiveTiles[mergedTile.id] = mergedTile;
        newBoard[next.y][next.x]      = mergedTile;
        newBoard[y][x]                = null;
        moved = true;
      } else if (current.x !== x || current.y !== y) {
        // SLIDE (no merge)
        newBoard[current.y][current.x]  = tile;
        newBoard[y][x]                  = null;
        newActiveTiles[tile.id].x       = current.x;
        newActiveTiles[tile.id].y       = current.y;
        moved = true;
      }
    });
  });

  if (moved) {
    const newTile = spawnRandomTile(newBoard, spawnRate);
    if (newTile) {
      newBoard[newTile.y][newTile.x]  = newTile;
      newActiveTiles[newTile.id]      = newTile;
    }
  }

  /* ── 턴 처리 ────────────────────────────────────────────── */
  const prevTurnsLeft = currentState.turnsLeft;
  const newTurnsLeft  =
    prevTurnsLeft !== undefined && prevTurnsLeft >= 0 && moved
      ? prevTurnsLeft - 1
      : prevTurnsLeft;

  const goalValue = currentState.goalValue ?? 2048;
  const hasWon    = currentState.hasWon || checkWin(newBoard, goalValue);
  const hasLost   =
    !hasWon &&
    (checkLose(newBoard) ||
      (newTurnsLeft !== undefined && newTurnsLeft >= 0 && newTurnsLeft === 0));

  return {
    moved,
    newState: {
      board:        newBoard,
      activeTiles:  newActiveTiles,
      graveyard,
      score:        currentState.score + scoreGained,
      hasWon,
      hasLost,
      turnsLeft:    newTurnsLeft,
      maxTurns:     currentState.maxTurns,
      goalValue:    currentState.goalValue,
      boardSize:    currentState.boardSize,
    },
  };
};

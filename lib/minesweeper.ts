export type Difficulty = "easy" | "normal" | "hard"

export type Cell = {
  row: number
  col: number
  hasMine: boolean
  isOpen: boolean
  isFlagged: boolean
  adjacentMines: number
}

export type GameStatus = "ready" | "playing" | "won" | "lost"

export type DifficultyConfig = {
  rows: number
  cols: number
  mines: number
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  normal: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
}

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      hasMine: false,
      isOpen: false,
      isFlagged: false,
      adjacentMines: 0,
    })),
  )
}

const NEIGHBOR_OFFSETS = [-1, 0, 1]

export function inBounds(board: Cell[][], row: number, col: number): boolean {
  return row >= 0 && row < board.length && col >= 0 && col < board[0].length
}

export function getNeighbors(
  board: Cell[][],
  row: number,
  col: number,
): Cell[] {
  const neighbors: Cell[] = []

  for (const dRow of NEIGHBOR_OFFSETS) {
    for (const dCol of NEIGHBOR_OFFSETS) {
      if (dRow === 0 && dCol === 0) {
        continue
      }
      const nextRow = row + dRow
      const nextCol = col + dCol
      if (inBounds(board, nextRow, nextCol)) {
        neighbors.push(board[nextRow][nextCol])
      }
    }
  }

  return neighbors
}

export function placeMines(
  board: Cell[][],
  mineCount: number,
  safeRow: number,
  safeCol: number,
): Cell[][] {
  const rows = board.length
  const cols = board[0].length
  const maxMines = rows * cols - 1
  const actualMines = Math.min(mineCount, maxMines)
  const nextBoard = board.map((line) => line.map((cell) => ({ ...cell })))

  const candidates: Array<{ row: number; col: number }> = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (row === safeRow && col === safeCol) {
        continue
      }
      candidates.push({ row, col })
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  for (let i = 0; i < actualMines; i += 1) {
    const { row, col } = candidates[i]
    nextBoard[row][col].hasMine = true
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = nextBoard[row][col]
      cell.adjacentMines = getNeighbors(nextBoard, row, col).filter(
        (neighbor) => neighbor.hasMine,
      ).length
    }
  }

  return nextBoard
}

export function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((line) =>
    line.map((cell) =>
      cell.hasMine
        ? {
            ...cell,
            isOpen: true,
          }
        : cell,
    ),
  )
}

export function openCell(board: Cell[][], row: number, col: number): Cell[][] {
  const nextBoard = board.map((line) => line.map((cell) => ({ ...cell })))
  const startCell = nextBoard[row][col]

  if (startCell.isOpen || startCell.isFlagged) {
    return nextBoard
  }

  const queue: Array<{ row: number; col: number }> = [{ row, col }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    const cell = nextBoard[current.row][current.col]
    if (cell.isOpen || cell.isFlagged) {
      continue
    }

    cell.isOpen = true

    if (cell.hasMine || cell.adjacentMines > 0) {
      continue
    }

    const neighbors = getNeighbors(nextBoard, cell.row, cell.col)
    for (const neighbor of neighbors) {
      if (!neighbor.isOpen && !neighbor.hasMine && !neighbor.isFlagged) {
        queue.push({ row: neighbor.row, col: neighbor.col })
      }
    }
  }

  return nextBoard
}

export function toggleFlag(
  board: Cell[][],
  row: number,
  col: number,
): Cell[][] {
  return board.map((line, lineRow) =>
    line.map((cell, lineCol) => {
      if (lineRow !== row || lineCol !== col || cell.isOpen) {
        return cell
      }

      return {
        ...cell,
        isFlagged: !cell.isFlagged,
      }
    }),
  )
}

export function isWin(board: Cell[][]): boolean {
  for (const line of board) {
    for (const cell of line) {
      if (!cell.hasMine && !cell.isOpen) {
        return false
      }
    }
  }

  return true
}

export function countFlags(board: Cell[][]): number {
  return board.flat().filter((cell) => cell.isFlagged).length
}

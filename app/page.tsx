"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  type Cell,
  countFlags,
  createEmptyBoard,
  DIFFICULTY_CONFIG,
  type Difficulty,
  type GameStatus,
  isWin,
  openCell,
  placeMines,
  revealAllMines,
  toggleFlag,
} from "../lib/minesweeper"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function getStatusText(status: GameStatus): string {
  if (status === "won") {
    return "クリア！"
  }
  if (status === "lost") {
    return "ゲームオーバー"
  }
  return "プレイ中"
}

function getCellLabel(cell: Cell, status: GameStatus): string {
  if (!cell.isOpen) {
    if (cell.isFlagged) {
      return "🚩"
    }
    if (status === "lost" && cell.hasMine) {
      return "💣"
    }
    return ""
  }

  if (cell.hasMine) {
    return "💣"
  }
  if (cell.adjacentMines === 0) {
    return ""
  }
  return String(cell.adjacentMines)
}

export default function Page() {
  const LONG_PRESS_MS = 450
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const config = DIFFICULTY_CONFIG[difficulty]
  const cellSize = "clamp(22px, 7vw, 32px)"

  const [board, setBoard] = useState<Cell[][]>(() =>
    createEmptyBoard(config.rows, config.cols),
  )
  const [status, setStatus] = useState<GameStatus>("ready")
  const [minesPlaced, setMinesPlaced] = useState(false)
  const [isResetButtonAnimating, setIsResetButtonAnimating] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const resetFeedbackTimerRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const flags = useMemo(() => countFlags(board), [board])
  const remainingMines = config.mines - flags

  const resetGame = (nextDifficulty: Difficulty = difficulty) => {
    const nextConfig = DIFFICULTY_CONFIG[nextDifficulty]
    setBoard(createEmptyBoard(nextConfig.rows, nextConfig.cols))
    setStatus("ready")
    setMinesPlaced(false)
  }

  const handleDifficultyChange = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty)
    resetGame(nextDifficulty)
  }

  const triggerResetButtonReaction = () => {
    if (resetFeedbackTimerRef.current !== null) {
      window.clearTimeout(resetFeedbackTimerRef.current)
    }

    setIsResetButtonAnimating(true)
    resetFeedbackTimerRef.current = window.setTimeout(() => {
      setIsResetButtonAnimating(false)
      resetFeedbackTimerRef.current = null
    }, 180)
  }

  const handleResetClick = () => {
    resetGame()
    triggerResetButtonReaction()
  }

  const handleOpen = (row: number, col: number) => {
    if (status === "lost" || status === "won") {
      return
    }

    let workingBoard = board
    let nextStatus: GameStatus = status === "ready" ? "playing" : status
    let nextMinesPlaced = minesPlaced

    if (!nextMinesPlaced) {
      workingBoard = placeMines(workingBoard, config.mines, row, col)
      nextMinesPlaced = true
    }

    const targetCell = workingBoard[row][col]
    if (targetCell.isFlagged || targetCell.isOpen) {
      return
    }

    if (targetCell.hasMine) {
      setBoard(revealAllMines(workingBoard))
      setStatus("lost")
      setMinesPlaced(nextMinesPlaced)
      return
    }

    const openedBoard = openCell(workingBoard, row, col)
    if (isWin(openedBoard)) {
      nextStatus = "won"
    }

    setBoard(openedBoard)
    setStatus(nextStatus)
    setMinesPlaced(nextMinesPlaced)
  }

  const handleFlag = (row: number, col: number) => {
    if (status === "lost" || status === "won") {
      return
    }

    const cell = board[row][col]
    if (cell.isOpen) {
      return
    }

    setBoard(toggleFlag(board, row, col))
    if (status === "ready") {
      setStatus("playing")
    }
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleCellPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    row: number,
    col: number,
  ) => {
    if (status === "lost" || status === "won") {
      return
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    if (event.pointerType !== "mouse") {
      event.preventDefault()
    }

    clearLongPressTimer()
    longPressTriggeredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      handleFlag(row, col)
      longPressTriggeredRef.current = true
      longPressTimerRef.current = null
    }, LONG_PRESS_MS)
  }

  const handleCellPointerUp = (
    event: React.PointerEvent<HTMLButtonElement>,
    row: number,
    col: number,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      clearLongPressTimer()
      return
    }

    if (event.pointerType !== "mouse") {
      event.preventDefault()
    }

    const wasLongPress = longPressTriggeredRef.current
    clearLongPressTimer()

    if (wasLongPress) {
      longPressTriggeredRef.current = false
      return
    }

    handleOpen(row, col)
  }

  const handleCellPointerLeave = () => {
    clearLongPressTimer()
  }

  useEffect(() => {
    if (status === "playing") {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
      }
      timerIntervalRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)
    } else {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (status === "won" || status === "lost") {
        if (startTimeRef.current !== null) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }
      if (status === "ready") {
        startTimeRef.current = null
        setElapsedTime(0)
      }
    }
    return () => {
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [status])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (resetFeedbackTimerRef.current !== null) {
        window.clearTimeout(resetFeedbackTimerRef.current)
      }
      if (timerIntervalRef.current !== null) {
        window.clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [])

  return (
    <main className="flex min-h-screen bg-slate-100 px-3 py-4 text-slate-900 sm:px-4 md:px-6 lg:items-center lg:justify-center">
      <div className="w-full lg:max-w-2/3">
        <h1 className="mb-4 text-2xl font-semibold sm:text-3xl">Minesweeper</h1>

        <section className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[auto_1fr_1fr_1fr_auto] lg:items-center">
          <label className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 sm:justify-start sm:bg-transparent sm:px-0 sm:py-0">
            難易度:
            <select
              value={difficulty}
              onChange={(event) =>
                handleDifficultyChange(event.target.value as Difficulty)
              }
              className="w-44 rounded border border-slate-300 bg-white px-2 py-1 sm:ml-2 sm:w-auto"
            >
              <option value="easy">Easy (9x9 / 10)</option>
              <option value="normal">Normal (16x16 / 40)</option>
              <option value="hard">Hard (16x30 / 99)</option>
            </select>
          </label>

          <span className="rounded-md bg-white px-3 py-2 text-sm sm:text-base">
            状態: {getStatusText(status)}
          </span>
          <span className="rounded-md bg-white px-3 py-2 text-sm sm:text-base">
            残り地雷(目安): {remainingMines}
          </span>
          <span
            className={`rounded-md px-3 py-2 text-sm tabular-nums sm:text-base ${
              status === "won"
                ? "bg-emerald-100 font-bold text-emerald-800"
                : "bg-white"
            }`}
          >
            タイム: {formatTime(elapsedTime)}
          </span>

          <button
            type="button"
            onClick={handleResetClick}
            className={`w-full cursor-pointer rounded border px-3 py-2 transition-all duration-150 sm:w-auto lg:justify-self-end ${
              isResetButtonAnimating
                ? "scale-95 border-emerald-400 bg-emerald-100"
                : "border-slate-300 bg-white"
            }`}
          >
            リセット
          </button>
        </section>

        <section className="w-full overflow-x-auto rounded-lg">
          <div
            className="mx-auto grid w-max gap-0.5 rounded-lg bg-slate-300 p-0.5"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, ${cellSize})`,
            }}
          >
            {board.flat().map((cell) => {
              const isInactive = status === "lost" || status === "won"
              const isOpened = cell.isOpen
              const label = getCellLabel(cell, status)

              return (
                <button
                  key={`${cell.row}-${cell.col}`}
                  type="button"
                  onPointerDown={(event) =>
                    handleCellPointerDown(event, cell.row, cell.col)
                  }
                  onPointerUp={(event) =>
                    handleCellPointerUp(event, cell.row, cell.col)
                  }
                  onPointerLeave={handleCellPointerLeave}
                  onPointerCancel={handleCellPointerLeave}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    handleFlag(cell.row, cell.col)
                  }}
                  disabled={isInactive}
                  className={`select-none rounded border-none text-xs font-bold touch-manipulation sm:text-sm ${
                    isInactive ? "cursor-not-allowed" : "cursor-pointer"
                  } ${isOpened ? "bg-slate-200 text-blue-800" : "bg-white text-slate-900"}`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                  }}
                  aria-label={`cell-${cell.row}-${cell.col}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <p className="mt-3 text-xs text-slate-600 sm:text-sm">
          タップで開く / 長押しまたは右クリックで旗を立てる
        </p>
      </div>
    </main>
  )
}

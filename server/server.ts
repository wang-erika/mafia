import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card, GameState } from "./model"
import { setupMongo } from "./mongo"
import { setupRedis } from "./redis"

async function main() {
const server = http.createServer()
const { /*socketIoAdapter: adapter,*/ getGameState, tryToUpdateGameState } = await setupMongo()
const { socketIoAdapter: adapter } = await setupRedis()
const io = new Server(server, { adapter })
const port = parseInt(process.env.SERVER_PORT || "8101")

function emitUpdatedCardsForPlayers(gameState: GameState, cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

io.on('connection', client => {
  function emitGameState(gameState: GameState) {
    client.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', async n => {
    const gameState = await getGameState()
    playerIndex = n
    console.log("playerIndex set", n)
    client.join(String(n))
    if (typeof playerIndex === "number") {
      client.emit(
        "all-cards", 
        filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
      )
    } else {
      client.emit(
        "all-cards", 
        Object.values(gameState.cardsById),    
      )
    }
    emitGameState(gameState)
  })

  client.on("action", async (action: Action) => {
    const gameState = await getGameState()
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      if (await tryToUpdateGameState(gameState)) {
        emitUpdatedCardsForPlayers(gameState, updatedCards)
      } else {
        // TODO: do error handling
      }
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })

  client.on("new-game", async () => {
    const gameState = await getGameState()
    Object.assign(gameState, createEmptyGame(gameState.playerNames, 2, 2))
    if (await tryToUpdateGameState(gameState)) {
      const updatedCards = Object.values(gameState.cardsById)
      emitUpdatedCardsForPlayers(gameState, updatedCards, true)
      io.to("all").emit(
        "all-cards", 
        updatedCards,
      )
      io.emit(
        "game-state", 
        gameState.currentTurnPlayerIndex,
        gameState.phase,
        gameState.playCount,
      )
    } else {
      // TODO: do error handling
    }
  })
})
server.listen(port)
console.log(`Game server listening on port ${port}`)
}

main()
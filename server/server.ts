import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card, computePlayerCardCounts} from "./model"

const server = http.createServer()
const io = new Server(server)
const port = 8101


// add currentConfig
let currentConfig = { numberOfDecks: 3, rankLimit: 4 };

// Initialize game state with the currentConfig
let gameState = createEmptyGame(["player1", "player2"], currentConfig.numberOfDecks, currentConfig.rankLimit);


function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
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
  function emitGameState() {
    client.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
      gameState.playerWithOneCard, // emit new array of players with one card
    )
  }
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', n => {
    playerIndex = n // recall closures, everytime a new client comes in, we create a new scope with a new playerIndex. We are not rewriting this everytime a player enters. It is saved inside the closure
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
    emitGameState()
  })

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
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
      gameState.playerWithOneCard, // emit new array of players with one card
    )
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, currentConfig.numberOfDecks, currentConfig.rankLimit);
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)
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
  })

  client.on('get-config', () => {
    client.emit('get-config-reply', currentConfig);
  })

  client.on('update-config', (Config) => { // takes single Config parameter
    // there are 2 variables of type number
    if (typeof Config.numberOfDecks === 'number' && typeof Config.rankLimit === 'number' && Object.keys(Config).length === 2) {
      setTimeout(() => {
        // Update the configuration and restart the game
        currentConfig = Config;
        gameState = createEmptyGame(gameState.playerNames, Config.numberOfDecks, Config.rankLimit);
        emitUpdatedCardsForPlayers(Object.values(gameState.cardsById), true);
        client.emit('update-config-reply', true);
        io.emit('game-state', gameState.currentTurnPlayerIndex, gameState.phase, gameState.playCount, gameState.playerWithOneCard);
      }, 2000); // Wait for 2 seconds before applying the update
    } else {
      client.emit('update-config-reply', false); // Config is invalid
    }
  })

})

server.listen(port)
console.log(`Game server listening on port ${port}`)

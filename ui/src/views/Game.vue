<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <b-badge class="mr-2 mb-2">Players with 1 card: {{ playerwithOneCard.join(",") }}</b-badge>

    <b-button @click="showConfigModal = true">Configure Game</b-button>

    <!-- Configuration Modal -->
    <b-modal v-model="showConfigModal" @shown="fetchConfig" title="Game Configuration" hide-footer>
      <b-overlay :show="isLoading">
        <b-form @submit.prevent="submitConfig">
          <b-form-group label="Number of Decks">
            <b-form-input v-model.number="config.numberOfDecks" type="number" min="1" number></b-form-input>
          </b-form-group>
          <b-form-group label="Rank Limit">
            <b-form-input v-model.number="config.rankLimit" type="number" min="1" number></b-form-input>
          </b-form-group>
          <b-button type="submit" variant="primary">OK</b-button>
        </b-form>
      </b-overlay>
    </b-modal>
    
    <!-- Container for cards -->
    <div class="cards-container">
      <AnimatedCard
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :lastPlayedCard="lastPlayedCard"
        @playCard="playCard"/>
    </div>

    <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Card, GamePhase, Action, CardId} from "../../../server/model"
import AnimatedCard from '../components/AnimatedCard.vue'

// props
interface Props {
  playerIndex?: string
}

// default values for props
const props = withDefaults(defineProps<Props>(), {
  playerIndex: "all",
})

const socket = io() // how we get a connection to server
let x = props.playerIndex
let playerIndex: number | "all" = parseInt(x) >= 0 ? parseInt(x) : "all"
console.log("playerIndex", JSON.stringify(playerIndex))
socket.emit("player-index", playerIndex) // send event back to server, tells server this socket is for player number _____, each connection to the server gets a socket connection

const cards: Ref<Card[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
const playCount = ref(-1)
const playerwithOneCard = ref<string[]>([]);

const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex && phase.value !== "game-over")

const lastPlayedCard = computed(() => {
  return cards.value.find(card => card.locationType === 'last-card-played') || null;
})

// Config
const showConfigModal = ref(false);
const isLoading = ref(false);
const config = ref({
  numberOfDecks: 0,
  rankLimit: 0
});

// -------------------------------------------------------------------------------------

socket.on("all-cards", (allCards: Card[]) => {
  cards.value = allCards
})

socket.on("updated-cards", (updatedCards: Card[]) => {
  applyUpdatedCards(updatedCards)
})

socket.on("game-state", (newCurrentTurnPlayerIndex: number, newPhase: GamePhase, newPlayCount: number, newPlayerwithOneCard: string[]) => {
  currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playCount.value = newPlayCount
  playerwithOneCard.value = newPlayerwithOneCard
})

// Fetch current config when modal is shown
function fetchConfig() {
  isLoading.value = true;
  socket.emit('get-config');
}

// Listen for config reply to update form and remove overlay
socket.on('get-config-reply', (receivedConfig) => {
  config.value = receivedConfig;
  isLoading.value = false;
});

// Submit new config to the server
function submitConfig() {
  isLoading.value = true;
  socket.emit('update-config', config.value);
}

// Handle update response
socket.on('update-config-reply', (success) => {
  if (success) {
    showConfigModal.value = false; // Close the modal on successful update
    fetchConfig(); // Suggestion: Re-fetch configuration or handle game restart
  }
  isLoading.value = false; // Remove overlay in any case
});


function doAction(action: Action) {
  return new Promise<Card[]>((resolve, reject) => {
    socket.emit("action", action)
    socket.once("updated-cards", (updatedCards: Card[]) => {
      resolve(updatedCards)
    })
  })
}

async function drawCard() {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "draw-card", playerIndex })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function playCard(cardId: CardId) {
  if (typeof playerIndex === "number") {
    const updatedCards = await doAction({ action: "play-card", playerIndex, cardId })
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function applyUpdatedCards(updatedCards: Card[]) {
  for (const x of updatedCards) {
    const existingCard = cards.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      cards.value.push(x)
    }
  }
}
</script>

<style scoped>
.cards-container {
  display: flex; /* Enables Flexbox layout */
  flex-wrap: wrap; /* Allows items to wrap to the next line if there's not enough space */
  justify-content: center; /* Centers the items horizontally */
  gap: 10px; /* Adds some space between the cards */
}
</style>

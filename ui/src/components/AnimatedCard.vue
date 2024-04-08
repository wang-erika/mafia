<template>
    <div class="card-container" @click="handleClick">
      <div :class="['card', cardClass]">
        <div class="card-rank">{{ card.rank }}</div>
        <div class="card-suit" v-html="card.suit"></div>
      </div>
      <div class="card-status">
        <!-- Displaying card status -->
        <span v-if="card.locationType === 'last-card-played'">Last Played</span>
        <span v-else-if="isIllegal">Cannot Play</span>
        <span v-else-if="card.locationType === 'unused'">Unused</span>
        <!--<span v-else>Can Play</span>-->
      </div>
    </div>
</template>
  
<script>
  import { areCompatible } from "../../../server/model";
  import { defineEmits } from 'vue';
  
  export default {
    // props
    props: {
        card: Object,
        lastPlayedCard: Object,
    },
    computed: {
        isIllegal() {
        // The card is considered illegal if it's not compatible with the last played card
        // and only if the lastPlayedCard exists and the current card's state is not 'unused'
        return this.lastPlayedCard && !areCompatible(this.card, this.lastPlayedCard) && this.card.locationType !== 'unused';
        },
        cardClass() {
        // Determines the card's class based on its state
        if (this.card.locationType === 'last-card-played') {
            return 'last-played';
        } else if (this.isIllegal) {
            return 'illegal';
        } else if (this.card.locationType === 'unused') {
            return 'unused';
        }
        return 'can-play';
        },
    },
    methods: {
        handleClick() {
        if (!this.isIllegal && this.card.locationType !== 'unused') {
            this.$emit('playCard', this.card.id); // emit playCard
        } else {
            // Provide feedback if the move is not allowed or the card is unused
            alert("This move is not allowed or the card is unused.");
        }
        },
    },
    };
</script>

<style scoped>
  .card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 5px;
  }
  
  .card {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100px;
    height: 140px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
    padding: 10px;
    flex-direction: column;
  }
  
  .card:hover {
    transform: translateY(-5px);
  }
  
  .card-rank {
    font-size: 24px;
    font-weight: bold;
  }
  
  .card-suit {
    font-size: 24px;
  }
  
  .last-played {
    border: 2px solid green;
  }
  
  .unused {
  opacity: 0.5; /* Makes the unused cards appear faded */
  cursor: not-allowed; /* Changes the cursor to indicate they cannot be interacted with */
  }
  
  .illegal {
    border: 2px solid red;
  }
  
  .can-play {
    border: 2px solid blue;
  }
  
  .card-status {
    margin-top: 5px;
  }
  </style>
  

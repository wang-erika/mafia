<template>
  <button 
    :class="{ 'error': nextPhaseError }"
    @click="handleNextPhase"
  >
    {{ nextPhaseError || 'Next Phase' }}
  </button>
</template>

  
<script lang = "ts">
import { useMutation } from '@vue/apollo-composable';
import { ref } from 'vue';
import gql from 'graphql-tag';

export default {
  name: 'NextPhase',
  setup() {
    const NEXT_ROUND_OR_PHASE = gql`
      mutation NextRoundOrPhase {
        nextRoundOrPhase {
          _id
          phase
          round
          players {
            id
            name
            role
            status
          }
        }
      }
    `;

    const { mutate: nextRoundOrPhase, loading, error } = useMutation(NEXT_ROUND_OR_PHASE);
    const nextPhaseError = ref('');

    function handleNextPhase() {
      nextRoundOrPhase().then(response => {
        // Reset the error message if the mutation is successful
        nextPhaseError.value = '';
        // ...rest of your success logic...
      }).catch(err => {
        // Extract the error message
        // You might need to adjust the following line depending on the error structure
        nextPhaseError.value = err.message || 'An error occurred';
        console.error('Error updating phase:', err);
        console.log(nextPhaseError.value)
      });
    }

    return { handleNextPhase, loading, error, nextPhaseError };
  }
}
</script>
  
<style>
.error {
  background-color: red; /* Change the background to red */
  color: white; /* Optional: Change text color to improve contrast */
}
</style>



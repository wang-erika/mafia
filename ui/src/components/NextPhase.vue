<template>
    <button @click="handleNextPhase">Next Phase</button>
  </template>
  
<script lang = "ts">
import { useMutation } from '@vue/apollo-composable';
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

    function handleNextPhase() {
      nextRoundOrPhase().then(response => {
        if (response) {
          console.log('Phase updated:', response.data.nextRoundOrPhase);
        } else {
          console.error('No response returned');
        }
      }).catch(err => {
        console.error('Error updating phase:', err);
      });
    }


    return { handleNextPhase, loading, error };
  }
}
</script>
  
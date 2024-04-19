<template>
  <router-view />
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const httpLink = createHttpLink({
  uri: `http://localhost:31001/graphql`,
  credentials: 'include'
})
const cache = new InMemoryCache()
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
})

provide(DefaultApolloClient, apolloClient)
</script>
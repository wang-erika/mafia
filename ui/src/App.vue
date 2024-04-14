<template>
  <router-view />
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const httpLink = createHttpLink({
  // see https://studio.apollographql.com/public/SpaceX-pxxbxen/variant/current/home
  uri: 'http://localhost:8131/graphql',
})
const cache = new InMemoryCache()
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
})

provide(DefaultApolloClient, apolloClient)
</script>
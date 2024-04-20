<template>
  <router-view />
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache, split, createHttpLink } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

// HTTP link for regular queries and mutations
const httpLink = createHttpLink({
  uri: `http://localhost:8131/graphql`, // Ensure this is your correct GraphQL endpoint
  credentials: 'include', // For sending cookies with the request (if needed)
});

// Create a GraphQLWsLink link:
const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8131/graphql",
  })
);
// Using split to send data to each link depending on what kind of operation is being sent
const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    // Route the request to the WebSocket link if it's a subscription
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink, // Used for subscriptions
  httpLink, // Used for queries and mutations
);

const cache = new InMemoryCache();

// Create the Apollo Client with the combined link and cache
const apolloClient = new ApolloClient({
  link,
  cache,
});

// Provide the Apollo Client to your Vue app
provide(DefaultApolloClient, apolloClient);
</script>
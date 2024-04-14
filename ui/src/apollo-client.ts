// src/apollo-client.js
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core';
import fetch from 'cross-fetch';

const httpLink = createHttpLink({
  uri: 'http://localhost:8131/graphql', // This should match your Apollo Server's URI
  fetch,
});

const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default apolloClient;

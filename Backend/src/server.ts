import http from "http";
import app from "./app";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { json } from "express";
import { env } from "./config/env";
import { connectDB } from "./config/db";

// TEMP: empty schema (abhi sirf server test ke liye)
const typeDefs = `
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from HangoutX GraphQL ",
  },
};

async function startServer() {

    //db connect first

    await connectDB();
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    json(),
    expressMiddleware(apolloServer)
  );

  const PORT = env.PORT || "4000";

  httpServer.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` GraphQL ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => {
  console.error(" Server failed to start", err);
});

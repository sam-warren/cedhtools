import express from "express"
import { ApolloServer } from "apollo-server-express"
import { createServer } from "http"
import compression from "compression"
import cors from "cors"
import helmet from "helmet"
import { schema } from "./schema"

const PORT = process.env.PORT || 3100
const app = express()
app.use("*", cors())
app.use(helmet())
app.use(compression())

async function startApolloServer() {
  const server = new ApolloServer({
    schema,
  })

  await server.start()

  server.applyMiddleware({ app, path: "/graphql" })
}

// Start the server
startApolloServer().catch((err) => {
  console.error("Failed to start server:", err)
  process.exit(1)
})

const httpServer = createServer(app)

httpServer.listen({ port: PORT }, (): void =>
  console.log(`🚀GraphQL-Server is running on http://localhost:3100/graphql`)
)

httpServer.on("error", (error) => {
  console.error("Server error:", error)
})

app.get("/", (req, res) => {
  res.send("Hello World")
})

export { app }

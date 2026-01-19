import app from "./src/app"
import { createServer } from "http"
import { initializeSocket } from "./src/utils/socket"

const PORT = process.env.PORT

const httpServer = createServer(app)

initializeSocket(httpServer)


httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
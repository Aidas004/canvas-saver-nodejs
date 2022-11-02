require("dotenv").config()
const express = require("express")
const app = express()
const cors = require('cors')
const server = require('http').Server(app)
const front_dev = 'http://localhost:3000'
options = {
    cors: {
        origin: function (origin, fn) {
            if (origin === front_dev)
                return fn(null, origin)
            return fn('Error Invalid domain')
        }
    },
}
const io = require('socket.io')(server, options)
server.listen(process.env.PORT, () => {
    console.log(`Started successfully on PORT:${process.env.PORT}`)
})

const bp = require('body-parser')
const { canvasSaver } = require("./controllers/main")
app.use(cors())
app.use(bp.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bp.json());
io.on('connection', (socket) => {
    socket.on('url', (data) => {
        canvasSaver(data, socket)
    })
})
import { sequelize } from "../db/database.js";
import express from "express";
import cors from "cors";
import routes from "./routes.js";
import { Server } from "socket.io";
import crypto from 'crypto';
import { schedule } from "./modules/automation.js";

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason.stack || reason);
  if (reason.errors){
    const msgs = reason.errors.map((e)=>e.message).join(", ");
    console.error(msgs);
  }
});

const app = express(); // todo: https://javascript.plainenglish.io/serving-hello-world-with-http2-and-express-js-4dd0ffe76860
//app.use(function(req,res,next){setTimeout(next,300)}); // !Simulate Lattency
app.use(cors());
const api = express();
api.use(express.json());
app.use('/api', api);
routes(api);
api.get("*", (req, res) => { res.status(404).send("API not found"); });
app.use(function (err, req, res, next) {
    console.error(err.message, err);
    res.statusMessage = err.message;
    res.status(err.status || 500).json(err.errors);
});

const server = app.listen(7870, async () => {
  console.log("server started on port 7870");
  await schedule();
} );

export const io = new Server(server);
io.on('connection', (socket) => {
  //console.log('New socket connection');
  socket.on('disconnect', () => {
    //console.log("socket disconnected");
  });
});
app.set("/io", io);
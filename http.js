const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const clearMessagesMiddleware = require("./middlewares/clearMessagesMiddleware");
const authorizationMiddleware = require("./middlewares/authorizationMiddleware");

const accountRouter = require("./routers/accountRouter");
const stockRouter = require("./routers/stockRouter");
const mainRouter = require("./routers/mainRouter");

(async () => {
  const server = express();
  server.use(express.static(__dirname + "/static"));
  server.set("view engine", "ejs");
  server.use(bodyParser.json());

  server.use(cookieParser());
  server.use(
    session({ secret: "keyboard cat", resave: false, saveUninitialized: true })
  );

  server.use(clearMessagesMiddleware);
  server.use(authorizationMiddleware);

  server.use("/", accountRouter);
  server.use("/", mainRouter);
  server.use("/stock", stockRouter);

  server.listen(3000, () => console.log("listening"));
})();
import autoprefixer from "autoprefixer";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import postcssMiddleware from "postcss-middleware";
import sassMiddleware from "node-sass-middleware";
import winston from "winston";
import runCrons from "./cron";
import appRoutes from "./routes";
require("./models/interaction");
require("./models/user");

runCrons();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      colorize: true,
      timestamp: `${new Date().toLocaleDateString()} [${new Date().toLocaleTimeString()}]`
    }),
    new winston.transports.File({
      filename: "error.log",
      level: "error"
    }),
    new winston.transports.File({
      filename: "combined.log"
    })
  ]
});

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

if (process.env.NODE_ENV === "test") {
  mongoose.connect(process.env.MONGODB_TEST_URI);
} else {
  mongoose.connect(process.env.MONGODB_URI);
}
mongoose.set("useCreateIndexes", true);

const port = process.env.PORT;
const app = express();

app.set("view engine", "pug");

app.use(
  sassMiddleware({
    src: path.join(__dirname, "stylesheets"),
    dest: path.join(__dirname, "public"),
    debug: true,
    outputStyle: "compressed"
  })
);

app.use(
  "/css",
  postcssMiddleware({
    src: req => path.join(`${__dirname}public`, req.url),
    plugins: [
      autoprefixer({
        browsers: ["> 1%", "IE 7"],
        cascade: false
      })
    ]
  })
);

app.enable("trust proxy");

app.use(function(req, res, next) {
  if (
    [
      "production",
      "staging"
    ].includes(process.env.NODE_ENV) &&
    !req.secure
  ) {
    res.redirect(`https://${req.headers.host}${req.url}`);
  } else {
    next();
  }
});

app.use(express.static("public"));

app.use("/", appRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.info(`Listening on port ${port}`));
}

module.exports = app;

import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { stdout as output } from "process";
import readline from "readline";
import { Writable } from "stream";
import { readFile } from "./fileReader";
import createError from "http-errors";
// import { promises as fs, createReadStream } from "fs"

const app = express();
const hopPath = path.resolve(__dirname, "../test-files/hop");

app.get("/", (req, res) => {
  fs.readFile(
    path.resolve(__dirname, "../test-files/hop"),
    "utf8",
    (err, data) => {
      res.send(`Hello hop! ${data}`);
    },
  );
});

app.get("/files", async (req, res, next) => {
  const testDirectory = path.resolve(__dirname, "../test-files/");

  try {
    const files = await fs.promises.readdir(testDirectory);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

app.get("/file", (req: Request, res: Response) => {
  readFile(hopPath, 256).then(
    (data) => {
      res.send(`Hello hop! ${data}`);
    },
    (err) => {
      res.send(`Error: ${err}`);
    },
  );
});

app.use(function (req, res) {
  res.sendStatus(404);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.sendStatus(err.status || 500);
});

app.listen(4000, () => {
  console.log(`server running on port 4000`);
});

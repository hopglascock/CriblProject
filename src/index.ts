import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { stdout as output } from "process";
import { Readable, Transform, TransformCallback } from "stream";
import readline from "readline";
import { Writable } from "stream";
import { pipeline, PassThrough } from "stream";
import { readFile } from "./fileReader";
import createError from "http-errors";
// import { promises as fs, createReadStream } from "fs"

const app = express();
// const hopPath = path.resolve(__dirname, "../test-files/wikipedia.txt");
// const hopPath = path.resolve(__dirname, "../test-files/out20.txt");
const hopPath = path.resolve(__dirname, "../test-files/hop");

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  if ("code" in (e as any)) return true;
  else return false;
}

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hello World",
      version: "1.0.0",
    },
  },
  apis: ["./src/routes*.js", "./src/index.ts"],
};

// const openapiSpecification = await swaggerJsdoc(options);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

app.get("/", (req, res) => {
  fs.readFile(
    path.resolve(__dirname, "../test-files/hop"),
    "utf8",
    (err, data) => {
      res.send(`Hello hop! ${data}`);
    }
  );
});

/**
 * @openapi
 * /logs:
 *   get:
 *     description: Welcome to swagger-jsdoc!
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
app.get("/logs", async (req, res, next) => {
  const testDirectory = path.resolve(__dirname, "../test-files/");

  try {
    const files = await fs.promises.readdir(testDirectory);
    res.json({ files });
  } catch (err) {
    next(err);
  }
});

// Transform stream to filter specific paths
const filterHopStream = (searchString: string) =>
  new Transform({
    readableObjectMode: true,
    transform(logEntry, encoding, callback) {
      if (logEntry.includes(searchString)) {
        this.push(logEntry);
      }
      callback();
    },
  });

app.get("/logs/:fileName", async (req: Request, res: Response, next) => {
  const { search } = req.query;
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "../test-files", fileName); // Adjust the path as needed

  if (search === undefined) {
    return res.status(400).send('Query parameter "param" is required');
  }

  if (typeof search !== "string") {
    return res.status(400).send('Query parameter "param" must be a string');
  }

  try {
    // todo: chunksizze
    // const hop = await readFile(filePath);
    let readstream = readFile(filePath, 1028 * 1000);
    pipeline(
      readFile(filePath, 1028 * 1000),
      search ? filterHopStream(search) : new PassThrough(), // boy i kinda hate this
      res,
      (err) => {
        if (err) console.log(err);
      }
    );
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") res.sendStatus(404);
    else res.sendStatus(500);
  }
});

app.get("/file", (req: Request, res: Response) => {
  try {
    readFile(hopPath, 1024 * 1000).pipe(res);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.get("/big", async (req, res, next) => {
  // const { id } = req.params;
  try {
    // const file = await File.findById(id);
    // if(!file) {
    //     return res.sendStatus(404);
    // }

    // const filePath = FILES_PATH . '/' . file.path;
    // TODO: how to pick buffer size?
    const data = readFile(hopPath, 1024 * 1000);

    res.setHeader("Content-Type", "txt/plain");
    res.setHeader("Content-Disposition", "attachment; filename=hop.txt");

    data.pipe(res);
  } catch (err) {
    res.sendStatus(500);
  }
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

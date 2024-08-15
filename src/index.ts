import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Transform } from "stream";
import { pipeline, PassThrough } from "stream";
import { readFile } from "./fileReader";

const app = express();

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

app.get("/", (req, res) => {
  res.redirect("/docs");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));
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
const filterStream = (searchString: string) =>
  new Transform({
    readableObjectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk.includes(searchString)) {
        this.push(chunk);
      }
      callback();
    },
  });

const createFilter = (allow: number) => {
  let count = 0;

  let transform = new Transform({
    readableObjectMode: true,
    transform(chunk, encoding, callback) {
      count++;
      if (count <= allow) {
        this.push(chunk);
      }

      callback();
    },
  });

  return transform;
};

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

  let readstream = readFile(filePath, 1028 * 1000);
  try {
    // todo: chunksize
    pipeline(
      readstream,
      search ? filterStream(search) : new PassThrough(), // boy i kinda hate this
      true ? createFilter(4) : new PassThrough(),
      res,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  } catch (err) {
    if (isErrnoException(err) && err.code === "ENOENT") res.sendStatus(404);
    else res.sendStatus(500);
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

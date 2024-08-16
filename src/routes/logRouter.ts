import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pipeline, PassThrough } from "stream";
import { readFile } from "../fileReader";
import { createTakeTransform, filterStream } from "../TransformFilters";

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  if ("code" in (e as any)) return true;
  else return false;
}

const logDirectory = "/var/log";
// const logDirectory = path.join(__dirname, "../../test-files");

const router = express.Router();

/**
 * @openapi
 * /logs:
 *   get:
 *     description: Returns a list of files in /var/log.
 *     responses:
 *       200:
 *         description: The list of files.
 */
router.get("/", async (req, res) => {
  console.log("found");
  const testDirectory = path.resolve(logDirectory);
  const dirents = (
    await fs.promises.readdir(testDirectory, {
      withFileTypes: true,
    })
  )
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);
  return res.json({ dirents });
});

/**
 * @openapi
 * /logs/{fileName}:
 *   get:
 *     description: Returns a file in /var/log. Optionally filtered by search query, and limited to a number of lines.
 *     parameters:
 *       - name: fileName
 *         in: path
 *         description: The name of the file to retrieve
 *         required: true
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         required: false
 *         description: The search query to filter the logs by
 *         schema:
 *           type: string
 *       - name: take
 *         in: query
 *         required: false
 *         description: The number of lines to return
 *         schema:
 *           type: number
 *     responses:
 *       "200":
 *         description: Successful operation
 */
router.get("/:fileName", async (req: Request, res: Response) => {
  const { fileName } = req.params;
  const { search } = req.query;
  const take = req.query.take ? parseInt(String(req.query.take)) : undefined;
  const filePath = path.join(logDirectory, fileName); // Adjust the path as needed

  if (search && typeof search !== "string") {
    return res.status(400).send('Query parameter "search" must be a string');
  }
  if (take && isNaN(take)) {
    return res.status(400).send('Query parameter "take" must be a number');
  }

  // TODO: ENOENT error handling

  let readstream = readFile(filePath, 1028 * 1000);
  try {
    // todo: chunksize
    pipeline(
      readstream,
      search ? filterStream(search) : new PassThrough(), // boy i kinda hate this
      take ? createTakeTransform(take) : new PassThrough(),
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

export default router;

import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream"; // Add this line to import the Readable class

// imports not woking and i'm not messing with it!
const { sentence } = require("txtgen/dist/cjs/txtgen.js");

function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
  if ("code" in (e as any)) return true;
  else return false;
}

const logDirectory = "/var/log";
// const logDirectory = path.join(__dirname, "../../test-files");

const router = express.Router();

const byteSize = (str: string) => new Blob([str]).size;

/**
 * @openapi
 * /generateLogs:
 *   put:
 *     description: generate logs for testing
 *     parameters:
 *       - name: fileName
 *         in: query
 *         required: true
 *         description: The name of the file to generate (dont inclue .log)
 *         schema:
 *           type: string
 *       - name: size
 *         in: query
 *         required: true
 *         description: The size of the file in bytes return
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: log generated
 */
router.put("/", async (req: Request, res: Response) => {
  const { fileName } = req.query;
  const size = parseInt(String(req.query.size));
  if (!fileName || !size) {
    return res
      .status(500)
      .send('Query parameter "fileName" and "size" must be provided');
  }
  if (fileName && typeof fileName !== "string") {
    return res.status(400).send('Query parameter "fileName" must be a string');
  }
  if (isNaN(size)) {
    return res.status(400).send('Query parameter "take" must be a number');
  }

  var writeStream = fs.createWriteStream(
    path.join(logDirectory, `${fileName}.log`),
    { flags: "w" }
  );

  let totalBytes = 0;

  async function* generate() {
    while (totalBytes < size) {
      yield sentence() + "\n";
    }
  }
  let textStream = Readable.from(generate());
  textStream.on("data", (chunk) => {
    totalBytes += byteSize(chunk);
  });
  try {
    await pipeline(textStream, writeStream);
    res.status(200).send("log generated");
  } catch (err) {
    console.log(err);
    res.status(500).send("somthing went wrong :(");
  }
});

export default router;

import fs from "fs";
import path from "path";
import util from "util";
import { pipeline } from "stream/promises";
import { Readable, Transform, TransformCallback } from "stream";
import readline from "readline";
import { Request, Response } from "express";

// this will fail if chunkSize larger than line size
export function readFile(filePath: string, chunkSize: number = 1024): Readable {
  const fileSize = fs.statSync(filePath).size;
  let pointer = fileSize - chunkSize < 0 ? 0 : fileSize - chunkSize;

  async function pipelineAndLog(filePath: string) {
    // TODO: reanme this
    async function chunkify(readable: any) {
      // not sure if i want to use readline or do it myself
      const rl = readline.createInterface({
        input: readable,
        crlfDelay: Infinity,
      });
      const buffer = [];
      for await (const line of rl) {
        buffer.push(line);
      }

      if (pointer > 0) {
        pointer += buffer.shift()?.length || 0;
      }
      return buffer.reverse();
      // return buffer;
    }

    let stream = fs.createReadStream(filePath, {
      start: Math.max(pointer, 0),
      end: Math.max(pointer + chunkSize, 0),
      encoding: "utf8",
    });
    return await pipeline(stream, chunkify);
  }

  // pointer += shift;
  // TODO: backpressure check
  // using generator isnt as fast (3x slower) but it looks way nicer
  async function* generate() {
    while (pointer + chunkSize > 0) {
      for await (const chunk of await pipelineAndLog(filePath)) {
        yield chunk;
      }
      pointer -= chunkSize;
    }
  }

  const addNewLine = new Transform({
    readableObjectMode: true,
    transform(logEntry, encoding, callback) {
      this.push(logEntry + "\n");

      callback();
    },
  });
  return Readable.from(generate()).pipe(addNewLine);
}

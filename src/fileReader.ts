import fs from "fs";
import { pipeline } from "stream/promises";
import { Readable, Transform } from "stream";
import readline from "readline";

// this will fail if chunkSize larger than line size
export function readFile(filePath: string, chunkSize: number = 1024): Readable {
  const fileSize = fs.statSync(filePath).size;
  let pointer = fileSize - chunkSize < 0 ? 0 : fileSize - chunkSize;

  async function pipelineAndLog(filePath: string) {
    // TODO: reanme this
    // Tired hop and the end of project - "but whyyyyyy i like it!"
    async function chunkify(readable: any) {
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

  // TODO: backpressure check
  // using generator isnt as fast (3x slower in my testing) but it looks way nicer and i cant be bothered to fix it
  async function* generate() {
    try {
      while (pointer + chunkSize > 0) {
        for await (const chunk of await pipelineAndLog(filePath)) {
          yield chunk;
        }
        pointer -= chunkSize;
      }
    } catch (err) {
      console.log("err");
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

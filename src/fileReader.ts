import fs from "fs";
import path from "path";
import util from "util";
import { pipeline } from "stream/promises";
import readline from "readline";
import { Request, Response } from "express";

// const pipeline = util.promisify(stream.pipeline);
// import { stdout as output } from "process";
// import readline from "readline";
// import { Writable } from "stream";
// import createError from "http-errors";

// const logStream = new Writable({
//   write(chunk, encoding, callback) {
//     console.log("hophop");
//     console.log(chunk.toString());
//     callback();
//   },
// });

// let rd = readline.createInterface(
//     fs.createReadStream(hopPath, {
//         start: Math.max(pointer, 0),
//         end: Math.max(this.pointer+this.chunkS, 0),
//         encoding: "utf8",
//     }),
//     process.stdout,
//   );
//   rd.on("line", (line) => {
//     console.log(line);
//   });

export async function readFile(
  filePath: string,
  chunkSize: number = 1024,
): Promise<string> {
  const fileSize = fs.statSync(filePath).size;
  let chunkS = chunkSize;
  const pos = fileSize - chunkS < 0 ? 0 : fileSize - chunkS;
  let pointer = fileSize - chunkS < 0 ? 0 : fileSize - chunkS;

  //   const stream = fs.createReadStream(filePath, {
  //     start: Math.max(pointer, 0),
  //     end: Math.max(pointer + chunkS, 0),
  //     encoding: "utf8",
  //   });

  //   stream.on("error", function (err) {
  //     throw err;
  //   });
  //   stream.on("end", function () {
  //     // if(_this.buffer === null){
  //     //     // callback
  //     // //   cb(null, true);
  //     // } else {
  //     //     // recurse
  //     //   _this.readLine(cb);
  //     // }
  //   });
  //   stream.on("data", function (data) {
  //     if (buffer === null) {
  //       buffer = "";
  //     }
  //     buffer += data;
  //     chunkS += data.length;
  //   });

  const pipelineAndLog = (
    filePath: string,
    // pointer: number,
    // chunkS: number,
  ) => {
    async function logChunks(readable: any) {
      // not sure if i want to use readline or do it myself
      const rl = readline.createInterface({
        input: readable,
        crlfDelay: Infinity,
      });
      const buffer = [];
      for await (const line of rl) {
        buffer.push(line);
      }
      let shift = 0;
      if (pointer > 0) {
        // does it mutate?
        shift = buffer.shift()?.length || 0;
      }
      pointer += shift;
      buffer.reverse();
      console.log(buffer);
    }
    return pipeline(
      fs.createReadStream(filePath, {
        start: Math.max(pointer, 0),
        end: Math.max(pointer + chunkS, 0),
        encoding: "utf8",
      }),
      logChunks,
    );
  };

  const ret = "";

  // this is messing with the order!! need to use generator?
  do {
    await pipelineAndLog(filePath);
    pointer -= chunkS;
  } while (pointer > 0);

  await pipelineAndLog(filePath);

  return await fs.promises.readFile(filePath, {
    encoding: "utf8",
  });
}

// const { once } = require('node:events');
// const { createReadStream } = require('node:fs');
// const { createInterface } = require('node:readline');

// (async function processLineByLine() {
//   try {
//     const rl = createInterface({
//       input: createReadStream('big-file.txt'),
//       crlfDelay: Infinity,
//     });

//     rl.on('line', (line) => {
//       // Process the line.
//     });

//     await once(rl, 'close');

//     console.log('File processed.');
//   } catch (err) {
//     console.error(err);
//   }
// })();

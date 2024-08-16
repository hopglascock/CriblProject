import fs from "fs";


// This was a nother method of reading the files i was trying out, I wanted it to be more streamlined
// and easier to read but I ran out of time to make it work.

export function readFile(filePath: string, chunkSize: number = 1024): any {
  const fileSize = fs.statSync(filePath).size;
  let pointer = fileSize - chunkSize < 0 ? 0 : fileSize - chunkSize;

  async function* generate2() {
    let fileHandle;
    try {
      fileHandle = await fs.promises.open(filePath, "r");
      while (pointer + chunkSize > 0) {
        const readOptions: fs.promises.CreateReadStreamOptions = {
          autoClose: false,
          start: Math.max(pointer, 0),
          end: Math.max(pointer + chunkSize, 0),
          encoding: "utf8",
          // highWaterMark?: number | undefined;
        };

        let lines = [];
        let partialLineOffset = 0;
        let buffer = Buffer.alloc(chunkSize);
        fileHandle.read(buffer, 0, buffer.length, pointer);
        // let hop = await fileHandle.createReadStream(readOptions);
        let lines = buffer
          .toString("utf-8")
          .replace("\r\n", "\n")
          .replace("\r", "\n")
          .split("\n");
        for (const line of lines) {
          lines.push(line);
        }
        if (pointer > 0) {
          partialLineOffset = lines.shift()?.length || 0;
        }
        if (partialLineOffset >= chunkSize) {
          throw new Error("Line size is larger than chunk size");
        }
        pointer += partialLineOffset;

        for (const line of lines.reverse()) {
          yield line;
        }

        // TODO: stop streaming on close connection
        pointer -= chunkSize;
      }
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      fileHandle && (await fileHandle.close());
    }
  }

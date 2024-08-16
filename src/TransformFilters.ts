import { Transform } from "stream";

// Transform stream to filter specific paths
export const filterStream = (searchString: string) =>
  new Transform({
    readableObjectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk.includes(searchString)) {
        this.push(chunk);
      }
      callback();
    },
  });

export const createTakeTransform = (allow: number) => {
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

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

//   This is terrible, it will allow the whole stream to finish, so the requst will take forever to finish!!
//  when I was thinking things out I thought you could call destroy on the stream but it seems like there are reprocussions of that
// I have thoughts on how to fix it but it would require a decent refactor of the code i think.
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

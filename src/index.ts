import express from 'express';
import fs from 'fs';


const app = express();



app.get('/', (req, res) => {
  res.send('Hello hop!');
});


app.listen(4000, () => {
  console.log(`server running on port 4000`);
});

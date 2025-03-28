import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Test server running on port 5000');
});
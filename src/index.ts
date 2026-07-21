import express from 'express';
import router from './routes/index.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(router);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

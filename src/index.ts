import express from 'express';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(router);

//Catches requests that don't match a route
app.use(notFoundHandler);

//Handles errors passed through Express (server)
app.use(errorHandler);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

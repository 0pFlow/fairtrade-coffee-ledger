import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');  
});

app.get('/test', (req: Request, res: Response) => {
    const arr = ["a", "b", "c"];
    res.json(arr);
});

app.listen(3000);
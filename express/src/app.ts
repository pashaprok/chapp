import express, { Application, Request, Response } from 'express';
import { HttpError } from 'http-errors';

const app: Application = express();
app.use(express.json());

app.use('/', (req: Request, res: Response) => {
  res.send("hello, world! i'm chapp");
});

app.use((err: any, res: Response) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
      code: err.statusCode,
    });
  }

  return res.status(500).json({
    message: err.toString(),
    stack: err.stack,
  });
});

export default app;

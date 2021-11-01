import { Request, Response } from 'express';
import path from 'path';

export function chatRoomController(req: Request, res: Response) {
  return res.sendFile(
    path.join(__dirname, '/../../resources/static/chatRoom.html'),
  );
}

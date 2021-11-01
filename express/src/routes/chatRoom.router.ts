import { Router } from 'express';
import { chatRoomController } from '../controllers/chatRoom.controller';

const router: Router = Router();

router.get('/', chatRoomController);

export default router;

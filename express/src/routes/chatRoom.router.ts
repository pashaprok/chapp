import { Router } from 'express';
import { chatRoomController } from '../controllers/chatRoom.controller';
import passport from 'passport';

const router: Router = Router();
router.use(passport.authenticate('jwt'));
router.get('/', chatRoomController);

export default router;

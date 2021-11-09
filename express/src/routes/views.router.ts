import { Router } from 'express';
import {
  getLoginForm,
  getSignupForm,
  getMyProfile,
  chatRoom,
  privateRoom,
} from '../controllers/views.controller';
import passport from 'passport';

const router: Router = Router();

router.get('/login', getLoginForm);
router.get('/signup', getSignupForm);
router.get('/my-profile', passport.authenticate('jwt'), getMyProfile);
router.get('/chat-room', passport.authenticate('jwt'), chatRoom);
router.get('/private-room/:unique', passport.authenticate('jwt'), privateRoom);

export default router;

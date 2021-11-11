import { Router } from 'express';
import {
  getLoginForm,
  getSignupForm,
  getMyProfile,
  chatRoom,
  privateRoom,
} from '../controllers/views.controller';
import passport from 'passport';
import { isLoggedIn } from '../middlewares/auth.middlewares';

const router: Router = Router();

router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignupForm);
router.get('/my-profile', passport.authenticate('jwt'), getMyProfile);
router.get('/chat-room', passport.authenticate('jwt'), chatRoom);
router.get('/private-room/:unique', passport.authenticate('jwt'), privateRoom);

export default router;

import { Router } from 'express';
import passport from 'passport';
import {
  getLoginForm,
  getSignupForm,
  getMyProfile,
  chatRoom,
  privateRoom,
} from '../controllers/views.controller';
import { isLoggedIn } from '../middlewares/auth.middlewares';

const router: Router = Router();

router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignupForm);

router.use(passport.authenticate('jwt'));

router.get('/my-profile', getMyProfile);
router.get('/chat-room', chatRoom);
router.get('/private-room/:unique', privateRoom);

export default router;

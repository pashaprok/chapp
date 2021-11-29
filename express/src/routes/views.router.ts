import { Router } from 'express';
import {
  getLoginForm,
  getSignupForm,
  getMyProfile,
  chatRoom,
  privateRoom,
} from '../controllers/views.controller';
import { verifyUser, isLoggedIn } from '../middlewares/jwt';

const router: Router = Router();

router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignupForm);

router.use(verifyUser);

router.get('/my-profile', getMyProfile);
router.get('/chat-room', chatRoom);
router.get('/private-room/:unique', privateRoom);

export default router;

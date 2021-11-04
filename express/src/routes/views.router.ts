import { Router } from 'express';
import {
  getLoginForm,
  getSignupForm,
  getMyProfile,
} from '../controllers/views.controller';
import passport from 'passport';

const router: Router = Router();

router.get('/login', getLoginForm);
router.get('/signup', getSignupForm);
router.get('/my-profile', passport.authenticate('jwt'), getMyProfile);

export default router;

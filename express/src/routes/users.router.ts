import { Router } from 'express';
import {
  getAllUsers,
  getMe,
  updateMe,
  deleteMe,
} from '../controllers/users.controller';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller';
import passport from 'passport';

const router: Router = Router();

router.route('/').get(getAllUsers);
router.route('/signup').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

router
  .use(passport.authenticate('jwt'))
  .route('/my-profile')
  .get(getMe)
  .patch(updateMe)
  .delete(deleteMe);

export default router;

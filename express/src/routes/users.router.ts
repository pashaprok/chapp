import { Router } from 'express';
import passport from 'passport';
import {
  getAllUsers,
  getMe,
  getOneById,
  updateMe,
  deleteMe,
} from '../controllers/users.controller';
import {
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller';
import {
  userFullValidate,
  userPartialValidate,
} from '../middlewares/validation';

const router: Router = Router();

router.route('/').get(getAllUsers);
router.route('/by-id/:_id').get(getOneById);
router.route('/signup').post(userFullValidate, registerUser);
router.route('/login').post(userPartialValidate, loginUser);

router.use(passport.authenticate('jwt'));

router.route('/logout').get(logoutUser);

router
  .route('/my-profile')
  .get(getMe)
  .patch(userPartialValidate, updateMe)
  .delete(deleteMe);

export default router;

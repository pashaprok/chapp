import { Router } from 'express';
// import {
//   // deleteUserController,
//   getAllUsers,
//   getUserController,
//   // updateUserController,
// } from '../controllers/userController';
import { loginUser, registerUser } from '../controllers/auth.controller';

const router: Router = Router();

// router.route('/').get(getAllUsers);
//
// router.route('/:id').get(getUserController);
// .patch(updateUserController)
// .delete(deleteUserController);

router.route('/signup').post(registerUser);
router.route('/login').post(loginUser);

export default router;

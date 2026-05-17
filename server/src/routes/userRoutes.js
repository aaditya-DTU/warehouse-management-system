
import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/usersController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import allowRoles from '../middlewares/rbacMiddleware.js';

const router = express.Router();


router.use(authMiddleware);
router.use(allowRoles('ADMIN'));


router.get('/', getAllUsers);


router.get('/:id', getUserById);


router.post('/', createUser);


router.put('/:id', updateUser);


router.delete('/:id', deleteUser);

export default router;
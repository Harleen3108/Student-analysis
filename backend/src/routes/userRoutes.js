import express from 'express';
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser, 
  activateUser,
  deactivateUser,
  updateUserStatus
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateUser } from '../middleware/validation.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.use(authorize('admin'));

// Routes
router.route('/')
  .get(getUsers)
  .post(validateUser, createUser);

router.route('/:id')
  .get(getUser)
  .put(validateUser, updateUser)
  .delete(deleteUser);

router.put('/:id/activate', activateUser);
router.put('/:id/deactivate', deactivateUser);
router.put('/:id/status', updateUserStatus);

export default router;
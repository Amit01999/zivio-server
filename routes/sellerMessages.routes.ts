import { Router } from 'express';
import {
  getSellerMessages,
  markMessageRead,
  addSellerThreadReply,
} from '../controllers/adminSellerMessage.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSellerMessages);
router.patch('/:id/read', markMessageRead);
router.post('/:id/reply', addSellerThreadReply);

export default router;

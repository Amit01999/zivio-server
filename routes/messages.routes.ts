import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, messagesController.getConversations);
router.get('/:id/messages', authMiddleware, messagesController.getMessages);
router.post('/:id/messages', authMiddleware, messagesController.sendMessage);

export default router;

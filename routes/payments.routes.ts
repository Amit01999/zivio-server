import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/initiate', authMiddleware, paymentsController.initiatePayment);
router.post('/callback/:gateway', paymentsController.paymentCallback);

export default router;

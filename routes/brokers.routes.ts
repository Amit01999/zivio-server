import { Router } from 'express';
import * as brokersController from '../controllers/brokers.controller.js';

const router = Router();

router.get('/', brokersController.getBrokers);
router.get('/:id', brokersController.getBrokerById);

export default router;

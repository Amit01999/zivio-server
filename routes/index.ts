import { Router } from 'express';
import authRoutes from './auth.routes.js';
import listingsRoutes from './listings.routes.js';
import brokersRoutes from './brokers.routes.js';
import favoritesRoutes from './favorites.routes.js';
import messagesRoutes from './messages.routes.js';
import reviewsRoutes from './reviews.routes.js';
import adminRoutes from './admin.routes.js';
import paymentsRoutes from './payments.routes.js';
import propertyInquiryRoutes from './propertyInquiry.routes.js';
import comparisonCartRoutes from './comparisonCart.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import uploadRoutes from './upload.routes.js';
import { contactFormHandler, createViewingRequest } from '../controllers/misc.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/listings', listingsRoutes);
router.use('/brokers', brokersRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/conversations', messagesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentsRoutes);
router.use('/property-inquiries', propertyInquiryRoutes);
router.use('/comparison-cart', comparisonCartRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);

router.post('/inquiries', contactFormHandler);
router.post('/viewing-requests', authMiddleware, createViewingRequest);

export default router;

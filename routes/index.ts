import { Router } from 'express';
import authRoutes from './auth.routes';
import listingsRoutes from './listings.routes';
import brokersRoutes from './brokers.routes';
import favoritesRoutes from './favorites.routes';
import messagesRoutes from './messages.routes';
import reviewsRoutes from './reviews.routes';
import adminRoutes from './admin.routes';
import paymentsRoutes from './payments.routes';
import propertyInquiryRoutes from './propertyInquiry.routes';
import comparisonCartRoutes from './comparisonCart.routes';
import dashboardRoutes from './dashboard.routes';
import uploadRoutes from './upload.routes';
import { contactFormHandler, createViewingRequest } from '../controllers/misc.controller';
import { authMiddleware } from '../middleware/auth.middleware';

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

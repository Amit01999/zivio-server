import { Router } from 'express';
import {
  getBuyerDashboard,
  getSellerDashboard,
  getBrokerDashboard,
  getAdminDashboard,
  getListingAnalytics
} from '../controllers/dashboard.controller.js';
import {
  authMiddleware,
  requireBuyer,
  requireSeller,
  requireBroker,
  requireAdmin
} from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Role-specific dashboard stats
router.get('/buyer', requireBuyer, getBuyerDashboard);
router.get('/seller', requireSeller, getSellerDashboard);
router.get('/broker', requireBroker, getBrokerDashboard);
router.get('/admin', requireAdmin, getAdminDashboard);

// Listing analytics (seller/broker/admin)
router.get('/listings/:listingId/analytics', getListingAnalytics);

export default router;

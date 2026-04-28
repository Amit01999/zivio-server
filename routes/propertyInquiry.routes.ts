import { Router } from 'express';
import {
  createInquiry,
  getBuyerInquiries,
  getInquiryDetails,
  updateInquiryStatus,
  getListingInquiries,
  getSellerListingInquiries,
  replyToInquiry,
  buyerReplyToInquiry,
} from '../controllers/propertyInquiry.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create new inquiry (any authenticated user)
router.post('/', createInquiry);

// Get buyer's own inquiries
router.get('/', getBuyerInquiries);

// Get all inquiries for current seller's listings — must be before /:id
router.get('/seller', getSellerListingInquiries);

// Get all inquiries for a listing (owner/admin)
router.get('/listing/:listingId', getListingInquiries);

// Get inquiry details (buyer/owner/admin)
router.get('/:id', getInquiryDetails);

// Update inquiry status (owner/admin)
router.patch('/:id/status', updateInquiryStatus);

// Admin reply to an inquiry
router.post('/:id/reply', replyToInquiry);

// Buyer reply back to admin
router.post('/:id/buyer-reply', buyerReplyToInquiry);

export default router;

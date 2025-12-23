import { Router } from 'express';
import {
  createInquiry,
  getBuyerInquiries,
  getInquiryDetails,
  updateInquiryStatus,
  getListingInquiries
} from '../controllers/propertyInquiry.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create new inquiry (any authenticated user)
router.post('/', createInquiry);

// Get buyer's own inquiries
router.get('/', getBuyerInquiries);

// Get inquiry details (buyer/owner/admin)
router.get('/:id', getInquiryDetails);

// Update inquiry status (owner/admin)
router.patch('/:id/status', updateInquiryStatus);

// Get all inquiries for a listing (owner/admin)
router.get('/listing/:listingId', getListingInquiries);

export default router;

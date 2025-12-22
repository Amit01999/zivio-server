import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/listings', adminController.getListings);
router.get('/listings/:id', adminController.getListing);
router.patch('/listings/:id', adminController.updateListing);
router.post('/listings/:id/approve', adminController.approveListing);
router.post('/listings/:id/reject', adminController.rejectListing);
router.post('/listings/:id/toggle-featured', adminController.toggleFeatured);
router.delete('/listings/:id', adminController.deleteListing);
router.get('/brokers', adminController.getBrokers);
router.post('/brokers/:id/verify', adminController.verifyBroker);
router.get('/inquiries', adminController.getAllInquiries);

export default router;

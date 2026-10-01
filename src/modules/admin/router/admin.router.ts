import { Router } from 'express';
import { adminController } from '../controller/admin.controller';
import { authenticate, authorizeAdmin } from '../../../middleware/auth.middleware';

export const adminRouter = Router();

const guard = [authenticate, authorizeAdmin];

// History (harus didaftarkan SEBELUM /:id agar tidak konflik)
adminRouter.get('/orders/history', ...guard, adminController.getOrderHistory.bind(adminController));

import { dapurController } from '../../dapur/controller/dapur.controller';

import { upload } from '../../../middleware/upload.middleware';

adminRouter.get('/dapurs', ...guard, dapurController.getAll.bind(dapurController)); 
adminRouter.post('/dapurs', ...guard, dapurController.create.bind(dapurController)); 
adminRouter.patch('/dapurs/:id', ...guard, dapurController.update.bind(dapurController)); 
adminRouter.delete('/dapurs/:id', ...guard, dapurController.delete.bind(dapurController)); 
adminRouter.post('/dapurs/:id/logo', ...guard, upload.single('logo'), dapurController.uploadLogo.bind(dapurController)); 
adminRouter.get('/orders', ...guard, adminController.getOrders.bind(adminController));
adminRouter.post('/orders/scan/:displayId', ...guard, adminController.scanAndComplete.bind(adminController)); // scan barcode
adminRouter.get('/orders/:id', ...guard, adminController.getOrderById.bind(adminController));
adminRouter.post('/orders/:id/verify', ...guard, adminController.verifyPayment.bind(adminController));
adminRouter.patch('/orders/:id/status', ...guard, adminController.updateOrderStatus.bind(adminController)); // PATCH bukan PUT

// Booking Dine-In (path sama dengan Go: /bookings/dine-in)
adminRouter.get('/bookings/dine-in', ...guard, adminController.getDineInBookings.bind(adminController));

// Menu
adminRouter.get('/menu', ...guard, adminController.getAllMenu.bind(adminController));         // GET /admin/menu
adminRouter.post('/menu', ...guard, adminController.createMenuItem.bind(adminController));   // POST /admin/menu
adminRouter.patch('/menu/:id', ...guard, adminController.updateMenuItem.bind(adminController));   // PATCH (bukan PUT)
adminRouter.delete('/menu/:id', ...guard, adminController.deleteMenuItem.bind(adminController));
adminRouter.patch('/menu/:id/toggle-status', ...guard, adminController.toggleMenuStatus.bind(adminController)); // path sama dengan Go
adminRouter.post('/menu/:id/photo', ...guard, upload.single('photo'), adminController.uploadMenuPhoto.bind(adminController)); 

// Settings
adminRouter.get('/settings', ...guard, adminController.getSettings.bind(adminController));
adminRouter.post('/settings', ...guard, adminController.updateSettings.bind(adminController));


const express = require('express');
const path = require('path')
const rootDir=require('../utils/path');
const router = express.Router();
const adminData= require('./admin')
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/auth');

// router.get('/',shopController.indexPage);

router.get('/cart',isAuth,shopController.shopCart);
router.post('/cart',isAuth,shopController.postCart);
router.get('/orders',isAuth,shopController.getOrders);
// router.post('/create-order',isAuth,shopController.postOrder);
router.get('/products',shopController.shopProduct);
router.get('/products/:productID',shopController.getProduct);
router.get('/checkout',isAuth,shopController.getCheckout);
router.get('/checkout/success',isAuth,shopController.getCheckoutSuccess);
router.get('/checkout/cancel',shopController.getCheckout);
router.post('/delete-cart',isAuth,shopController?.postDeleteCart)
router.get('/invoice/:orderId' , isAuth,shopController.postInvoice)

module.exports = router;
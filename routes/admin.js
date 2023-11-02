const express = require('express');
const bodyParser = require('body-parser')
const rootDir=require('../utils/path')
const {body} = require('express-validator')

const router = express.Router();
router.use(bodyParser.urlencoded({extended:false}));
const path = require('path')
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/auth');

router.get('/edit-product/:productId',isAuth, adminController.getEditProduct);

router.post('/edit-product',
[
    body('title')
        .isString()
        .isLength({ min:3 })
        .trim(),
    body('price')
         .isFloat(),
    body('description')
         .isLength({min:8,max:400})
         .trim()
],
isAuth,adminController.postEditProduct)

router.get('/add-product',isAuth,adminController.getAddProduct)

router.get('/products',isAuth,adminController.getAdminProducts);

router.post('/add-product',
[
    body('title')
        .isString()
        .isLength({ min:3 })
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({min:8,max:400})
        .trim()
],
isAuth,adminController.postAddProduct)

router.delete('/product/:productId', isAuth,adminController.deleteProduct);


module.exports = router;


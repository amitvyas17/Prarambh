const express = require('express')
const authController = require('../controllers/auth');
const router = express.Router();
const User = require('../models/users')
const {check,body} = require('express-validator')
router.get('/login', authController.getLogin)
router.post('/login',
[
    body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
    body('password','Please enter a valid password')
    .isLength({min:5})
    .isAlphanumeric()
    .trim()
    
    
],
authController.postLogin)
router.post('/logout', authController.postLogout)
router.get('/signup' , authController.getSignup)
router.post('/signup' ,
[
    check('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
    .custom((value,{req})=>{
        // if(value==='test@test.com'){
        //     throw new Error('This email is forbidden')
        // }
        // return true;
        return User.findOne({email : value})
        .then(userData=>{
        if(userData){
            console.log('The user already exists')
           return Promise.reject('The user already exists!!!')
        }
    })
    }),
    body('password','Please enter a valid password of numbers and characters only and atleast 5 characters')
    .isLength({ min:5})
    .isAlphanumeric()
    .trim(),
    body('confirmPassword').trim().custom((value,{req})=>{
        if(value!==req.body.password){
            throw new Error('Password does not match!!!')
        }
        return true
})
    ],
     authController.postSignup)
router.get('/reset',authController.getReset)
router.post('/reset',authController.postReset)
router.get('/reset/:token',authController.getNewPassword)
router.post('/new-password',authController.postNewPassword)

module.exports = router;
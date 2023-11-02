const User = require('../models/users')
const bcrypt = require('bcryptjs')
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY || 'af5b221d7bbf9ddd24f466454640a5c5-5465e583-12518cd8'});
const crypto = require('crypto')
const {validationResult} = require('express-validator')

  

exports.getLogin = (req,res,next) =>{
    // const isLoggedIn = req.get('Cookie').split('=')[1]
    let error = req.flash('error')
    if(error.length>0){
        error= error[0]
    }
    else{
        error=null;
    }
    res.render('auth/login',{
        pageTitle: "Login",
        path: "/login",
        errorMessage:error,
        oldInput : {email :'' , password:''},
        validationErrors : []
    })
}


exports.postLogin = (req,res,next) =>{
    const email = req.body.email
    const password = req.body.password
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login',{
            pageTitle: "Login",
            path: "/login",
            errorMessage:errors.array()[0].msg,
            oldInput : {email :email , password:password},
            validationErrors : errors.array()
        })
    }
    User.findOne({email : email})
    .then(user=>{
        console.log('here is the user ' +user)
        if(!user){  
            console.log('There is no registered user')
            return res.status(422).render('auth/login',{
                pageTitle: "Login",
                path: "/login",
                errorMessage:errors.array()[0].msg,
                oldInput : {email :email , password:password},
                validationErrors : []
            })
        }
        if(password){
        bcrypt.compare(password,user.password)
        .then(doMatch=>{
            if(doMatch){
                req.session.isLoggedIn = true;
                req.session.user=user;
                return req.session.save((err)=>{
                    console.log(err)
                    res.redirect('/products')
                })
            }
            res.status(422).render('auth/login',{
                pageTitle: "Login",
                path: "/login",
                errorMessage:errors.array()[0].msg,
                oldInput : {email :email , password:password},
                validationErrors : []
            })
        })
    }
    else{
        res.status(422).render('auth/login',{
            pageTitle: "Login",
            path: "/login",
            errorMessage:errors.array()[0].msg,
            oldInput : {email :email , password:password},
            validationErrors : []
        })
    }
        
    })
    .catch(err=>{
        console.log(err)
    })
}

exports.getSignup = (req,res,next) =>{
    // const isLoggedIn = req.get('Cookie').split('=')[1]
    let error = req.flash('error')
    if(error.length>0){
        error= error[0]
    }
    else{
        error=null;
    }
    res.render('auth/signup',{
        pageTitle: "Signup",
        path: "/signup",
        errorMessage:error,
        oldInput:{email:'' , password:'',confirmPassword:''},
        validationErrors:[]

    })
}

exports.postSignup = (req,res,next) =>{
    console.log(req.body)
    const email = req.body.email
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        console.log(errors.array())
        return res.status(422).render('auth/signup',{
            pageTitle: "Signup",
            path: "/signup",
            errorMessage:errors.array()[0].msg,
            oldInput:{email:email , password:password,confirmPassword:confirmPassword},
            validationErrors:errors.array()
        })
    }
    
         bcrypt.hash(password,12)
        .then(hashedPassword=>{
            const user = new User({
                email:email,
                password:hashedPassword,
                cart:{
                    items:[]
                }
            })
            return user.save()
        })
      
        .then(user=>{
            console.log(user)
            console.log('The User has been created')
            res.redirect('/login')
            }) // logs response data
            .catch(err => console.log(err))
    
}
exports.postLogout = (req,res,next) =>{
    req.session.destroy(err=>{
        console.log(err)
        res.redirect('/products')
    })
}
exports.getReset = (req,res,next) => {
    let error = req.flash('error')
    if(error.length>0){
        error= error[0]
    }
    else{
        error=null;
    }
    res.render('auth/reset',{
        pageTitle: "Reset",
        path: "/reset",
        errorMessage:error
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');

        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    console.log('user not found....');
                    return res.render('auth/reset', {
                        pageTitle: 'Reset',
                        path: '/reset',
                        errorMessage: 'The user does not exist'
                    });
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(user => {
                if (user) {
                    mg.messages.create('sandboxc606985dc7f541c5875e2bad5d8be458.mailgun.org', {
                        from: 'Excited User <mailgun@sandbox-123.mailgun.org>',
                        to: [req.body.email],
                        subject: 'Password Reset',
                        text: 'Testing some Mailgun awesomeness!',
                        html: `
                            <p>You have requested a Password Reset!!!!</p>
                            <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a> to set a new Password</p>
                            <p>This link is valid only for an hour</p>
                        `
                    });
                    console.log(`Reset Link has been sent to ${req.body.email}`);
                    return res.redirect('/login');
                } else {
                    return res.render('auth/reset', {
                        pageTitle: 'Reset',
                        path: '/reset',
                        errorMessage: 'The user does not exist'
                    });
                }
            })
            .catch(error => {
                console.log(error);
                // Handle other errors if needed
            });
    });
};


exports.getNewPassword = (req,res,next)=>{
    const token = req.params.token;
    User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
        let error = req.flash('error')
        if(error.length>0){
            error= error[0]
        }
        else{
            error=null;
        }
        res.render('auth/new-password',{
            pageTitle: "New Password",
            path: "/new-password",
            errorMessage:error,
            userId:user._id.toString(),
            token:token
        })
    })
    .catch(err=>{
        console.log(err)
    })

    
}
exports.postNewPassword = (req,res,next) =>{
    const newPassword = req.body.newPassword
    const userId = req.body.userId
    const passwordToken = req.body.passwordToken
    let resetUser;
    User.findOne({resetToken:passwordToken,_id:userId,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
        resetUser=user;
        return  bcrypt.hash(newPassword,12)
    })
    .then(hashedPassword=>{
        resetUser.password=hashedPassword
        resetUser.resetToken=undefined
        resetUser.resetTokenExpiration=undefined
        resetUser.save()
    })
    .then(result=>{
        console.log('The password has been updated')
        res.redirect('/login')
    })
    .catch(err=>{
        console.log(err)
    })
}
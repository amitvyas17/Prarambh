const Product = require("../models/product");
const Order = require("../models/orders");
const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY)
// const { json } = require("body-parser");
const ITEMS_PER_PAGE = 1;

exports.shopProduct = (req, res) => {
  const page = +req.query.page || 1
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'product',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
exports.getProduct = (req, res) => {
  const productID = req.params.productID;

  Product.findById(productID)
    .then((product) => {
      console.log(product);
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
  }



// exports.indexPage = (req, res) => {
//   res.render("shop/index", {
//     pageTitle: "Welcome",
//     path: "/",
//   });
// };

exports.shopCart = (req, res) => {
    req.user
      .populate('cart.items.productId')
      .then((user) => {
      console.log(user.cart.items)
      const products = user.cart.items;
          res.render("shop/cart", {
            pageTitle: "Your Cart",
            path: "/cart",
            products: products,
          });
        })
        .catch((err) => {
          console.log(err);
          // res.redirect('/500')
          const error = new Error(err)
          error.httpStatusCode = 500
          return next(error)   // This will skip all the middleware and run the error middleware
        });
  }

exports.postCart = (req, res) => {

  const prodId = req.body.productId;
  Product.findById(prodId).then(product=>{
    return req.user.addToCart(product)
  })
  .then(result=>{
    // console.log(result)
    res.redirect('/cart')

  })
  .catch((err) => {
    console.log(err);
    // res.redirect('/500')
    const error = new Error(err)
    error.httpStatusCode = 500
    return next(error)   // This will skip all the middleware and run the error middleware
  });
}

exports.getCheckout = (req,res,next) =>{
  let products;
  let total=0;

  req.user
  .populate('cart.items.productId')
  .then((user) => {
   products = user.cart.items;
  products.forEach(p=>{
    total += p.quantity*p.productId.price;
  })
  return stripe.checkout.sessions.create({
    payment_method_types : ['card'],
    mode: 'payment',
    line_items: products.map(p=>{
      return{
        price_data: {
        currency: 'usd',
        product_data: {
          name: p.productId.title,
          description: p.productId.description,
        },
        unit_amount: p.productId.price * 100, // Amount in cents
      },
      quantity: p.quantity
    };
    }),
    success_url:req.protocol + '://' +req.get('host') + '/checkout/success',
    cancel_url:req.protocol + '://' +req.get('host') + '/checkout/cancel'
  })
  .then(session=>{
    res.render("shop/checkout", {
      pageTitle: "Checkout",
      path: "/checkut",
      products: products,
      totalSum:total,
      sessionId:session.id
    });
  })

   
    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });

}

exports.getCheckoutSuccess = (req,res,next)=>{
  req.user
  .populate('cart.items.productId')
  .then(user=>{
    const products = user.cart.items.map(i=>{
      return {quantity : i.quantity , product: {...i.productId._doc} }
    });
    const order= new Order({
      user : {
        email : req.user.email,
        userId : req.user
      },
      products:products
    })
    return order.save()
  })
    .then(result=>{
      req.user.clearCart()
      .then(result=>{
        console.log('Cart Cleared')
      })
      .catch((err) => {
        console.log(err);
        // res.redirect('/500')
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   // This will skip all the middleware and run the error middleware
      });
      res.redirect('/orders')
    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
}
exports.postDeleteCart = (req, res) => {
  const productId = req.body.productId;
  
  req.user
    .deleteItemFromCart(productId)
    .then(result=>{
      console.log(result+ ' Deleted Item from Cart')
      res.redirect("/cart");

    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
  }



exports.postOrder = (req, res) => {
  
  req.user
  .populate('cart.items.productId')
  .then(user=>{
    const products = user.cart.items.map(i=>{
      return {quantity : i.quantity , product: {...i.productId._doc} } // to save product id as a javascript object only
    });
    const order= new Order({
      user : {
        email : req.user.email,
        userId : req.user
      },
      products:products
    })
    return order.save()
  })
    .then(result=>{
      req.user.clearCart()
      .then(result=>{
        console.log('Cart Cleared')
      })
      .catch((err) => {
        console.log(err);
        // res.redirect('/500')
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   // This will skip all the middleware and run the error middleware
      });
      res.redirect('/products')
    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
};

exports.getOrders = (req, res) => {


 Order.find({'user.userId': req.session.user._id})
    .then((orders) => {
      // console.log('order is here '+orders)
      res.render("shop/orders", {
        pageTitle: "Your Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
};


exports.postInvoice = (req,res,next) =>{
  const orderId = req.params.orderId
  Order.findById(orderId)
  .then(order=>{
    if(!order){
      return next(new Error('No order found'))
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'))
    }
    const invoiceName = 'invoice-'+orderId+'.pdf'
    const invoicePath = path.join('data','invoices',invoiceName)
    
    const pdfDoc = new PDFDocument()
    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition','inline; filename="' +invoiceName +'"')
    pdfDoc.pipe(fs.createWriteStream(invoicePath))
    pdfDoc.pipe(res)

    pdfDoc.fontSize(26).text('Invoice',{
      underline:true
    })
    pdfDoc.text('----------------------')
    let totalPrice = 0;
    order.products.forEach(prod=>{
      totalPrice += prod.quantity*prod.product.price;
      pdfDoc.fontSize(14).text(`${prod.product.title} - ${prod.quantity} X $${prod.product.price}`)

    })
    pdfDoc.text('------')
    pdfDoc.fontSize(20).text('Total Price : $ '+ totalPrice)
    pdfDoc.end()
    // fs.readFile(invoicePath,(err,data)=>{
    //   if(err){
    //     return next(err)
    //   }
    // res.setHeader('Content-Type','application/pdf')
    // res.setHeader('Content-Disposition','inline; filename="' +invoiceName +'"')
    // // res.setHeader('Content-Disposition','attachment; filename="' +invoiceName +'"')
    // res.send(data)
    // })

    // const file = fs.createReadStream(invoicePath)
   
    // // res.setHeader('Content-Disposition','attachment; filename="' +invoiceName +'"')
    // file.pipe(res)
  })

}
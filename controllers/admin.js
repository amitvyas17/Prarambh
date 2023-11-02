const { default: mongoose } = require("mongoose");
const Product = require("../models/product");
const {validationResult} = require('express-validator')
const fileHelper = require('../utils/file');
const product = require("../models/product");

exports.getAddProduct = (req, res) => {
  const errors = validationResult(req)

  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError:false,
    errorMessage:null,  
    validationErrors:errors.array()
  });
};

exports.postAddProduct = (req, res,next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req)
   console.log(image)

  if(!image){
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError:true,
      product:{
        title:title,
        price:price,
        description:description
      },
      errorMessage : 'The file format is not supported',
      validationErrors:[]
    });
  }
    if(!errors.isEmpty()){
      return res.status(422).render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError:true,
        product:{
          title:title,
          price:price,
          description:description
        },
        errorMessage : errors.array()[0].msg,
        validationErrors:errors.array()
      });
    }

    const imageUrl = image.path;

    const product = new Product({
      title: title,
      price: price,
      description: description,
      imageUrl: imageUrl,
      userId:req.user
    });
    product
      .save()
      .then((result) => {
        // console.log(result)
        console.log('Product Saved')
        res.redirect("/products");
      })
      .catch((err) => {
        // console.log(err);
        // res.redirect('/500')
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   // This will skip all the middleware and run the error middleware
      });
  };

exports.getEditProduct = (req, res,next) => {
  const editMode = req.query.edit;
  const id = req.params.productId;

  if (!editMode) {
    return res.redirect("/");
  }
  // req.session.user.getProducts({where : {id:id}})
  // // Product.findByPk(id)
  Product.findById(id)

    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "",
        editing: editMode,
        product: product,
        hasError:false,
        errorMessage : null,
        validationErrors:[]

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

exports.postEditProduct = (req, res) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/add-product",
      editing: true,
      hasError:true,
      product:{
        title:updatedTitle,
        imageUrl:updatedImageUrl,
        price:updatedPrice,
        description:updatedDesc,
        _id:prodId
      },
      errorMessage : errors.array()[0].msg,
      validationErrors:errors.array()
    });
  }

    Product.findById(prodId)
    .then(product=>{
      if(product.userId.toString() !== req.user._id.toString()){
        console.log('This user is not allowed to edit it')
        return res.redirect('/products')
      }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDesc;
        if(image){
          fileHelper.deleteFile(product.imageUrl)
          product.imageUrl = image.path;

        }
        return product.save()
    })
    .then((result) => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      // console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
};


exports.getAdminProducts = (req, res) => {
  Product.find({userId:req.user._id})
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        

      });
    })
    .catch((err) => {
      // console.log(err);
      // res.redirect('/500')
      const error = new Error(err)
      error.httpStatusCode = 500
      return next(error)   // This will skip all the middleware and run the error middleware
    });
};

exports.deleteProduct = (req, res) => {
  const productId = req.params.productId;
  Product.findById(productId)
  .then(product=>{
    if(!product){
      return next(new Error('Product Not Found!'))
    }
    fileHelper.deleteFile(product.imageUrl)
    return Product.deleteOne({_id:productId,userId:req.user._id})
  })

  // Product.findByIdAndRemove(productId)
    .then(() => {
      console.log("Product Deleted");

      res.status(200).json({message:'Success!'})
    })
    .catch((err) => {
      // console.log(err);
      // res.redirect('/500')
      res.status(500).json({message : 'Deleting Product failed'})

    });
};

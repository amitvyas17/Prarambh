exports.get404 = (req,res)=>{
    res.status(404).render('404',{pageTitle:'Page Not Found',path:''})
  }

exports.get500 = (req,res)=>{
    res.status(500).render('500',{pageTitle:'Problem',path:''})
  }
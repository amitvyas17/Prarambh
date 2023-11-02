const fs = require('fs')

const functionHandler =(req,res) =>{
const url = req.url;
const method = req.method;
if(url==='/'){
    res.write('<html>');
    res.write('<head><title>Enter Message</title></head>');
    res.write('<body><form action="/message" method ="POST"><input type="text" name="Message"><button type="submit">Send</button></form></body>');
    res.write('</html>');
    return res.end();
}
if(url==="/message" && method==="POST"){
    const body =[];
     req.on('data',(chunk)=>{
        console.log(chunk)
        body.push(chunk)
    })
     return req.on('end', ()=>{
        const parsedBody = Buffer.concat(body).toString();
        console.log(parsedBody);
        const message = parsedBody.split('=')[1];
        console.log(message);
        fs.writeFile('message.txt' , message , (err)=>{
            res.statusCode=302;
            res.setHeader('Location' ,'/');
            return res.end();
        });
    
    })

}
res.write('<html>');
res.write('<head><title>You are at message page</title></head>');
res.write('<body><h1>Welcome to this page</h1></body>');
res.write('</html>');
return res.end();
}


module.exports ={
    handler : functionHandler
}
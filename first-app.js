const fetchData =() =>{
    const promise =  new Promise((resolve,reject) =>{
        setTimeout(() => {
            resolve('done')
        }, 2000);
    })
    return promise;
}

setTimeout(() => {
    console.log("Timer is not done")
    fetchData()
    .then(text=>{
        console.log(text)
        return fetchData()
    })
    .then(text2=>{
        console.log(text2)
    })
}, 3000);
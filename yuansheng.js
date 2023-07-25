let p1 = new Promise(resolve => {
    resolve()
})
let p2 = p1.then(data => {
    return p2
}).then(res => {
    console.log(res, 'res')
})
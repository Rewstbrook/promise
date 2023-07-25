// https://promisesaplus.com/
// https://www.ituring.com.cn/article/66566
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
function isFunction(func) {
    return Object.prototype.toString.call(func).toLowerCase() === "[object function]";
}
function isObject(obj) {
    return Object.prototype.toString.call(obj).toLowerCase() === "[object object]";
}
class Container {
    constructor(executor) {
        this.status = PENDING;  // 初始状态
        this.value = null;      // promise成功的值
        this.reason = null;     // promise失败原因
        this.onResolvedCallbacks = [];  // then->resolve时的回调函数集合，在promise成功之前可能会有多个resolve
        this.onRejectedCallbacks = [];  // then->rejected时的回调函数集合，在promise成功之前可能会有多个rejected
        let resolve = (data) => {
            setTimeout(() => {
                if (this.status === PENDING) {
                    this.status = FULFILLED;
                    this.value = data;
                    while (this.onResolvedCallbacks.length > 0) {
                        this.onResolvedCallbacks.shift()(data);
                    }
                }
            })
        }
        let reject = (reason) => {
            setTimeout(() => {
                if (this.status === PENDING) {
                    this.status = REJECTED;
                    this.reason = reason;
                    while (this.onRejectedCallbacks.length > 0) {
                        this.onRejectedCallbacks.shift()(reason);
                    }
                }
            })
        }
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }
    then (onResolved, onRejected) {
        onResolved = isFunction(onResolved) ? onResolved : function (data) {return data};
        onRejected = isFunction(onRejected) ? onRejected : function (error) {throw error};
        let promise2 = new Container((resolve, reject) => {
            switch (this.status) {
                case PENDING:
                    this.onResolvedCallbacks.push(() => {
                        setTimeout(() => {
                            try {
                                let x = onResolved(this.value);
                                resolvePromise(promise2, x, resolve, reject);
                            } catch (error) {
                                reject(error)
                            }
                        })
                    })
                    this.onRejectedCallbacks.push(() => {
                        setTimeout(() => {
                            try {
                                let x = onRejected(this.reason);
                                resolvePromise(promise2, x, resolve, reject);
                            } catch (error) {
                                reject(error);
                            }
                        })
                    })
                    break;
                case FULFILLED:
                    setTimeout(() => {
                        try {
                            let x = onResolved(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error)
                        }
                    })
                    break;
                case REJECTED:
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    break;
                default: break;
            }
        })
        return promise2;
    }
    static any(promiseList) {
        return new Container((resolve, reject) => {
            if (Array.isArray(promiseList)) {
                let count = 0
                let errors = [];
                console.log(promiseList)
                if (promiseList.length === 0) {
                    console.log(11)
                    return reject('sssss');
                }
                promiseList.forEach((item, index) => {
                    item.then(
                        value => {
                            resolve(value);
                        },
                        reason => {
                            count++;
                            errors.push(reason);
                            count == promiseList.length && reject(new AggregateError(errors));
                        }
                    )
                })
            } else {
                console.log(22)
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }
}
// function resolvePromise(promise2, x, resolve, reject) {
//     if (x === promise2) {
//         return reject(new TypeError('Chaining cycle detected for promise'));
//     }
//     let called;
//     if (x != null && (isObject(x) || isFunction(x))) {
//         try {
//             let then = x.then;
//             if (isFunction(then)) {
//                 then.call(x, (data) => {
//                     if (called) return;
//                     called = true;
//                     resolvePromise(promise2, data, resolve, reject)
//                 }, (error) => {
//                     if (called) return;
//                     called = true;
//                     reject(error);
//                 })
//             } else {
//                 resolve(x);
//             }
//         } catch (error) {
//             if (called) return;
//             called = true;
//             reject(error);
//         }
//     } else {
//         resolve(x);
//     }
// }
const resolvePromise = (promise2, x, resolve, reject) => {
    // 自己等待自己完成是错误的实现，用一个类型错误，结束掉 promise  Promise/A+ 2.3.1
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }
    // Promise/A+ 2.3.3.3.3 只能调用一次
    let called;
    // 后续的条件要严格判断 保证代码能和别的库一起使用
    if ((typeof x === 'object' && x != null) || typeof x === 'function') {
        try {
            // 为了判断 resolve 过的就不用再 reject 了（比如 reject 和 resolve 同时调用的时候）  Promise/A+ 2.3.3.1
            let then = x.then;
            if (typeof then === 'function') {
                // 不要写成 x.then，直接 then.call 就可以了 因为 x.then 会再次取值，Object.defineProperty  Promise/A+ 2.3.3.3
                then.call(x, y => { // 根据 promise 的状态决定是成功还是失败
                    if (called) return;
                    called = true;
                    // 递归解析的过程（因为可能 promise 中还有 promise） Promise/A+ 2.3.3.3.1
                    resolvePromise(promise2, y, resolve, reject);
                }, r => {
                    // 只要失败就失败 Promise/A+ 2.3.3.3.2
                    if (called) return;
                    called = true;
                    reject(r);
                });
            } else {
                // 如果 x.then 是个普通值就直接返回 resolve 作为结果  Promise/A+ 2.3.3.4
                resolve(x);
            }
        } catch (e) {
            // Promise/A+ 2.3.3.2
            if (called) return;
            called = true;
            reject(e)
        }
    } else {
        // 如果 x 是个普通值就直接返回 resolve 作为结果  Promise/A+ 2.3.4  
        resolve(x)
    }
}
Container.any([]).then((value) => console.log(value));
Container.deferred = Container.defer = function () {
    let dfd = {};
    dfd.promise = new Container((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
module.exports = Container;
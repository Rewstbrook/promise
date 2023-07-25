const PENDING = "pendding";         // 初始状态
const FULFILLED = "fulfilled";      // 成功状态，不一定是成功，只是当前这个promise执行成功了
const REJECTED = "rejected";        // 失败状态
function isFunction(data) {
    return Object.prototype.toString.call(data).toLowerCase() === "[object function]";
}
function isObject(data) {
    return Object.prototype.toString.call(data).toLowerCase() === "[object object]";
}
function isPromise(val) {
    return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
function isArray(data) {
    return Object.prototype.toString.call(data).toLowerCase() === "[object array]";
}
class myPromise {
    static PENDING = 'pending';
    static FULFILLED = 'fulfilled';
    static REJECTED = 'rejected';
    constructor(func) {
        this.PromiseState = myPromise.PENDING;
        this.PromiseResult = null;
        this.onFulfilledCallbacks = []; // 保存成功回调
        this.onRejectedCallbacks = []; // 保存失败回调
        try {
            func(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
            this.reject(error)
        }
    }
    resolve(result) {
        if (this.PromiseState === myPromise.PENDING) {
            this.PromiseState = myPromise.FULFILLED;
            this.PromiseResult = result;
            this.onFulfilledCallbacks.forEach(callback => {
                callback(result)
            })
        }
    }
    reject(reason) {
        if (this.PromiseState === myPromise.PENDING) {
            this.PromiseState = myPromise.REJECTED;
            this.PromiseResult = reason;
            this.onRejectedCallbacks.forEach(callback => {
                callback(reason)
            })
        }
    }
    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
        onRejected = typeof onRejected === 'function' ? onRejected : reason => {
            throw reason;
        };
        const promise2 = new myPromise((resolve, reject) => {
            if (this.PromiseState === myPromise.PENDING) {
                this.onFulfilledCallbacks.push(() => {
                    // 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行 Promise 解决过程：[[Resolve]](promise2, x)
                    // 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
                this.onRejectedCallbacks.push(() => {
                    // 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行 Promise 解决过程：[[Resolve]](promise2, x)
                    // 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.PromiseResult);
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (e) {
                            reject(e);
                        }
                    });
                });
            }
            if (this.PromiseState === myPromise.FULFILLED) {
                // 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行 Promise 解决过程：[[Resolve]](promise2, x)
                // 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.PromiseResult);
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e);
                    }
                });
            }
            if (this.PromiseState === myPromise.REJECTED) {
                // 如果 onFulfilled 或者 onRejected 返回一个值 x ，则运行 Promise 解决过程：[[Resolve]](promise2, x)
                // 如果 onFulfilled 或者 onRejected 抛出一个异常 e ，则 promise2 必须拒绝执行，并返回拒因 e
                setTimeout(() => {
                    try {
                        let x = onRejected(this.PromiseResult);
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        })
        return promise2;
    }
    /**
     * catch方法内部实际上是调用的then，只是没有resolve方法
     */
    catch(error) {
        return this.then(undefined, this.reject(error))
    }
    /**
     * finally方法是无论promise执行成功或者失败都会去调用的方法，只需要给一个回掉函数
     */
    finally(callback) {
        return this.then(callback, callback)
    }
    /**
     * @description
     *  1、如果这个值是一个promise，那就返回这个promise
     *  2、如果这个值是thenable（即带有"then" 方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态；
     *  3、否则就以这个value直接返回，状态为完成
     * @param {*} value 
     */
    static resolve(value) {
        // 鸭子类型
        if (value instanceof myPromise) {
            return value;
        } else if (value instanceof Object && 'then' in value) {
            return new myPromise((resolve, reject) => {
                value.then(resolve, reject);
            })
        }
        return new myPromise((resolve) => {
            resolve(value);
        })
        // // 如果这个值是一个 promise ，那么将返回这个 promise 
        // if (value instanceof myPromise) {
        //     return value;
        // } else if (value instanceof Object && 'then' in value) {
        //     // 如果这个值是thenable（即带有`"then" `方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态；
        //     return new myPromise((resolve, reject) => {
        //         value.then(resolve, reject);
        //     })
        // }

        // 否则返回的promise将以此值完成，即以此值执行`resolve()`方法 (状态为fulfilled)
        return new myPromise((resolve) => {
            resolve(value)
        })
    }
    static reject(value) {
        return new myPromise((resolve, reject) => {
            reject(value)
        })
    }
    /**
     *   1、Promise.all 等待所有都完成（或第一个失败）
     *   2、如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
     *   3、如果参数中包含非 promise 值，这些值将被忽略，但仍然会被放在返回数组中，如果 promise 完成的话 (也就是如果参数里的某值不是Promise，则需要原样返回在数组里)
     *   4、在任何情况下，Promise.all 返回的 promise 的完成状态的结果都是一个数组，它包含所有的传入迭代参数对象的值（也包括非 promise 值）。
     *   5、如果传入的 promise 中有一个失败（rejected），Promise.all 异步地将失败的那个结果给失败状态的回调函数，而不管其它 promise 是否完成
     */
    static all(promiseList) {
        return new myPromise((resolve, reject) => {
            console.log(Array.isArray(promiseList))
            if (isArray(promiseList)) {
                let result = []; // 存储结果
                let count = 0; // 计数器

                // 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
                if (promiseList.length === 0) {
                    return reject(promiseList);
                }
                promiseList.forEach((item, index) => {
                    myPromise.resolve(item).then(
                        value => {
                            count++;
                            // 每个promise执行的结果存储在result中
                            result[index] = value;
                            // Promise.all 等待所有都完成（或第一个失败）
                            count === promiseList.length && resolve(result);
                        },
                        reason => {
                            /**
                             * 如果传入的 promise 中有一个失败（rejected），
                             * Promise.all 异步地将失败的那个结果给失败状态的回调函数，而不管其它 promise 是否完成
                             */
                            reject(reason);
                        }
                    )
                })
            } else {
                console.log('fal')
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }
    /**
     *  本质上，这个方法和Promise.all()是相反的。
     *   Promise.any() 接收一个Promise可迭代对象，只要其中的一个 promise 成功，就返回那个已经成功的 promise 。
     *   如果可迭代对象中没有一个 promise 成功（即所有的 promises 都失败/拒绝），就返回一个失败的 promise 和AggregateError类型的实例，
     *   它是 Error 的一个子类，用于把单一的错误集合在一起。
     *       1、如果传入的参数是一个空的可迭代对象，则返回一个 已失败（already rejected） 状态的 Promise。
     *       2、如果传入的参数不包含任何 promise，则返回一个 异步完成 （asynchronously resolved）的 Promise。(即将非Promise值，转换为Promise并当做成功)
     *       3、只要传入的迭代对象中的任何一个 promise 变成成功（resolve）状态，或者其中的所有的 promises 都失败，
     *          那么返回的 promise 就会 异步地（当调用栈为空时） 变成成功/失败（resolved/reject）状态。(如果所有Promise都失败，则报错)
     */
    static any(promiseList) {
        return new myPromise((resolve, reject) => {
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
    /**
     *  Promise.allSettled(iterable)方法返回一个在所有给定的promise都已经fulfilled或rejected后的promise，并带有一个对象数组，每个对象表示对应的promise结果。
        1、当你有多个彼此不依赖的异步任务成功完成时，或者你总是想知道每个promise的结果时，通常使用它。
        2、相比之下，Promise.all() 更适合彼此相互依赖或者在其中任何一个reject时立即结束。
        对于每个结果对象，都有一个 status 字符串。如果它的值为 fulfilled，则结果对象上存在一个 value 。如果值为 rejected，
        则存在一个 reason 。value（或 reason ）反映了每个 promise 决议（或拒绝）的值。
     */
    static allSettled(promiseList) {
        return new myPromise((resolve, reject) => {
            if (Array.isArray(promiseList)) {
                let result = [];
                let count = 0;
                if (promiseList.length == 0) {
                    return resolve(promiseList);
                }
                promiseList.forEach((item, index) => {
                    myPromise.resolve(item).then(
                        value => {
                            count++;
                            result[index] = {
                                status: FULFILLED,
                                value
                            }
                            count == promiseList.length && resolve(result);
                        },
                        reason => {
                            count++;
                            result[index] = {
                                status: REJECTED,
                                reason
                            }
                            count == promiseList.length && resolve(result);
                        }
                    )
                })
            } else {
                return reject(new TypeError('Argument is not iterable'))
            }
        })
    }
}
/**
+ * 对resolve()、reject() 进行改造增强 针对resolve()和reject()中不同值情况 进行处理
+ * [[Resolve]](promise2, x);
+ * @param  {promise} promise2 promise1.then方法返回的新的promise对象
+ * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值
+ * @param  {[type]} resolve   promise2的resolve方法
+ * @param  {[type]} reject    promise2的reject方法
+ */
function resolvePromise(promise2, x, resolve, reject) {
    let then;
    // 如果promise和x是同一对象，那就是typeError，拒绝执行promise
    // 感觉可以理解成是自己等待自己完成
    if (x === promise2) {
        throw new TypeError('Chaining cycle detected for promise');
    }
    if (x !== null && ((typeof x === 'object' || (typeof x === 'function')))) {
        try {
            then = x.then;
        } catch (e) {
            return reject(e);
        }
        /**
        * 2.3.3.3 
        * 如果 then 是函数，将 x 作为函数的作用域 this 调用之。
        * 传递两个回调函数作为参数，
        * 第一个参数叫做 `resolvePromise` ，第二个参数叫做 `rejectPromise`
        */
        if (typeof then === 'function') {
            // 2.3.3.3.3 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            let called = false; // 避免多次调用
            try {
                then.call(
                    x,
                    y => {
                        if (called) return;
                        called = true;
                        resolvePromise(promise2, y, resolve, reject);
                    },
                    r => {
                        if (called) return;
                        called = true;
                        reject(r);
                    }
                )
            } catch (e) {
                /**
                * 2.3.3.3.4 如果调用 then 方法抛出了异常 e
                * 2.3.3.3.4.1 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
                */
                if (called) return;
                called = true;
                reject(e);
            }
        } else {
            resolve(x);
        }
    } else {
        // 如果x不为对象或者参数，那就直接以x为参数直接执行promise
        return resolve(x);
    }
}



// const promise1 = Promise.reject(0);
const promise2 = new Promise((resolve) => setTimeout(resolve, 100, 'quick'));
const promise3 = new Promise((resolve) => setTimeout(resolve, 500, 'slow'));

// const promises = [promise1, promise2, promise3];

// myPromise.any([]).then((value) => console.log(value));
myPromise.all([]).then(e => {
    console.log(e);
}).catch(e => {
    console.log(e)
});

// const pErr = new Promise((resolve, reject) => {
//     reject("总是失败");
// });

// const pSlow = new Promise((resolve, reject) => {
//     setTimeout(resolve, 500, "最终完成");
// });

// const pFast = new Promise((resolve, reject) => {
//     setTimeout(resolve, 100, "很快完成");
// });

// Promise.any([pErr, pSlow, pFast]).then((value) => {
//     console.log(value);
//     // 期望输出: "很快完成"
// })
// const pErr1 = new myPromise((resolve, reject) => {
//     reject("总是失败");
// });

// const pErr2 = new myPromise((resolve, reject) => {
//     reject("总是失败");
// });

// const pErr3 = new myPromise((resolve, reject) => {
//     reject("总是失败");
// });

// myPromise.any([pErr1, pErr2, pErr3]).catch(e => {
//     console.log(e);
// })


// myPromise.deferred = function () {
//     let result = {};
//     result.promise = new myPromise((resolve, reject) => {
//         result.resolve = resolve;
//         result.reject = reject;
//     });
//     return result;
// }

// module.exports = myPromise;
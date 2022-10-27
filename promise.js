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
    static resolve = (data) => {
        if (this.status === PENDING) {
            this.status = FULFILLED;
            this.value = data;
            while (this.onResolvedCallbacks.length > 0) {
                this.onResolvedCallbacks.shift()(data);
            }
        }
    }
    static reject = (reason) => {
        if (this.status === FULFILLED) {
            this.status = FULFILLED;
            this.reason = reason;
            while (this.onRejectedCallbacks.length > 0) {
                this.onRejectedCallbacks.shift()(reason);
            }
        }
    }
    constructor(executor) {
        this.status = PENDING;  // 初始状态
        this.value = null;      // promise成功的值
        this.reason = null;     // promise失败原因
        this.onResolvedCallbacks = [];  // then->resolve时的回调函数集合，在promise成功之前可能会有多个resolve
        this.onRejectedCallbacks = [];  // then->rejected时的回调函数集合，在promise成功之前可能会有多个rejected
        try {
            executor(this.resolve, this.reject);
        } catch (error) {
            this.reject(error);
        }
    }
    then (onResolved, onRejected) {
        onResolved = isFunction(onResolved) ? onResolved : (data) => data;
        onRejected = isFunction(onRejected) ? onRejected : err => {throw err};
        let promise2 = new Container((resolve, reject) => {
            switch (this.status) {
                case PENDING:
                    this.onResolvedCallbacks.push(() => {
                        let x = onResolved(this.value);
                        if (x instanceof Container) {
                            x.then(this.value);
                        }
                        resolve(x);
                    })
                    this.onRejectedCallbacks.push(() => {
                        let x = onRejected(this.reason);
                        if (x instanceof Container) {
                            x.then(this.reason);
                        }
                        reject(x);
                    })
                    break;
                case FULFILLED:
                    this.onResolvedCallbacks.push(() => {
                        let x = onResolved(this.value);
                        if (x instanceof Container) {
                            x.then(this.value);
                        }
                        resolve(x);
                    })
                    break;
                case REJECTED:
                    this.onRejectedCallbacks.push(() => {
                        let x = onRejected(this.reason);
                        if (x instanceof Container) {
                            x.then(this.reason);
                        }
                        reject(x);
                    })
                    break;
                default: break;
            }
        })
        return promise2;
    }
}
Container.defer = function () {
    let dfd = {};
    dfd.promise = new Container((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
module.exports = Container;
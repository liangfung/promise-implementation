/**
 * author: liangfung
 */
const isFunction = obj => typeof obj === 'function'
const isPromise = obj => obj instanceof Promise

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function Promise(resolver) {
  this.value = null
  this.state = PENDING
  this.handlers = []

  const deQueue = () => {
    let handler = this.handlers.shift()
    return handler
  }

  const resolve = (val) => {
    if (this.state === PENDING) {
      this.state = FULFILLED
      this.value = val
      // 异步执行
      setTimeout(() => {
        // console.log(this.handlers)
        while (this.handlers.length) {
          let queueItem = deQueue()
          if (queueItem) {
            let { onFulfilled, onRejected, resolve } = queueItem
            if (val === this) {
              throw new Error('promise不能promise自己')
            }
            if (isPromise(val)) {
              return val.then(onFulfilled, onRejected)
            }
            if (isFunction(onFulfilled)) {
              var result = onFulfilled(this.value)
              resolve(result)
            }
          }
        }
      }, 0)
    }
  }

  const reject = (reason) => {
    if (this.state === PENDING) {
      this.state = REJECTED
      this.value = reason
      setTimeout(() => {
        while (this.handlers.length) {
          let { onRejected } = deQueue()
          if (!isFunction(onRejected)) {
            throw new Error('uncaugth promise error')
          } else {
            onRejected(this.value)
          }
        }
      }, 0)

    }
  }

  try {
    // 执行回调
    resolver(resolve, reject)
  } catch (e) {
    reject(e)
  }

  // 目前存在的问题
  // 1. 怎么变为 mircotask  --- 暂时用settimeout
  // 2. then怎么返回新的promise  --- new Promise
  //   2.1 promise需要传一个resolver，then返回的新的resolver怎么写
  //   2.2 then里面的resolve怎么触发 --- then函数里面，注册到promise1的handlers queue

}

/**
 * @param {any} onFulfilled
 * @param {any} onRejected
 * @returns {Promise} promise
 */
Promise.prototype.then = function (onFulfilled, onRejected) {
  // then返回一个新的promise
  // then接受两个参数
  // then的onFulfilled是函数的话，在promise的状态变为fulfilled的时候就要调用onFulfilled
  // then的onRejected是函数的话，在promsie的状态变为rejected的时候就要调用onRejected
  return new Promise((resolve, reject) => {
    if (this.state === PENDING) {
      this.handlers.push({ onFulfilled, onRejected, resolve, reject })
    }
    if (this.state === FULFILLED) {
      onFulfilled(this.value)
    }
    if (this.state === REJECTED) {
      onRejected(this.value)
    }
  })
}

Promise.prototype.catch = function (onRejected) {
  this.then(null, onRejected)
}

var a = new Promise((resolve, reject) => {
  console.log(1)
  setTimeout(() => { resolve('hehe'); }, 1000)
})
  .then(val => { console.log('1then', val); return 888 })
  .then(val => { console.log('2then', val); return 66 })
  .then(() => {
    return new Promise(resolve => setTimeout(() => resolve(666), 3000))
  })


setTimeout(function(){
  a.then(val=>console.log('vvval'))
},2000)
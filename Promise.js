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
      // 异步执行
      setTimeout(() => {
        this.state = FULFILLED
        this.value = val
        while (this.handlers.length) {
          let queueItem = deQueue()
          if (queueItem) {
            let { onFulfilled, resolve, reject } = queueItem
            try {
              isFunction(onFulfilled) ? resolve(onFulfilled(val)) : resolve(val)
            } catch (e) {
              reject(e)
            }
          }
        }
      }, 0)
    }
  }

  const reject = (reason) => {
    if (this.state === PENDING) {
      setTimeout(() => {
        this.state = REJECTED
        this.value = reason
        while (this.handlers.length) {
          let { onRejected, resolve, reject } = deQueue()
          try {
            isFunction(onRejected) ? resolve(onRejected(reason)) : reject(reason)
          } catch (error) {
            reject(error)
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

}

/**
 * @param {any} onFulfilled
 * @param {any} onRejected
 * @returns {Promise} promise
 */
Promise.prototype.then = function (onFulfilled, onRejected) {
  return new Promise((resolve, reject) => {
    if (this.state === PENDING) {
      this.handlers.push({ onFulfilled, onRejected, resolve, reject })
    }
    try {
      if (this.state === FULFILLED) {
        onFulfilled(this.value)
      }
      if (this.state === REJECTED) {
        onRejected(this.value)
      }
    } catch (e) {
      reject(e)
    }
  })
}

Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

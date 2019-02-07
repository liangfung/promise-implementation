/**
 * author: liangfung
 */
const isFunction = obj => typeof obj === 'function'
const isPromise = obj => obj instanceof Promise

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

const fire = (promise, state, value) => {
  const deQueue = () => {
    let handler = promise.handlers.shift()
    return handler
  }
  setTimeout(() => {
    promise.state = state
    promise.value = value
    while (promise.handlers.length) {
      let queueItem = deQueue()
      if (queueItem) {
        let { onFulfilled, onRejected, resolve, reject } = queueItem
        try {
          if (state === FULFILLED) {
            isFunction(onFulfilled) ? resolve(onFulfilled(value)) : resolve(value)
          } else if (state === REJECTED) {
            isFunction(onRejected) ? resolve(onRejected(value)) : reject(value)
          }
        } catch (error) {
          reject(error)
        }
      }
    }
  }, 0)

}

const resolutionProcedure = (promise, value, onFulfilled, onRejected) => {
  if (promise === value) {
    let reason = new TypeError('same promise')
    return onRejected(reason)
  }
  if (isPromise(value)) {
    return value.then(onFulfilled, onRejected)
  }
  onFulfilled(value)
}

function Promise(resolver) {
  this.value = null
  this.state = PENDING
  this.handlers = []

  const onFulfilled = val => fire(this, FULFILLED, val)
  const onRejected = val => fire(this, REJECTED, val)

  const resolve = (val) => {
    if (this.state === PENDING) {
      // 异步执行
      resolutionProcedure(this, val, onFulfilled, onRejected)
    }
  }

  const reject = (reason) => {
    if (this.state === PENDING) {
      onRejected(reason)
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



var a = new Promise((resolve, reject) => {
  console.log(1)
  setTimeout(() => { resolve('hehe') }, 1000)
})
  .then(val => { console.log('1then', val); return 888 })
  .then(() => {
    return new Promise(resolve => {
      setTimeout(() => resolve(668), 0)
    })
  })
  .then(() => { throw new Error('aaaaa') })
  .then(val => { console.log('last val', val); return val + 20 })
  .catch(e => console.log(e.message))


setTimeout(function () {
  a.then(val => console.log('------vvval', val))
}, 4000)
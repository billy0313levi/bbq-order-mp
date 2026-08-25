/**
 * 云服务数据访问层（USE_CLOUD=true 时使用）
 * 通过 uniCloud.callFunction 调用云函数，返回 { code, data, msg }
 */
function call(name, data) {
  return uniCloud.callFunction({ name, data }).then((res) => {
    const result = res && res.result
    if (result && typeof result.code === 'number') {
      return result
    }
    return { code: -1, data: null, msg: '云函数返回异常' }
  })
}

/**
 * 调用云对象 tableQrManager 的方法
 */
function callTableQrManager(method, ...args) {
  const obj = uniCloud.importObject('tableQrManager')
  return obj[method](...args).catch((e) => {
    return { code: -1, data: null, msg: (e && e.message) || '云对象调用异常' }
  })
}

export function getCategories() {
  return call('getCategoryList')
}

export function getGoods() {
  return call('getGoods')
}

export function getGoodsByCategory(categoryId) {
  return call('getGoodsByCategory', { categoryId })
}

export function bindTable(tableId) {
  return call('getTableInfo', { tableId })
}

export function createOrder({ tableId, goodsList, totalPrice, remark }) {
  return call('createOrder', { tableId, goodsList, totalPrice, remark })
}

export function getOrderList(status) {
  return call('getOrderList', { status })
}

export function updateOrderStatus({ orderId, orderNo, status }) {
  return call('updateOrderStatus', { orderId, orderNo, status })
}

// ====== 优惠券 ======

export function getCoupons(status) {
  return call('getCoupons', { status })
}

export function getCouponCount() {
  return call('getCouponCount')
}

export function getAvailableCoupons(orderAmount) {
  return call('getAvailableCoupons', { orderAmount })
}

export function useCoupon(couponId) {
  return call('useCoupon', { couponId })
}

// ====== 桌号管理（云对象） ======

export function generateTableQrcode(tableNo, capacity = 4) {
  return callTableQrManager('generate', tableNo, capacity)
}

export function batchGenerateTableQrcode(list) {
  return callTableQrManager('batchGenerate', list)
}

export function getTableList(params = {}) {
  return callTableQrManager('list', params)
}

export function removeTable(id) {
  return callTableQrManager('remove', id)
}

export function batchRemoveTable(ids) {
  return callTableQrManager('batchRemove', ids)
}

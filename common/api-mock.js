/**
 * 本地模拟数据访问层（USE_CLOUD=false 时使用）
 * 数据基于 mock/data.js 初始化，通过 uni.storage 持久化，
 * 接口签名与 api-cloud.js 完全一致（返回 { code, data, msg }），
 * 页面无需关心数据来源。
 */
import { categories, goods, tables, orders, coupons } from './mock/data.js'

const ORDERS_KEY = 'mock_orders'
const TABLES_KEY = 'mock_tables'
const COUPONS_KEY = 'mock_coupons'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getStorage(key, fallback) {
  const value = uni.getStorageSync(key)
  return value ? value : fallback
}

function setStorage(key, value) {
  uni.setStorageSync(key, value)
}

function initData() {
  if (!uni.getStorageSync(ORDERS_KEY)) {
    setStorage(ORDERS_KEY, orders)
  }
  if (!uni.getStorageSync(TABLES_KEY)) {
    setStorage(TABLES_KEY, tables)
  }
  if (!uni.getStorageSync(COUPONS_KEY)) {
    setStorage(COUPONS_KEY, coupons)
  }
}

function ok(data) {
  return { code: 0, data, msg: 'ok' }
}

function fail(msg) {
  return { code: -1, data: null, msg }
}

function buildOrderNo() {
  const now = new Date()
  const pad = (n, len) => String(n).padStart(len, '0')
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}`
  const rand = pad(Math.floor(Math.random() * 10000), 4)
  return `TX${ts}${rand}`
}

function formatDateTime(d) {
  const pad = (n, len) => String(n).padStart(len, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}`
}

function toTs(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  const d = new Date(String(value).replace(/-/g, '/'))
  if (isNaN(d.getTime())) return 0
  return d.getTime()
}

export async function getCategories() {
  await delay()
  const list = categories
    .filter((item) => item.status === 1)
    .sort((a, b) => a.sort - b.sort)
  return ok(list)
}

export async function getGoods() {
  await delay()
  const list = goods
    .filter((item) => item.status === 1)
    .sort((a, b) => a.sort - b.sort)
  return ok(list)
}

export async function getGoodsByCategory(categoryId) {
  await delay()
  let list = goods.filter((item) => item.status === 1)
  if (categoryId && categoryId !== 'cat_rec') {
    list = list.filter((item) => item.category_id === categoryId)
  }
  list = list.sort((a, b) => a.sort - b.sort)
  return ok(list)
}

export async function bindTable(tableId) {
  await delay()
  initData()
  const tableList = getStorage(TABLES_KEY, tables)
  const table = tableList.find((item) => item.tableNo === tableId)
  if (!table) {
    return fail('桌台不存在')
  }
  return ok(table)
}

export async function createOrder({ tableId, goodsList, totalPrice, remark, orderType, address }) {
  await delay()
  if (!Array.isArray(goodsList) || goodsList.length === 0) {
    return fail('参数不完整')
  }
  const type = orderType === 'takeout' ? 'takeout' : 'dine'
  if (type === 'dine' && !tableId) {
    return fail('请先扫码绑定桌台')
  }
  initData()
  const orderNo = buildOrderNo()
  const now = formatDateTime(new Date())
  const order = {
    _id: `order_${orderNo}`,
    orderNo,
    tableNo: type === 'dine' ? tableId : '',
    orderType: type,
    address: type === 'takeout' ? (address || '') : '',
    goodsList,
    totalPrice: Number(totalPrice) || 0,
    remark: remark || '',
    status: 2,
    createTime: now,
    updateTime: now
  }

  const orderList = getStorage(ORDERS_KEY, orders)
  orderList.unshift(order)
  setStorage(ORDERS_KEY, orderList)

  if (type === 'dine' && tableId) {
    const tableList = getStorage(TABLES_KEY, tables)
    const target = tableList.find((item) => item.tableNo === tableId)
    if (target) {
      target.status = 1
      setStorage(TABLES_KEY, tableList)
    }
  }

  return ok({ orderId: order._id, orderNo })
}

export async function getOrderList(status) {
  await delay()
  initData()
  const orderList = getStorage(ORDERS_KEY, orders)
  let list = orderList
  if ([1, 2, 3, 4].includes(Number(status))) {
    list = list.filter((item) => item.status === Number(status))
  }
  list = list.slice().sort((a, b) => toTs(b.createTime) - toTs(a.createTime))
  return ok(list)
}

export async function updateOrderStatus({ orderId, orderNo, status }) {
  await delay()
  initData()
  const statusNum = Number(status)
  if ((!orderId && !orderNo) || ![1, 2, 3, 4].includes(statusNum)) {
    return fail('参数不完整')
  }
  const orderList = getStorage(ORDERS_KEY, orders)
  const index = orderList.findIndex((item) => item._id === orderId || item.orderNo === orderNo)
  if (index > -1) {
    orderList[index].status = statusNum
    orderList[index].updateTime = formatDateTime(new Date())
    setStorage(ORDERS_KEY, orderList)
  }
  return ok(null)
}

export async function getCoupons(status) {
  await delay()
  initData()
  let list = getStorage(COUPONS_KEY, coupons)
  if (status && Number(status) !== 0) {
    list = list.filter((c) => Number(c.status) === Number(status))
  }
  return ok(list)
}

export async function getCouponCount() {
  await delay()
  initData()
  const list = getStorage(COUPONS_KEY, coupons)
  const available = list.filter((c) => Number(c.status) === 1)
  return ok(available.length)
}

export async function getAvailableCoupons(orderAmount) {
  await delay()
  initData()
  const list = getStorage(COUPONS_KEY, coupons)
  const amount = Number(orderAmount)
  const available = list.filter((c) => {
    if (Number(c.status) !== 1) return false
    if (c.expireTime && new Date(c.expireTime) < new Date()) return false
    return Number(c.minAmount) <= amount
  })
  return ok(available)
}

export async function useCoupon(couponId) {
  await delay()
  initData()
  const list = getStorage(COUPONS_KEY, coupons)
  const index = list.findIndex((c) => c._id === couponId)
  if (index === -1) return fail('优惠券不存在')
  if (Number(list[index].status) !== 1) return fail('优惠券不可用')
  list[index].status = 2
  list[index].useTime = formatDateTime(new Date())
  setStorage(COUPONS_KEY, list)
  return ok(null)
}

// ====== 桌号管理（本地模拟，不生成真实小程序码） ======

export async function generateTableQrcode(tableNo, capacity = 4) {
  await delay()
  if (!tableNo) return fail('桌号不能为空')
  initData()
  const list = getStorage(TABLES_KEY, tables)
  const idx = list.findIndex((t) => t.tableNo === tableNo)
  const record = {
    tableNo,
    qrcodeUrl: `t=${tableNo}`,
    qrcodeImg: `/static/logo.png`,
    capacity,
    status: 0,
    createTime: Date.now()
  }
  if (idx > -1) {
    Object.assign(list[idx], record)
    setStorage(TABLES_KEY, list)
    return ok({ _id: list[idx]._id || tableNo, ...record })
  }
  record._id = `table_${tableNo}_${Date.now()}`
  list.push(record)
  setStorage(TABLES_KEY, list)
  return ok(record)
}

export async function batchGenerateTableQrcode(arr) {
  await delay()
  if (!Array.isArray(arr) || !arr.length) return fail('list 不能为空')
  let success = 0
  const fails = []
  for (const item of arr) {
    const r = await generateTableQrcode(item.tableNo, item.capacity || 4)
    if (r.code === 0) success++
    else fails.push({ tableNo: item.tableNo, msg: r.msg })
  }
  return ok({ success, fail: fails.length, fails })
}

export async function getTableList(params = {}) {
  await delay()
  initData()
  const { keyword = '', page = 1, pageSize = 50 } = params
  let list = getStorage(TABLES_KEY, tables)
  if (keyword) {
    list = list.filter((t) => String(t.tableNo).includes(keyword))
  }
  const total = list.length
  const start = (page - 1) * pageSize
  list = list.slice(start, start + pageSize)
  return ok({ list, total })
}

export async function removeTable(id) {
  await delay()
  initData()
  const list = getStorage(TABLES_KEY, tables)
  const idx = list.findIndex((t) => t._id === id)
  if (idx === -1) return fail('记录不存在')
  list.splice(idx, 1)
  setStorage(TABLES_KEY, list)
  return ok(null)
}

export async function batchRemoveTable(ids) {
  await delay()
  initData()
  let list = getStorage(TABLES_KEY, tables)
  const idSet = new Set(ids)
  list = list.filter((t) => !idSet.has(t._id))
  setStorage(TABLES_KEY, list)
  return ok({ removed: ids.length })
}

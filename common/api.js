/**
 * 统一数据访问出口
 * 页面只 import 本文件，不关心数据来自云服务还是本地模拟。
 * 通过 common/config.js 的 USE_CLOUD 开关切换实现，页面代码零改动。
 */
import { USE_CLOUD } from './config.js'
import * as cloudApi from './api-cloud.js'
import * as mockApi from './api-mock.js'

const impl = USE_CLOUD ? cloudApi : mockApi

export const getCategories = impl.getCategories
export const getGoods = impl.getGoods
export const getGoodsByCategory = impl.getGoodsByCategory
export const bindTable = impl.bindTable
export const createOrder = impl.createOrder
export const getOrderList = impl.getOrderList
export const updateOrderStatus = impl.updateOrderStatus
export const getCoupons = impl.getCoupons
export const getCouponCount = impl.getCouponCount
export const getAvailableCoupons = impl.getAvailableCoupons
export const useCoupon = impl.useCoupon

export const generateTableQrcode = impl.generateTableQrcode
export const batchGenerateTableQrcode = impl.batchGenerateTableQrcode
export const getTableList = impl.getTableList
export const removeTable = impl.removeTable
export const batchRemoveTable = impl.batchRemoveTable

export default impl

/**
 * 支付抽象层
 * 当前阶段：模拟支付（点击后延时成功，模拟收银台弹窗），无需真实支付通道。
 * 预留真实支付切换：个人主体小程序无法开通微信支付，
 * 后续若更换主体 / 使用 uni-pay 时，在 payWithUniPay 中接入即可，
 * 页面仅调用 pay()，无需改动。
 */

function delay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 模拟支付：弹窗模拟收银台，确认后延时返回成功
 * @param {Object} params { orderId, orderNo, totalPrice }
 * @returns {Promise<{code, data, msg}>}
 */
function payWithMock({ orderId, orderNo, totalPrice }) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '模拟支付',
      content: `订单 ${orderNo} 应付 ¥${Number(totalPrice).toFixed(2)}（模拟环境，点击确认完成支付）`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          delay().then(() => {
            resolve({ code: 0, data: { orderId, orderNo, paid: true }, msg: 'ok' })
          })
        } else {
          resolve({ code: -1, data: null, msg: '用户取消支付' })
        }
      },
      fail: () => {
        resolve({ code: -1, data: null, msg: '支付失败' })
      }
    })
  })
}

/**
 * 预留：uni-pay 真实支付接入点
 * 更换可开通微信支付的主体后，按 uni-pay 文档在此接入，
 * 并将 pay() 中分支切换为 payWithUniPay 返回的 Promise。
 */
// async function payWithUniPay({ orderId, orderNo, totalPrice }) {
//   const res = await uniCloud.callFunction({
//     name: 'uni-pay',
//     data: {
//       action: 'create',
//       orderInfo: {
//         out_trade_no: orderNo,
//         total_fee: Number((totalPrice * 100).toFixed(0)), // 单位：分
//         description: `烧烤订单 ${orderNo}`
//       }
//     }
//   })
//   const result = res && res.result
//   if (result && result.code === 0) {
//     return { code: 0, data: { orderId, orderNo, paid: true }, msg: 'ok' }
//   }
//   return { code: -1, data: null, msg: (result && result.msg) || '支付失败' }
// }

/**
 * 统一支付入口
 * 当前实现：无论 USE_CLOUD 与否均走模拟支付（真实通道未接入）。
 */
export function pay(params) {
  return payWithMock(params)
}

export default {
  pay
}

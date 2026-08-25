'use strict';
const db = uniCloud.database();

// 生成唯一订单号：TX + 年月日时分秒 + 4位随机数
function buildOrderNo() {
  const now = new Date();
  const pad = (n, len) => String(n).padStart(len, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}${pad(now.getHours(), 2)}${pad(now.getMinutes(), 2)}${pad(now.getSeconds(), 2)}`;
  const rand = pad(Math.floor(Math.random() * 10000), 4);
  return `TX${ts}${rand}`;
}

// 时间格式化 yyyy-MM-dd hh:mm:ss
function timeFormat(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 创建订单云函数
 * 入参：
 *   tableId      - 桌号，如 A01（堂食必填）
 *   goodsList    - 购物车商品明细，每项 { goodsId, name, price, count, img, spice? }
 *   totalPrice   - 订单总价（元）
 *   remark       - 顾客备注（可选）
 *   orderType    - dine 堂食 / takeout 外卖（可选，默认 dine）
 *   deliveryMode - delivery 配送 / pickup 自取（外卖时可选）
 *   address      - 收货地址对象（外卖配送时可选）
 *   deliveryTime - 送达时间段（外卖配送时可选）
 *   pickupTime   - 自提时间段（外卖自取时可选）
 *   payType      - 支付方式 WECHAT/ALIPAY/YUE（可选，默认 YUE 余额）
 *
 * 字段策略：同时写入前台旧字段与后台新字段，保证前后台读写一致
 *   旧字段（前台使用）：tableNo, goodsList, totalPrice, status, createTime, updateTime
 *   新字段（后台使用）：tableId, orderCartInfo, totalAmount, netReceipts, discount,
 *                     packingFee, distributionFee, orderStatus, _add_time, _add_time_str,
 *                     _update_time, _update_time_str, payType
 *   状态约定：顾客支付完成后默认"制作中" → orderStatus=1 / status=2
 */
exports.main = async (event, context) => {
  const {
    tableId,
    goodsList,
    totalPrice,
    remark,
    orderType = 'dine',
    deliveryMode = 'delivery',
    address,
    deliveryTime = '',
    pickupTime = '',
    payType = 'YUE'
  } = event || {};

  // 参数校验：桌号、商品明细必须存在
  if (!tableId || !Array.isArray(goodsList) || goodsList.length === 0) {
    return {
      code: -1,
      data: null,
      msg: '参数不完整'
    };
  }

  try {
    const now = Date.now();
    const orderNo = buildOrderNo();
    const totalAmount = Number(totalPrice) || 0;

    // 新字段：orderCartInfo 由 goodsList 转换
    const orderCartInfo = goodsList.map(g => ({
      goodsId: g.goodsId,
      goodsName: g.name,
      image: g.img,
      price: Number(g.price) || 0,
      number: Number(g.count) || 1,
      count: Number(g.count) || 1,
      spice: g.spice || '',
      refund_num: 0,
      refund_amount: 0
    }));

    const orderData = {
      // 订单基础
      orderNo,
      // 桌号：新旧字段同步
      tableNo: tableId,
      tableId,
      // 备注
      remark: remark || '',
      // 商品明细：旧字段 goodsList + 新字段 orderCartInfo
      goodsList,
      orderCartInfo,
      // 金额：旧字段 totalPrice + 新字段 totalAmount/netReceipts/discount
      totalPrice: totalAmount,
      totalAmount,
      netReceipts: totalAmount,
      discount: 0,
      packingFee: 0,
      distributionFee: 0,
      // 订单状态：制作中（旧 status=2，新 orderStatus=1）
      status: 2,
      orderStatus: 1,
      // 支付方式：统一大写
      payType: (typeof payType === 'string' ? payType.toUpperCase() : 'YUE'),
      // 外卖/配送相关（透传）
      orderType,
      deliveryMode,
      address: address || null,
      deliveryTime,
      pickupTime,
      // 时间：旧字段 + 新字段
      createTime: now,
      updateTime: now,
      _add_time: now,
      _add_time_str: timeFormat(new Date(now)),
      _update_time: now,
      _update_time_str: timeFormat(new Date(now))
    };

    // 写入订单
    const res = await db.collection('order').add(orderData);

    // 桌台置为占用
    await db.collection('table')
      .where({ tableNo: tableId })
      .update({ status: 1 });

    return {
      code: 0,
      data: {
        orderId: res.id,
        orderNo
      },
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '创建订单失败'
    };
  }
};

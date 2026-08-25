'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

// 将时间字段转为毫秒时间戳，用于排序
function toTs(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const d = new Date(String(value).replace(/-/g, '/'))
  if (isNaN(d.getTime())) return 0
  return d.getTime()
}

// 旧 status (1待接单 2制作中 3完成 4取消) ↔ 新 orderStatus (0待支付 1制作中 2已完成 3已取消)
const STATUS_OLD_TO_NEW = { 1: 0, 2: 1, 3: 2, 4: 3 };
const STATUS_NEW_TO_OLD = { 0: 1, 1: 2, 2: 3, 3: 4 };

/**
 * 获取订单列表云函数
 * 入参（可选）：
 *   status       - 旧状态 1待接单 2制作中 3完成 4取消
 *   orderStatus  - 新状态 0待支付 1制作中 2已完成 3已取消
 *   tableId      - 按桌号过滤（兼容 tableNo）
 * 不传状态则返回全部，按下单时间倒序。
 *
 * 返回字段：同时返回新旧两套字段，方便前台页面与后台统一消费
 *   status ↔ orderStatus
 *   goodsList ↔ orderCartInfo
 *   totalPrice ↔ totalAmount / netReceipts
 *   createTime ↔ _add_time
 *   tableNo ↔ tableId
 */
exports.main = async (event, context) => {
  try {
    // 状态过滤：支持传入 status(旧) 或 orderStatus(新)，统一映射后过滤
    let targetNewStatus = null;
    if (event && event.orderStatus !== undefined && event.orderStatus !== '' && event.orderStatus !== null) {
      targetNewStatus = Number(event.orderStatus);
    } else if (event && event.status !== undefined && event.status !== '' && event.status !== null) {
      targetNewStatus = STATUS_OLD_TO_NEW[Number(event.status)];
    }

    // 桌号过滤（兼容 tableNo / tableId）
    const tableId = (event && (event.tableId || event.tableNo)) || '';

    // 组装查询条件
    const conditions = [];
    if (tableId) {
      conditions.push(dbCmd.or([{ tableNo: tableId }, { tableId: tableId }]));
    }
    if ([0, 1, 2, 3].includes(targetNewStatus)) {
      const oldStatus = STATUS_NEW_TO_OLD[targetNewStatus];
      conditions.push(dbCmd.or([{ orderStatus: targetNewStatus }, { status: oldStatus }]));
    }

    let dataQuery = db.collection('order');
    if (conditions.length === 1) {
      dataQuery = dataQuery.where(conditions[0]);
    } else if (conditions.length > 1) {
      dataQuery = dataQuery.where(dbCmd.and(conditions));
    }

    const res = await dataQuery.limit(50).get();
    const list = (res.data || []).map(item => normalizeOrder(item));
    list.sort((a, b) => toTs(b._add_time || b.createTime) - toTs(a._add_time || a.createTime));

    return {
      code: 0,
      data: list,
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '查询订单失败'
    };
  }
};

function normalizeOrder(item) {
  if (!item) return item;
  // 状态双向兼容
  if (typeof item.orderStatus === 'undefined' && typeof item.status !== 'undefined') {
    item.orderStatus = STATUS_OLD_TO_NEW[Number(item.status)] ?? 1;
  }
  if (typeof item.status === 'undefined' && typeof item.orderStatus !== 'undefined') {
    item.status = STATUS_NEW_TO_OLD[Number(item.orderStatus)] ?? 2;
  }
  // 桌号兼容
  if (item.tableNo && !item.tableId) item.tableId = item.tableNo;
  if (item.tableId && !item.tableNo) item.tableNo = item.tableId;
  // 金额兼容
  if (typeof item.totalPrice === 'undefined' && typeof item.totalAmount !== 'undefined') {
    item.totalPrice = item.totalAmount;
  }
  if (typeof item.totalAmount === 'undefined' && typeof item.totalPrice !== 'undefined') {
    item.totalAmount = item.totalPrice;
    if (typeof item.netReceipts === 'undefined') item.netReceipts = item.totalPrice;
    if (typeof item.discount === 'undefined') item.discount = 0;
  }
  // 商品明细兼容
  if (Array.isArray(item.orderCartInfo) && !Array.isArray(item.goodsList)) {
    item.goodsList = item.orderCartInfo.map(g => ({
      goodsId: g.goodsId,
      name: g.goodsName,
      price: g.price,
      count: g.number || g.count,
      img: g.image,
      spice: g.spice || ''
    }));
  }
  if (Array.isArray(item.goodsList) && !Array.isArray(item.orderCartInfo)) {
    item.orderCartInfo = item.goodsList.map(g => ({
      goodsId: g.goodsId,
      goodsName: g.name,
      image: g.img,
      price: g.price,
      number: g.count,
      count: g.count,
      spice: g.spice || '',
      refund_num: 0,
      refund_amount: 0
    }));
  }
  // 时间兼容
  if (typeof item._add_time === 'undefined' && typeof item.createTime !== 'undefined') {
    item._add_time = item.createTime;
  }
  if (typeof item.createTime === 'undefined' && typeof item._add_time !== 'undefined') {
    item.createTime = item._add_time;
  }
  return item;
}

'use strict';
const db = uniCloud.database();

// 时间格式化 yyyy-MM-dd hh:mm:ss
function timeFormat(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 更新订单状态云函数（前台/扫码端使用）
 *
 * 入参（二选一即可）：
 *   orderId  - 订单 _id
 *   orderNo  - 订单号
 *   status       - 旧状态 1待接单 2制作中 3完成 4取消（兼容老调用方）
 *   orderStatus  - 新状态 0待支付 1制作中 2已完成 3已取消（推荐）
 *
 * 状态映射表：
 *   orderStatus(新)  status(旧)
 *        0待支付   ↔  1待接单
 *        1制作中   ↔  2制作中
 *        2已完成   ↔  3完成
 *        3已取消   ↔  4取消
 *
 * 逻辑：同时写入 orderStatus 和 status 两套字段，并同步新旧时间字段。
 *       当切换为 已完成/已取消 时，释放对应桌台。
 */
const STATUS_NEW_TO_OLD = {
  0: 1,
  1: 2,
  2: 3,
  3: 4
};
const STATUS_OLD_TO_NEW = {
  1: 0,
  2: 1,
  3: 2,
  4: 3
};

exports.main = async (event, context) => {
  const { orderId, orderNo, status, orderStatus } = event || {};

  // 统一推导新状态 orderStatus
  let newStatus;
  if (orderStatus !== undefined && orderStatus !== null && orderStatus !== '') {
    newStatus = Number(orderStatus);
  } else if (status !== undefined && status !== null && status !== '') {
    newStatus = STATUS_OLD_TO_NEW[Number(status)];
  }

  if ((!orderId && !orderNo) || ![0, 1, 2, 3].includes(newStatus)) {
    return {
      code: -1,
      data: null,
      msg: '参数不完整'
    };
  }

  try {
    const now = Date.now();
    const oldStatus = STATUS_NEW_TO_OLD[newStatus];
    const query = orderId ? { _id: orderId } : { orderNo };

    // 同时更新新旧状态字段与时间字段
    const updateData = {
      orderStatus: newStatus,
      status: oldStatus,
      updateTime: now,
      _update_time: now,
      _update_time_str: timeFormat(new Date(now))
    };

    // 如果变为 已完成(2) 或 已取消(3)，释放桌台
    if (newStatus === 2 || newStatus === 3) {
      try {
        const orderRes = await db.collection('order').where(query).limit(1).get();
        const orderInfo = (orderRes.data || [])[0];
        const tableNo = orderInfo && (orderInfo.tableNo || orderInfo.tableId);
        if (tableNo) {
          await db.collection('table')
            .where({ tableNo })
            .update({ status: 0 });
        }
      } catch (e) {
        console.error('释放桌台失败:', e);
      }
    }

    await db.collection('order')
      .where(query)
      .update(updateData);

    return {
      code: 0,
      data: null,
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '更新订单状态失败'
    };
  }
};

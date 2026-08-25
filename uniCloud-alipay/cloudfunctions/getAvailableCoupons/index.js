'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const orderAmount = Number(event && event.orderAmount) || 0;
  try {
    const res = await db.collection('coupon').where({ status: 1 }).get();
    const now = Date.now();
    const list = (res.data || []).filter(c => {
      if (Number(c.minAmount) > orderAmount) return false;
      if (c.expireTime) {
        const t = new Date(c.expireTime).getTime();
        if (t < now) return false;
      }
      return true;
    });
    return { code: 0, data: list, msg: 'ok' };
  } catch (e) {
    return { code: -1, data: null, msg: e.message || '查询失败' };
  }
};

'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const status = event && event.status;
  try {
    const where = status ? { status: Number(status) } : {};
    const res = await db.collection('coupon').where(where).get();
    return { code: 0, data: res.data, msg: 'ok' };
  } catch (e) {
    return { code: -1, data: null, msg: e.message || '查询失败' };
  }
};

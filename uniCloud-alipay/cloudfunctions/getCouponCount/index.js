'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  try {
    const res = await db.collection('coupon').where({ status: 1 }).get();
    return { code: 0, data: (res.data || []).length, msg: 'ok' };
  } catch (e) {
    return { code: -1, data: 0, msg: e.message || '查询失败' };
  }
};

'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const couponId = event && event.couponId;
  if (!couponId) {
    return { code: -1, data: null, msg: '参数不完整' };
  }
  try {
    const doc = await db.collection('coupon').doc(couponId).get();
    const coupon = (doc.data || [])[0];
    if (!coupon) {
      return { code: -1, data: null, msg: '优惠券不存在' };
    }
    if (Number(coupon.status) !== 1) {
      return { code: -1, data: null, msg: '优惠券不可用' };
    }
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    await db.collection('coupon').doc(couponId).update({
      status: 2,
      useTime: timeStr
    });
    return { code: 0, data: null, msg: 'ok' };
  } catch (e) {
    return { code: -1, data: null, msg: e.message || '核销失败' };
  }
};

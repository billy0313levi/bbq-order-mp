'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  try {
    const res = await db.collection('category')
      .where({ status: 1 })
      .orderBy('sort', 'asc')
      .get();
    return {
      code: 0,
      data: res.data,
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '查询分类失败'
    };
  }
};

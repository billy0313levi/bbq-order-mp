'use strict';
const db = uniCloud.database();

/**
 * 获取桌台信息云函数（扫码/手动输桌号绑定时使用）
 * 入参：tableId - 桌号，如 A01
 * 返回：桌台信息（含 status：0空闲 1占用，capacity 可坐人数）
 */
exports.main = async (event, context) => {
  const tableId = (event && event.tableId) || '';
  if (!tableId) {
    return {
      code: -1,
      data: null,
      msg: '参数不完整'
    };
  }
  try {
    const res = await db.collection('table')
      .where({ tableNo: tableId })
      .limit(1)
      .get();
    const table = (res.data || [])[0];
    if (!table) {
      return {
        code: -1,
        data: null,
        msg: '桌台不存在'
      };
    }
    return {
      code: 0,
      data: table,
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '查询桌台失败'
    };
  }
};

'use strict';
const db = uniCloud.database();

/**
 * 获取上架菜品云函数（点餐首页使用）
 * 规则：返回上架菜品
 *   上架条件（兼容新旧字段）：status=1 或 delivery=true
 *   排序：sort 升序，无 sort 时按添加时间倒序
 * 字段兼容：保证返回数据同时包含新旧字段，方便前台页面与后台统一消费
 *   name ↔ goodsName
 *   img  ↔ goodsLogo
 *   desc ↔ content
 *   category_id ↔ categoryId
 *   price：若无 sku_list 则直接使用，否则取默认 SKU 价格
 *   status ↔ delivery（1/true 上架，0/false 下架）
 */
exports.main = async (event, context) => {
  try {
    const dbCmd = db.command;
    // 上架条件：status=1 或 delivery=true
    const res = await db.collection('goods')
      .where(dbCmd.or([
        { status: 1 },
        { delivery: true }
      ]))
      .orderBy('sort', 'asc')
      .get();

    const list = (res.data || []).map(item => {
      // 双向兼容字段
      if (item.goodsName && !item.name) item.name = item.goodsName;
      if (item.name && !item.goodsName) item.goodsName = item.name;
      if (item.goodsLogo && !item.img) item.img = item.goodsLogo;
      if (item.img && !item.goodsLogo) item.goodsLogo = item.img;
      if (item.content && !item.desc) item.desc = item.content;
      if (item.desc && !item.content) item.content = item.desc;
      if (item.categoryId && !item.category_id) item.category_id = item.categoryId;
      if (item.category_id && !item.categoryId) item.categoryId = item.category_id;

      // 状态兼容：delivery(true/false) ↔ status(1/0)
      if (typeof item.status === 'undefined' && typeof item.delivery !== 'undefined') {
        item.status = item.delivery ? 1 : 0;
      }
      if (typeof item.delivery === 'undefined' && typeof item.status !== 'undefined') {
        item.delivery = item.status === 1;
      }

      // 价格兼容：若无 price，则从 sku_list 取默认 SKU 价格
      if ((typeof item.price === 'undefined' || item.price === null) && Array.isArray(item.sku_list) && item.sku_list.length > 0) {
        const defaultSku = item.sku_list.find(s => s.isDefault === true) || item.sku_list[0];
        item.price = Number(defaultSku.price) || 0;
      }

      return item;
    });

    return {
      code: 0,
      data: list,
      msg: 'ok'
    };
  } catch (e) {
    return {
      code: -1,
      data: null,
      msg: e.message || '查询菜品失败'
    };
  }
};

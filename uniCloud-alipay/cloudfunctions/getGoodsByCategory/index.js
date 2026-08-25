'use strict';
const db = uniCloud.database();

/**
 * 按分类获取上架菜品云函数（保留，兼容按分类浏览）
 * 入参：categoryId - 分类 _id（cat_rec 推荐分类返回全部上架）
 * 规则：返回上架菜品
 *   上架条件（兼容新旧字段）：status=1 或 delivery=true
 *   过滤：按 category_id 或 categoryId 等值过滤
 *   排序：sort 升序
 * 字段兼容：与 getGoods 保持一致，同时返回新旧字段
 */
exports.main = async (event, context) => {
  const categoryId = (event && event.categoryId) || '';
  try {
    const dbCmd = db.command;
    const whereCond = dbCmd.or([
      { status: 1 },
      { delivery: true }
    ]);

    if (categoryId && categoryId !== 'cat_rec') {
      // 同时兼容 category_id 和 categoryId
      const finalWhere = dbCmd.and([
        whereCond,
        dbCmd.or([
          { category_id: categoryId },
          { categoryId: categoryId }
        ])
      ]);
      const res = await db.collection('goods')
        .where(finalWhere)
        .orderBy('sort', 'asc')
        .get();
      return {
        code: 0,
        data: normalizeGoodsList(res.data),
        msg: 'ok'
      };
    }

    const res = await db.collection('goods')
      .where(whereCond)
      .orderBy('sort', 'asc')
      .get();
    return {
      code: 0,
      data: normalizeGoodsList(res.data),
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

function normalizeGoodsList(list) {
  return (list || []).map(item => {
    if (item.goodsName && !item.name) item.name = item.goodsName;
    if (item.name && !item.goodsName) item.goodsName = item.name;
    if (item.goodsLogo && !item.img) item.img = item.goodsLogo;
    if (item.img && !item.goodsLogo) item.goodsLogo = item.img;
    if (item.content && !item.desc) item.desc = item.content;
    if (item.desc && !item.content) item.content = item.desc;
    if (item.categoryId && !item.category_id) item.category_id = item.categoryId;
    if (item.category_id && !item.categoryId) item.categoryId = item.category_id;
    if (typeof item.status === 'undefined' && typeof item.delivery !== 'undefined') {
      item.status = item.delivery ? 1 : 0;
    }
    if (typeof item.delivery === 'undefined' && typeof item.status !== 'undefined') {
      item.delivery = item.status === 1;
    }
    if ((typeof item.price === 'undefined' || item.price === null) && Array.isArray(item.sku_list) && item.sku_list.length > 0) {
      const defaultSku = item.sku_list.find(s => s.isDefault === true) || item.sku_list[0];
      item.price = Number(defaultSku.price) || 0;
    }
    return item;
  });
}

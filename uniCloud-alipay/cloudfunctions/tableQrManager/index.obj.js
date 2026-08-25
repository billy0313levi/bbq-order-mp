'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

// 微信小程序 appid（来自 manifest.json，正式发布的小程序）
const WX_APPID = 'wxb0aa99cbde235f13';
// 微信小程序 AppSecret（部署后在云函数环境变量配置 wxAppSecret，不要硬编码到代码中）
// 在 unicloud 控制台 -> 云函数 -> tableQrManager -> 环境变量 中添加 wxAppSecret
const WX_APPSECRET = process.env.wxAppSecret || '';

// access_token 缓存（云函数实例级缓存，过期自动刷新）
let cachedAccessToken = '';
let tokenExpireAt = 0;

/**
 * 获取微信接口调用凭证 access_token
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpireAt - 60000) {
    return cachedAccessToken;
  }
  if (!WX_APPSECRET) {
    throw new Error('未配置 wxAppSecret 环境变量');
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_APPSECRET}`;
  const res = await uniCloud.httpclient.request(url, {
    method: 'GET',
    dataType: 'json',
    timeout: 10000
  });
  const data = res.data || {};
  if (!data.access_token) {
    throw new Error('获取access_token失败: ' + (data.errmsg || JSON.stringify(data)));
  }
  cachedAccessToken = data.access_token;
  tokenExpireAt = now + (data.expires_in || 7200) * 1000;
  return cachedAccessToken;
}

/**
 * 调用微信接口生成小程序码（返回 Buffer）
 * @param {string} scene 最大32字符
 * @param {string} page 不带前导/的页面路径
 */
async function getWxacodeunlimit(scene, page) {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${token}`;
  const body = {
    scene,
    page,
    check_path: false, // 允许小程序未发布或页面不存在，便于开发期使用
    width: 430
  };
  const res = await uniCloud.httpclient.request(url, {
    method: 'POST',
    data: JSON.stringify(body),
    contentType: 'json',
    dataType: 'buffer',
    timeout: 15000
  });
  // 微信成功返回图片 buffer (二进制)，失败返回 JSON
  const buf = res.data;
  if (buf && buf.length < 1000) {
    // 极小内容可能是错误 JSON
    try {
      const err = JSON.parse(buf.toString('utf8'));
      if (err.errcode) {
        throw new Error('生成小程序码失败: ' + (err.errmsg || err.errcode));
      }
    } catch (e) {
      if (e.message && e.message.indexOf('生成小程序码失败') === 0) throw e;
      // 解析失败说明是正常图片二进制
    }
  }
  return buf;
}

/**
 * 上传图片 Buffer 到云存储，返回 fileID
 */
async function uploadQrcodeImg(tableNo, buffer) {
  const cloudPath = `table-qrcode/${tableNo}_${Date.now()}.jpg`;
  const uploadRes = await uniCloud.uploadFile({
    cloudPath,
    fileContent: buffer
  });
  return uploadRes.fileID;
}

module.exports = {
  _before: function () {},

  /**
   * 生成单个桌号的小程序码
   * @param {string} tableNo 桌号，如 A01
   * @param {number} [capacity=4] 容纳人数
   * @returns {Promise<{code:number,data:object,msg:string}>}
   */
  async generate(tableNo, capacity = 4) {
    tableNo = (tableNo || '').trim();
    if (!tableNo) {
      return { code: -1, data: null, msg: '桌号不能为空' };
    }
    // 已存在则直接返回
    const existRes = await db.collection('table').where({ tableNo }).limit(1).get();
    const exist = (existRes.data || [])[0];
    try {
      const scene = `t=${tableNo}`;
      const page = 'pages/index/index';
      const imgBuffer = await getWxacodeunlimit(scene, page);
      const fileID = await uploadQrcodeImg(tableNo, imgBuffer);
      const now = Date.now();
      if (exist) {
        // 替换旧的二维码图片
        if (exist.qrcodeImg && exist.qrcodeImg.indexOf('cloud://') === 0) {
          uniCloud.deleteFile({ fileList: [exist.qrcodeImg] }).catch(() => {});
        }
        await db.collection('table').doc(exist._id).update({
          qrcodeUrl: scene,
          qrcodeImg: fileID,
          capacity,
          updateTime: now
        });
        return {
          code: 0,
          data: { _id: exist._id, tableNo, qrcodeImg: fileID, qrcodeUrl: scene },
          msg: '小程序码已更新'
        };
      }
      const addRes = await db.collection('table').add({
        tableNo,
        qrcodeUrl: scene,
        qrcodeImg: fileID,
        capacity,
        status: 0,
        createTime: now
      });
      return {
        code: 0,
        data: { _id: addRes.id, tableNo, qrcodeImg: fileID, qrcodeUrl: scene },
        msg: '小程序码生成成功'
      };
    } catch (e) {
      return { code: -1, data: null, msg: e.message || '生成失败' };
    }
  },

  /**
   * 批量生成桌号小程序码
   * @param {Array<{tableNo:string,capacity?:number}>} list
   * @returns {Promise<{code:number,data:{success:number,fail:number,fails:Array},msg:string}>}
   */
  async batchGenerate(list) {
    if (!Array.isArray(list) || !list.length) {
      return { code: -1, data: null, msg: 'list 不能为空' };
    }
    let success = 0;
    const fails = [];
    for (const item of list) {
      const r = await this.generate(item.tableNo, item.capacity || 4);
      if (r.code === 0) {
        success++;
      } else {
        fails.push({ tableNo: item.tableNo, msg: r.msg });
      }
    }
    return {
      code: 0,
      data: { success, fail: fails.length, fails },
      msg: `批量生成完成，成功 ${success} 个，失败 ${fails.length} 个`
    };
  },

  /**
   * 查询桌号列表
   * @param {object} params { keyword, page, pageSize }
   */
  async list(params = {}) {
    const { keyword = '', page = 1, pageSize = 50 } = params;
    const where = keyword ? { tableNo: new RegExp(keyword, 'i') } : {};
    const skip = (page - 1) * pageSize;
    const countRes = await db.collection('table').where(where).count();
    const listRes = await db.collection('table')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    return {
      code: 0,
      data: { list: listRes.data, total: countRes.total },
      msg: 'ok'
    };
  },

  /**
   * 删除桌号（同时删除云存储图片）
   * @param {string} id 记录 _id
   */
  async remove(id) {
    if (!id) return { code: -1, data: null, msg: 'id 不能为空' };
    const doc = await db.collection('table').doc(id).get();
    const item = (doc.data || [])[0];
    if (!item) return { code: -1, data: null, msg: '记录不存在' };
    if (item.qrcodeImg && item.qrcodeImg.indexOf('cloud://') === 0) {
      uniCloud.deleteFile({ fileList: [item.qrcodeImg] }).catch(() => {});
    }
    await db.collection('table').doc(id).remove();
    return { code: 0, data: null, msg: '删除成功' };
  },

  /**
   * 批量删除
   * @param {Array<string>} ids
   */
  async batchRemove(ids) {
    if (!Array.isArray(ids) || !ids.length) {
      return { code: -1, data: null, msg: 'ids 不能为空' };
    }
    const docsRes = await db.collection('table').where({ _id: dbCmd.in(ids) }).get();
    const fileList = (docsRes.data || [])
      .filter(i => i.qrcodeImg && i.qrcodeImg.indexOf('cloud://') === 0)
      .map(i => i.qrcodeImg);
    if (fileList.length) {
      uniCloud.deleteFile({ fileList }).catch(() => {});
    }
    await db.collection('table').where({ _id: dbCmd.in(ids) }).remove();
    return { code: 0, data: { removed: ids.length }, msg: '批量删除成功' };
  }
};

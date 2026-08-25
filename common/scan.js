/**
 * 扫码结果解析工具
 * 兼容以下来源：
 *  1. 微信小程序码（后台 getwxacodeunlimit 生成，scene=t=A01）：
 *     wx.scanCode 返回 result 为空、path 为 pages/index/index?scene=t%3DA01，桌号需从 path 的 scene 中解析
 *  2. 普通二维码：内容为 /pages/index/index?tableId=A01 或 tableId=A01 或 t=A01
 *  3. 纯桌号文本：A01
 */

/**
 * 从任意字符串中提取桌号（支持 scene/tableId/tableNo/t= 参数及纯桌号）
 * @param {string} str
 * @returns {string} 桌号，解析不到返回空字符串
 */
export function extractTableNo(str) {
  if (!str) return ''
  const s = String(str)

  // 1. scene 参数（小程序码）：scene=t%3DA01 / scene=t=A01 / scene=A01
  const sceneMatch = s.match(/(?:^|[?&])scene=([^&]+)/i)
  if (sceneMatch) {
    const scene = decodeURIComponent(sceneMatch[1])
    const tMatch = scene.match(/t=([^&]+)/i)
    if (tMatch) return tMatch[1].trim().toUpperCase()
    const pure = scene.trim().toUpperCase()
    if (/^[A-Z]{1,2}\d{1,3}$/.test(pure)) return pure
  }

  // 2. t= / tableId= / tableNo= 参数（普通二维码或小程序码 scene 直传）
  const tMatch = s.match(/(?:^|[?&])t=([^&]+)/i)
  if (tMatch) return tMatch[1].trim().toUpperCase()
  const idMatch = s.match(/(?:tableId|tableNo)=([A-Za-z0-9]+)/i)
  if (idMatch) return idMatch[1].toUpperCase()

  // 3. 纯桌号
  const pure = s.trim().toUpperCase()
  if (/^[A-Z]{1,2}\d{1,3}$/.test(pure)) return pure

  return ''
}

/**
 * 从 uni.scanCode 的成功回调结果中解析桌号
 * @param {object} scanRes uni.scanCode success 返回值
 * @returns {string} 桌号，解析不到返回空字符串
 */
export function parseScanTableNo(scanRes) {
  if (!scanRes) return ''
  const raw = scanRes.result || scanRes.path || scanRes.rawData || ''
  return extractTableNo(raw)
}

export default {
  extractTableNo,
  parseScanTableNo
}

/**
 * 全局配置
 * USE_CLOUD: 是否启用云服务（uniCloud）
 *  - false: 纯前端本地模拟数据（开发/调试阶段，无需登录云空间）
 *  - true:  使用 uniCloud 云函数 + 云数据库（上线阶段）
 * 切换后无需修改任何页面代码，重启运行即可生效。
 */
export const USE_CLOUD = true

export default {
  USE_CLOUD
}

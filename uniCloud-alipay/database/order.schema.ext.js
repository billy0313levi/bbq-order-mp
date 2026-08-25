module.exports = {
	before: async function() {
		// 订单数据由云函数统一读写，不开放客户端直接访问
	},
	after: async function() {
		// 预留扩展
	}
}

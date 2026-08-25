<template>
	<view class="page" v-if="order">
		<bbq-navbar :title="statusInfo.title" :showBack="true" />
		<view class="status-area" :style="{ paddingTop: navHeight + 'px' }">
			<view class="status-title">{{ statusInfo.title }}</view>
			<view class="status-sub">{{ statusInfo.sub }}</view>
			<view class="status-dots" v-if="order && (order.status === 1 || order.status === 2)">
				<view class="s-dot dot-1"></view>
				<view class="s-dot dot-2"></view>
				<view class="s-dot dot-3"></view>
			</view>
		</view>

		<view class="page-body">
			<view class="info-card">
				<view class="card-title">订单详情</view>
				<view class="info-row">
					<text class="info-label">桌台号码:</text>
					<text class="info-value">{{ order.tableNo }}号桌</text>
				</view>
				<view class="info-row">
					<text class="info-label">下单时间:</text>
					<text class="info-value gray">{{ formatFullTime(order.createTime) }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">订单编号:</text>
					<text class="info-value gray">{{ order.orderNo }}</text>
				</view>
			</view>

			<view class="detail-card">
				<view class="card-title">菜品明细</view>
				<view class="goods-item" v-for="item in (order.goodsList || [])" :key="item.goodsId">
					<text class="goods-name">{{ item.name }}<text class="goods-count"> x{{ item.count }}</text></text>
					<text class="goods-price">¥{{ formatPrice(item.price * item.count) }}</text>
				</view>
				<view class="card-divider"></view>
				<view class="total-row">
					<text class="total-label">应付合计:</text>
					<text class="total-value">¥{{ formatPrice(order.totalPrice) }}</text>
				</view>
			</view>
		</view>

		<view class="action-bar">
			<view class="again-btn" @click="orderAgain">再来一单</view>
			<view class="urge-btn" @click="urge">催单</view>
		</view>
	</view>
</template>

<script>
import { useCartStore } from '@/stores/cart.js'
import api from '@/common/api.js'

const STATUS_MAP = {
	1: { title: '制作中', sub: '师傅正在全力烤制中，请您耐心等待' },
	2: { title: '制作中', sub: '师傅正在全力烤制中，请您耐心等待' },
	3: { title: '已完成', sub: '感谢您的光临，期待下次再见' },
	4: { title: '已取消', sub: '订单已取消' }
}

export default {
	data() {
		return {
			navHeight: 44,
			order: null,
			orderId: ''
		}
	},
	computed: {
		statusInfo() {
			const key = this.order ? this.order.status : 2
			return STATUS_MAP[key] || { title: '制作中', sub: '' }
		},
		cartStore() {
			return useCartStore()
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.navHeight = (info.statusBarHeight || 20) + 44
		} catch (e) {
			this.navHeight = 64
		}
		this.orderId = (options && options.id) || ''
		this.loadDetail()
	},
	onShow() {
		if (this.orderId) this.loadDetail()
	},
	onPullDownRefresh() {
		this.loadDetail().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		loadDetail() {
			return api.getOrderList('').then(res => {
				if (res.code === 0) {
					const list = res.data || []
					const found = list.find(item => item._id === this.orderId)
					if (found) {
						this.order = found
					} else {
						uni.showToast({
							title: '未找到该订单',
							icon: 'none'
						})
						setTimeout(() => uni.navigateBack(), 800)
					}
				}
			}).catch(err => {
				console.error('加载订单详情失败', err)
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				})
			})
		},
		formatPrice(price) {
			return Number(price || 0).toFixed(0)
		},
		formatFullTime(value) {
			if (!value) return ''
			let date
			if (value instanceof Date) {
				date = value
			} else if (typeof value === 'number') {
				date = new Date(value)
			} else {
				date = new Date(String(value).replace(/-/g, '/'))
				if (isNaN(date.getTime())) {
					date = new Date(value)
				}
			}
			if (isNaN(date.getTime())) return ''
			const pad = (n) => String(n).padStart(2, '0')
			return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
				' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
		},
		orderAgain() {
			const items = this.order.goodsList || []
			items.forEach(item => {
				this.cartStore.addToCart({
					_id: item.goodsId,
					name: item.name,
					price: item.price,
					image: item.img || item.image
				})
			})
			uni.showToast({
				title: '已加入购物车',
				icon: 'success'
			})
			setTimeout(() => {
				uni.reLaunch({
					url: '/pages/cart/cart'
				})
			}, 800)
		},
		urge() {
			uni.showToast({
				title: '已催单，请耐心等待',
				icon: 'none'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;
}

.status-area {
	background-color: #C13027;
	height: 280rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	.status-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 16rpx;
	}

	.status-sub {
		font-size: 26rpx;
		color: #ffffff;
		margin-bottom: 24rpx;
	}

	.status-dots {
		display: flex;
		align-items: center;

		.s-dot {
			width: 14rpx;
			height: 14rpx;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.4);
			margin: 0 8rpx;
			animation: dotBlink 1.4s infinite ease-in-out;
		}

		.dot-1 { animation-delay: 0s; }
		.dot-2 { animation-delay: 0.2s; }
		.dot-3 { animation-delay: 0.4s; }
	}
}

@keyframes dotBlink {
	0%, 80%, 100% {
		background-color: rgba(255, 255, 255, 0.4);
		transform: scale(0.8);
	}
	40% {
		background-color: #ffffff;
		transform: scale(1.2);
	}
}

.page-body {
	padding: 0 30rpx;
	padding-bottom: 220rpx;
}

.info-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	margin-top: -30rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
	padding: 30rpx;

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 20rpx;
	}

	.info-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12rpx 0;

		.info-label {
			font-size: 26rpx;
			color: #999999;
		}

		.info-value {
			font-size: 26rpx;
			font-weight: bold;
			color: #222222;

			&.gray {
				color: #999999;
				font-weight: normal;
			}
		}
	}
}

.detail-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-top: 20rpx;

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 20rpx;
	}

	.goods-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12rpx 0;

		.goods-name {
			font-size: 28rpx;
			color: #333333;
		}

		.goods-count {
			color: #999999;
		}

		.goods-price {
			font-size: 28rpx;
			color: #333333;
		}
	}

	.card-divider {
		height: 1rpx;
		background-color: #eeeeee;
		margin: 20rpx 0;
	}

	.discount-row {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.discount-label {
			font-size: 26rpx;
			color: #333333;
		}

		.discount-value {
			font-size: 26rpx;
			color: #C13027;
		}
	}

	.total-row {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.total-label {
			font-size: 28rpx;
			font-weight: bold;
			color: #222222;
		}

		.total-value {
			font-size: 36rpx;
			font-weight: bold;
			color: #C13027;
		}
	}
}

.action-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ffffff;
	padding: 20rpx 30rpx;
	display: flex;
	justify-content: space-between;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

	.again-btn {
		width: 48%;
		height: 90rpx;
		border-radius: 50rpx;
		border: 1rpx solid #C13027;
		background-color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: bold;
		color: #C13027;
		box-sizing: border-box;
	}

	.urge-btn {
		width: 48%;
		height: 90rpx;
		border-radius: 50rpx;
		background-color: #C13027;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: bold;
		color: #ffffff;
	}
}
</style>

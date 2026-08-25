<template>
	<view class="page">
		<bbq-navbar title="购物车" />
		<view class="page-body" :style="{ paddingTop: navHeight + 'px' }">
			<view class="table-tip" @click="goBind">
				<view class="tip-icon">
					<uni-icons type="info-filled" size="24" color="#F5A623" />
				</view>
				<text class="tip-text">{{ tableName ? '您正在绑定桌台: ' + tableName : '尚未绑定桌台，点击前往扫码' }}</text>
			</view>

			<view class="cart-card" v-if="cartStore.items.length > 0">
				<view class="cart-item" v-for="(item, index) in cartStore.items" :key="item.goodsId">
					<view class="check-box" :class="{ checked: item.checked }" @click="toggleCheck(item.goodsId)">
						<uni-icons v-if="item.checked" type="checkmarkempty" size="18" color="#ffffff" />
					</view>
					<image class="item-img" :src="item.image" mode="aspectFill" lazy-load />
					<view class="item-info">
						<view class="item-name">{{ item.name }}</view>
						<view class="item-price">¥{{ formatPrice(item.price) }}</view>
					</view>
					<view class="number-box">
						<view class="num-btn minus" @click="changeCount(item.goodsId, -1)">
							<uni-icons type="minus" size="18" color="#666666" />
						</view>
						<view class="num-text">{{ item.count }}</view>
						<view class="num-btn plus" @click="changeCount(item.goodsId, 1)">
							<uni-icons type="plus" size="18" color="#ffffff" />
						</view>
					</view>
					<view class="item-divider" v-if="index < cartStore.items.length - 1"></view>
				</view>
			</view>

			<view class="cart-empty" v-else>
				<text>购物车还是空的，快去点单吧~</text>
			</view>

			<view class="remark-card">
				<view class="remark-title">备注</view>
				<input
					class="remark-input"
					v-model="cartStore.remark"
					type="text"
					placeholder="例如：少辣，不要香菜..."
					placeholder-class="remark-placeholder"
					@blur="saveRemark"
				/>
			</view>
		</view>

		<view class="settle-bar">
			<view class="settle-top">
				<view class="settle-left">
					<view class="subtotal">
						<text>小计</text>
						<text class="subtotal-price">¥{{ formatPrice(cartStore.totalPrice) }}</text>
					</view>
					<text class="delivery">• 配送费免收</text>
				</view>
				<view class="settle-right">
					<text class="total-label">合计:</text>
					<text class="total-price">¥{{ formatPrice(cartStore.totalPrice) }}</text>
				</view>
			</view>
			<view class="checkout-btn" :class="{ disabled: !hasTable }" @click="goCheckout">去下单</view>
		</view>
		<bbq-tabbar current="cart" />
	</view>
</template>

<script>
import { useCartStore } from '@/stores/cart.js'

export default {
	data() {
		return {
			navHeight: 44,
			tableName: '',
			hasTable: false
		}
	},
	computed: {
		cartStore() {
			return useCartStore()
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.navHeight = (info.statusBarHeight || 20) + 44
		} catch (e) {
			this.navHeight = 64
		}
		this.loadTable()
	},
	onShow() {
		this.loadTable()
	},
	methods: {
		loadTable() {
			try {
				const table = uni.getStorageSync('bbq_table')
				this.tableName = (table && table.tableName) || ''
			} catch (e) {
				this.tableName = ''
			}
			this.hasTable = !!this.tableName
			// 按当前桌号回填购物车（本地按桌分区）
			this.cartStore.reload()
		},
		formatPrice(price) {
			return Number(price || 0).toFixed(0)
		},
		toggleCheck(goodsId) {
			this.cartStore.toggleCheck(goodsId)
		},
		changeCount(goodsId, delta) {
			this.cartStore.changeCount(goodsId, delta)
		},
		saveRemark() {
			this.cartStore.setRemark(this.cartStore.remark)
		},
		goBind() {
			uni.reLaunch({
				url: '/pages/table/table'
			})
		},
		goCheckout() {
			if (!this.hasTable) {
				uni.showModal({
					title: '未绑定桌台',
					content: '请先扫码绑定桌台，再下单结算',
					confirmText: '去绑定',
					success: (res) => {
						if (res.confirm) {
							this.goBind()
						}
					}
				})
				return
			}
			if (this.cartStore.selectedItems.length === 0) {
				uni.showToast({
					title: '请先选择商品',
					icon: 'none'
				})
				return
			}
			uni.navigateTo({
				url: '/pages/confirm-order/confirm-order'
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;

	.page-body {
		padding-bottom: calc(120rpx + 260rpx + env(safe-area-inset-bottom));
	}
}

.table-tip {
	display: flex;
	align-items: center;
	background-color: #FFF9E6;
	margin: 20rpx 30rpx;
	padding: 15rpx 20rpx;
	border-radius: 12rpx;

	.tip-icon {
		margin-right: 12rpx;
		display: flex;
		align-items: center;
	}

	.tip-text {
		font-size: 26rpx;
		color: #333333;
	}
}

.cart-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	margin: 0 30rpx;
	padding: 10rpx 24rpx;
}

.cart-item {
	position: relative;
	display: flex;
	align-items: center;
	padding: 24rpx 0;

	.check-box {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		border: 2rpx solid #cccccc;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-sizing: border-box;

		&.checked {
			background-color: #C13027;
			border-color: #C13027;
		}
	}

	.item-img {
		width: 110rpx;
		height: 110rpx;
		border-radius: 12rpx;
		margin-left: 20rpx;
		flex-shrink: 0;
		background-color: #f2f0eb;
	}

	.item-info {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.item-name {
		font-size: 28rpx;
		font-weight: bold;
		color: #333333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-price {
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #999999;
	}

	.number-box {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: 16rpx;
	}

	.num-btn {
		width: 50rpx;
		height: 50rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;

		&.minus {
			background-color: #eeeeee;
		}

		&.plus {
			background-color: #F5A623;
		}
	}

	.num-text {
		width: 60rpx;
		text-align: center;
		font-size: 30rpx;
		color: #222222;
	}

	.item-divider {
		position: absolute;
		left: 60rpx;
		right: 0;
		bottom: 0;
		height: 1rpx;
		background-color: #eeeeee;
	}
}

.cart-empty {
	background-color: #ffffff;
	border-radius: 20rpx;
	margin: 0 30rpx;
	padding: 100rpx 0;
	text-align: center;
	font-size: 26rpx;
	color: #999999;
}

.remark-card {
	background-color: #f5f4f0;
	border-radius: 20rpx;
	margin: 20rpx 30rpx;
	padding: 24rpx;

	.remark-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 16rpx;
	}

	.remark-input {
		height: 100rpx;
		background-color: #ffffff;
		border: 1rpx solid #F0F0F0;
		border-radius: 8rpx;
		padding: 0 20rpx;
		font-size: 28rpx;
		color: #333333;
	}

	.remark-placeholder {
		color: #bbbbbb;
	}
}

.settle-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: calc(110rpx + env(safe-area-inset-bottom));
	background-color: #ffffff;
	border-top: 1rpx solid #f0f0f0;
	padding: 16rpx 30rpx;

	.settle-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	.settle-left {
		display: flex;
		align-items: baseline;

		.subtotal {
			display: flex;
			align-items: baseline;
			font-size: 24rpx;
			color: #222222;
		}

		.subtotal-price {
			font-size: 26rpx;
			font-weight: bold;
			margin-left: 6rpx;
		}

		.delivery {
			margin-left: 10rpx;
			font-size: 22rpx;
			color: #999999;
		}
	}

	.settle-right {
		display: flex;
		align-items: baseline;

		.total-label {
			font-size: 26rpx;
			font-weight: bold;
			color: #222222;
		}

		.total-price {
			font-size: 40rpx;
			font-weight: bold;
			color: #C13027;
			margin-left: 8rpx;
		}
	}

	.checkout-btn {
		height: 100rpx;
		border-radius: 50rpx;
		background-color: #C13027;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: bold;
		color: #ffffff;

		&.disabled {
			background-color: #cccccc;
		}
	}
}
</style>
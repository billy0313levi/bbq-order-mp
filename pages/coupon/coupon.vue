<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">{{ selectMode ? '选择优惠券' : '我的优惠券' }}</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<view class="tab-bar" v-if="!selectMode">
			<view
				class="tab-item"
					:class="{ active: activeStatus === s.key }"
					v-for="s in statusTabs"
					:key="s.key"
					@click="switchStatus(s.key)"
				>
					<text>{{ s.label }}</text>
					<view class="tab-line" v-if="activeStatus === s.key"></view>
				</view>
			</view>

			<view class="coupon-list" v-if="filteredCoupons.length > 0">
				<view v-if="selectMode" class="coupon-card no-use" @click="clearSelection">
					<view class="coupon-left fixed">
						<view class="coupon-value"><text class="num">不使用</text></view>
						<view class="coupon-condition">本次订单不使用优惠券</view>
					</view>
					<view class="coupon-right">
						<view class="coupon-name">不使用优惠券</view>
						<view class="coupon-desc">继续结算</view>
						<view class="coupon-action">选择</view>
					</view>
				</view>
				<view class="coupon-card" v-for="coupon in filteredCoupons" :key="coupon._id" :class="{ used: Number(coupon.status) !== 1 }">
					<view class="coupon-left" :class="coupon.type">
						<view class="coupon-value" v-if="coupon.type === 'fixed'">
							<text class="currency">¥</text>
							<text class="num">{{ coupon.value }}</text>
						</view>
						<view class="coupon-value" v-else>
							<text class="num">{{ (10 - coupon.value * 10).toFixed(1) }}</text>
							<text class="currency">折</text>
						</view>
						<view class="coupon-condition">满{{ coupon.minAmount }}可用</view>
					</view>
					<view class="coupon-right">
						<view class="coupon-name">{{ coupon.name }}</view>
						<view class="coupon-desc">{{ coupon.desc }}</view>
						<view class="coupon-expire">有效期至 {{ coupon.expireTime }}</view>
						<view class="coupon-action" v-if="Number(coupon.status) === 1" @click="useCoupon(coupon)">
						{{ selectMode ? '选择' : '去使用' }}
					</view>
						<view class="coupon-status" v-else>
							{{ Number(coupon.status) === 2 ? '已使用' : '已过期' }}
						</view>
					</view>
					<view class="coupon-corner" v-if="Number(coupon.status) !== 1"></view>
				</view>
			</view>

			<view class="empty" v-else-if="!loading">
				<uni-icons v-if="selectMode" type="wallet-filled" size="60" color="#DDDDDD" />
				<text class="empty-text">{{ selectMode ? '暂无可用优惠券' : '暂无优惠券' }}</text>
				<view class="empty-btn" v-if="selectMode" @click="clearSelection">不使用优惠券</view>
			</view>
		</view>
	</view>
</template>

<script>
import api from '@/common/api.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			selectMode: false,
			orderAmount: 0,
			statusTabs: [
				{ key: 1, label: '可使用' },
				{ key: 2, label: '已使用' },
				{ key: 3, label: '已过期' }
			],
			activeStatus: 1,
			coupons: [],
			loading: false
		}
	},
	computed: {
		filteredCoupons() {
			if (this.selectMode && this.orderAmount > 0) {
				return this.coupons.filter(c => Number(c.status) === 1 && Number(c.minAmount) <= this.orderAmount)
			}
			return this.coupons.filter(c => Number(c.status) === this.activeStatus)
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		if (options && options.mode === 'select') {
			this.selectMode = true
			this.orderAmount = Number(options.amount || 0)
			this.activeStatus = 1
		}
		this.loadCoupons()
	},
	onShow() {
		this.loadCoupons()
	},
	methods: {
		switchStatus(k) {
			this.activeStatus = k
		},
		loadCoupons() {
			this.loading = true
			api.getCoupons(0).then(res => {
				if (res.code === 0) this.coupons = res.data || []
			}).finally(() => { this.loading = false })
		},
		useCoupon(coupon) {
			if (this.selectMode) {
				uni.setStorageSync('bbq_selected_coupon', coupon)
				uni.navigateBack()
			} else {
				uni.switchTab({
					url: '/pages/index/index',
					fail: () => {
						uni.navigateTo({ url: '/pages/index/index' })
					}
				})
			}
		},
		clearSelection() {
			uni.removeStorageSync('bbq_selected_coupon')
			uni.navigateBack()
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/profile/profile' })
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;
}

.status-bar { background-color: #FFFFFF; }

.nav-bar {
	display: flex;
	align-items: center;
	height: 88rpx;
	background-color: #FFFFFF;
	padding: 0 20rpx;

	.nav-back { width: 60rpx; height: 60rpx; display: flex; align-items: center; }
	.nav-right { width: 60rpx; height: 60rpx; }
	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
	}
}

.page-body { padding: 20rpx 24rpx; }

.tab-bar {
	display: flex;
	background-color: #FFFFFF;
	border-radius: 16rpx;
	padding: 0 20rpx;
	margin-bottom: 20rpx;

	.tab-item {
		flex: 1;
		position: relative;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;

		text { font-size: 28rpx; color: #666666; }

		&.active text { color: #C13027; font-weight: bold; }

		.tab-line {
			position: absolute;
			bottom: 10rpx;
			width: 48rpx;
			height: 4rpx;
			border-radius: 2rpx;
			background-color: #C13027;
		}
	}
}

.coupon-list { padding-bottom: 40rpx; }

.coupon-card {
	display: flex;
	background: linear-gradient(135deg, #FFF5F3 0%, #FFFFFF 60%);
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	position: relative;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

	&.no-use {
		background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 60%);
	}

	&.used {
		opacity: 0.6;
		background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 60%);
	}

	.coupon-left {
		width: 220rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 30rpx 20rpx;
		position: relative;

		&::after {
			content: '';
			position: absolute;
			right: -2rpx;
			top: 50%;
			width: 24rpx;
			height: 24rpx;
			border-radius: 50%;
			background-color: #F8F5F0;
			transform: translateY(-50%);
		}

		&.fixed {
			background: linear-gradient(135deg, #C13027 0%, #E85D4B 100%);
			color: #FFFFFF;
		}

		&.discount {
			background: linear-gradient(135deg, #F5A623 0%, #F7C948 100%);
			color: #FFFFFF;
		}

		.coupon-value {
			display: flex;
			align-items: baseline;

			.currency { font-size: 26rpx; font-weight: bold; }
			.num { font-size: 56rpx; font-weight: bold; line-height: 1; }
		}

		.coupon-condition {
			margin-top: 10rpx;
			font-size: 22rpx;
			opacity: 0.9;
		}
	}

	.coupon-right {
		flex: 1;
		padding: 24rpx 24rpx 24rpx 36rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;

		.coupon-name {
			font-size: 30rpx;
			font-weight: bold;
			color: #333333;
		}

		.coupon-desc {
			margin-top: 8rpx;
			font-size: 24rpx;
			color: #999999;
		}

		.coupon-expire {
			margin-top: 6rpx;
			font-size: 22rpx;
			color: #BBBBBB;
		}

		.coupon-action {
			position: absolute;
			right: 24rpx;
			top: 50%;
			transform: translateY(-50%);
			padding: 12rpx 28rpx;
			border-radius: 30rpx;
			background-color: #C13027;
			color: #FFFFFF;
			font-size: 24rpx;
			font-weight: bold;
		}

		.coupon-status {
			position: absolute;
			right: 24rpx;
			top: 50%;
			transform: translateY(-50%);
			padding: 12rpx 28rpx;
			border-radius: 30rpx;
			background-color: #EEEEEE;
			color: #999999;
			font-size: 24rpx;
		}
	}

	.coupon-corner {
		position: absolute;
		top: 0;
		right: 0;
		width: 0;
		height: 0;
		border-top: 60rpx solid #CCCCCC;
		border-left: 60rpx solid transparent;
		opacity: 0.3;
	}
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 200rpx 0;

	.empty-text {
		margin-top: 20rpx;
		font-size: 28rpx;
		color: #999999;
	}

	.empty-btn {
		margin-top: 30rpx;
		padding: 16rpx 40rpx;
		border-radius: 40rpx;
		background-color: #C13027;
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: bold;
	}
}
</style>
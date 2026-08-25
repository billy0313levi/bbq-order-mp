<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="page-body">
			<!-- 用户信息卡 -->
			<view class="user-card">
				<view class="user-top">
					<view class="avatar" @click="changeAvatar">
						<image v-if="avatar" class="avatar-img" :src="avatar" mode="aspectFill" />
						<uni-icons v-else type="person" size="60" color="#ffffff" />
						<view class="avatar-edit">
							<uni-icons type="camera-filled" size="14" color="#ffffff" />
						</view>
					</view>
					<view class="user-info">
						<view class="user-name-row" @click="editName">
							<text class="user-name">{{ userName || '美味烧烤VIP' }}</text>
							<uni-icons type="compose" size="14" color="#999999" />
						</view>
						<view class="user-level">会员等级 · 黄金会员</view>
					</view>
				</view>
				<view class="stats-row">
					<view class="stat-item" @click="goTopup">
					<text class="stat-num">¥{{ formatMoney(balance) }}</text>
					<text class="stat-label">账户余额</text>
				</view>
					<view class="stat-divider"></view>
					<view class="stat-item" @click="goCoupon">
					<text class="stat-num">{{ couponCount }}</text>
					<text class="stat-label">优惠券</text>
				</view>
					<view class="stat-divider"></view>
					<view class="stat-item">
						<text class="stat-num">280</text>
						<text class="stat-label">积分</text>
					</view>
				</view>
			</view>

			<!-- 我的订单 -->
			<view class="order-card">
				<view class="order-head">
					<text class="order-head-title">我的订单</text>
					<view class="order-head-more" @click="goOrderList('')">
						<text>全部订单</text>
						<uni-icons type="right" size="14" color="#999999" />
					</view>
				</view>
				<view class="order-grid">
					<view class="order-entry" @click="goOrderList('dine')">
						<view class="order-entry-icon">
							<uni-icons type="shop-filled" size="32" color="#C13027" />
						</view>
						<text class="order-entry-label">堂食订单</text>
					</view>
					<view class="order-entry" @click="goOrderList('takeout')">
						<view class="order-entry-icon">
							<uni-icons type="chat" size="32" color="#2A7EF2" />
						</view>
						<text class="order-entry-label">外卖订单</text>
					</view>
					<view class="order-entry" @click="goOrderStatus(2)">
						<view class="order-entry-icon">
							<uni-icons type="paperplane" size="32" color="#F5A623" />
						</view>
						<text class="order-entry-label">制作中</text>
					</view>
					<view class="order-entry" @click="goOrderStatus(3)">
						<view class="order-entry-icon">
							<uni-icons type="checkmarkempty" size="32" color="#00C853" />
						</view>
						<text class="order-entry-label">已完成</text>
					</view>
				</view>
			</view>

			<!-- 功能列表 -->
			<view class="func-list">
				<view class="func-item" @click="goTakeout">
					<view class="func-left">
						<uni-icons type="shop-filled" size="24" color="#C13027" />
						<text class="func-label">外卖点餐</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goReserve">
					<view class="func-left">
						<uni-icons type="calendar" size="24" color="#C13027" />
						<text class="func-label">预约订位</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goTopup">
					<view class="func-left">
						<uni-icons type="wallet-filled" size="24" color="#C13027" />
						<text class="func-label">余额充值</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goCoupon">
					<view class="func-left">
						<uni-icons type="chatbubble" size="24" color="#C13027" />
						<text class="func-label">我的优惠券</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goAddr">
					<view class="func-left">
						<uni-icons type="location" size="24" color="#C13027" />
						<text class="func-label">收货地址</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goBindTable">
					<view class="func-left">
						<uni-icons type="scan" size="24" color="#C13027" />
						<text class="func-label">扫码绑桌/换桌</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
				<view class="func-item" @click="goService">
					<view class="func-left">
						<uni-icons type="help" size="24" color="#C13027" />
						<text class="func-label">联系客服</text>
					</view>
					<uni-icons type="right" size="16" color="#CCCCCC" />
				</view>
			</view>
		</view>
		<bbq-tabbar current="profile" />
	</view>
</template>

<script>
import api from '@/common/api.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			avatar: '',
			userName: '',
			balance: 0,
			couponCount: 0
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		this.loadUser()
	},
	onShow() {
		this.loadUser()
	},
	methods: {
		loadUser() {
			try {
				const user = uni.getStorageSync('bbq_user') || {}
				this.avatar = user.avatar || ''
				this.userName = user.name || ''
				this.balance = Number(user.balance || 0)
			} catch (e) {}
			api.getCouponCount().then(res => {
				if (res.code === 0) this.couponCount = res.data || 0
			})
		},
		saveUser() {
			try {
				const user = { avatar: this.avatar, name: this.userName }
				uni.setStorageSync('bbq_user', user)
			} catch (e) {}
		},
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					if (res.tempFilePaths && res.tempFilePaths[0]) {
						this.avatar = res.tempFilePaths[0]
						this.saveUser()
						uni.showToast({ title: '头像已更新', icon: 'success' })
					}
				},
				fail: () => {
					uni.showToast({ title: '已取消', icon: 'none' })
				}
			})
		},
		editName() {
			uni.showModal({
				title: '修改昵称',
				editable: true,
				placeholderText: '请输入新昵称',
				content: this.userName,
				success: (res) => {
					if (res.confirm && res.content && res.content.trim()) {
						this.userName = res.content.trim()
						this.saveUser()
						uni.showToast({ title: '昵称已更新', icon: 'success' })
					}
				}
			})
		},
		goOrderList(type) {
			const url = type
				? '/pages/order-list/order-list?type=' + type
				: '/pages/order-list/order-list'
			uni.navigateTo({ url })
		},
		goOrderStatus(status) {
			uni.navigateTo({ url: '/pages/order-list/order-list?status=' + status })
		},
		goTakeout() { uni.navigateTo({ url: '/pages/takeout/takeout' }) },
		goReserve() { uni.navigateTo({ url: '/pages/reserve/reserve' }) },
		goTopup() { uni.navigateTo({ url: '/pages/topup/topup' }) },
		goCoupon() { uni.navigateTo({ url: '/pages/coupon/coupon' }) },
		goAddr() { uni.navigateTo({ url: '/pages/address/address' }) },
		goBindTable() { uni.navigateTo({ url: '/pages/table/table' }) },
		goService() { uni.showToast({ title: '请拨打 400-000-0000', icon: 'none' }) },
		formatMoney(v) {
			return Number(v || 0).toFixed(2).replace(/\.00$/, '')
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	background-color: #F8F5F0;
	padding-bottom: calc(110rpx + env(safe-area-inset-bottom));
	overflow: hidden;
}

.status-bar {
	background: #E53935;
}

.page-body {
	background: linear-gradient(180deg, #E53935 0%, #FF8A80 200rpx, #F8F5F0 200rpx);
	padding: 0 30rpx;
	padding-bottom: 40rpx;
	overflow: hidden;
}

.user-card {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 30rpx;
	margin-top: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);

	.user-top {
		display: flex;
		align-items: center;
	}

	.avatar {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background-color: #C13027;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;

		.avatar-img {
			width: 100%;
			height: 100%;
		}

		.avatar-edit {
			position: absolute;
			right: -4rpx;
			bottom: -4rpx;
			width: 36rpx;
			height: 36rpx;
			border-radius: 50%;
			background-color: #999999;
			display: flex;
			align-items: center;
			justify-content: center;
			border: 4rpx solid #FFFFFF;
		}
	}

	.user-info {
		flex: 1;
		margin-left: 24rpx;

		.user-name-row {
			display: flex;
			align-items: center;
		}

		.user-name {
			font-size: 34rpx;
			font-weight: bold;
			color: #222222;
			margin-right: 10rpx;
		}

		.user-level {
			margin-top: 10rpx;
			font-size: 24rpx;
			color: #F5A623;
		}
	}

	.stats-row {
		margin-top: 30rpx;
		padding-top: 30rpx;
		border-top: 1rpx solid #F3F3F3;
		display: flex;
		align-items: center;

		.stat-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;

			.stat-num {
				font-size: 34rpx;
				font-weight: bold;
				color: #C13027;
			}

			.stat-label {
				margin-top: 6rpx;
				font-size: 22rpx;
				color: #999999;
			}
		}

		.stat-divider {
			width: 1rpx;
			height: 60rpx;
			background-color: #EEEEEE;
		}
	}
}

.order-card {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 30rpx;
	margin-top: 24rpx;

	.order-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;

		.order-head-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #222222;
		}

		.order-head-more {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #999999;
		}
	}

	.order-grid {
		display: flex;

		.order-entry {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;

			.order-entry-icon {
				width: 88rpx;
				height: 88rpx;
				border-radius: 50%;
				background-color: #FFF5F0;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.order-entry-label {
				margin-top: 10rpx;
				font-size: 22rpx;
				color: #333333;
			}
		}
	}
}

.func-list {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 10rpx 0;
	margin-top: 24rpx;

	.func-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 30rpx;

		.func-left {
			display: flex;
			align-items: center;

			.func-label {
				margin-left: 20rpx;
				font-size: 28rpx;
				color: #333333;
			}
		}
	}
}
</style>

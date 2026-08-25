<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">余额明细</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<view class="balance-card">
				<view class="balance-label">账户余额 (元)</view>
				<view class="balance-num">{{ formatMoney(balance) }}</view>
				<view class="balance-detail">
					<text>本金 ¥{{ formatMoney(principal) }}</text>
					<text class="sep">|</text>
					<text>赠额 ¥{{ formatMoney(gift) }}</text>
				</view>
			</view>

			<view class="list-card">
				<view class="list-head">
					<text class="list-title">交易记录</text>
				</view>
				<view v-if="history.length === 0" class="empty-state">
					<uni-icons type="wallet-filled" size="60" color="#DDDDDD" />
					<text class="empty-text">暂无交易记录</text>
				</view>
				<view v-for="item in history" :key="item.id" class="record-item">
					<view class="record-info">
						<view class="record-title">{{ item.title }}</view>
						<view class="record-time">{{ formatTime(item.time) }}</view>
					</view>
					<view class="record-amount">
						<text class="amount-text" :class="item.type">{{ item.type === 'recharge' ? '+' : '-' }}¥{{ formatMoney(item.amount) }}</text>
						<view class="record-balance">余额 ¥{{ formatMoney(item.balance) }}</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			balance: 0,
			principal: 0,
			gift: 0,
			history: []
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		this.loadData()
	},
	methods: {
		loadData() {
			try {
				const user = uni.getStorageSync('bbq_user') || {}
				this.balance = Number(user.balance || 0)
				this.principal = Number(user.principal || 0)
				this.gift = Number(user.gift || 0)
				this.history = uni.getStorageSync('bbq_balance_history') || []
			} catch (e) {}
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/profile/profile' })
		},
		formatMoney(v) {
			return Number(v || 0).toFixed(2).replace(/\.00$/, '')
		},
		formatTime(ts) {
			if (!ts) return ''
			const d = new Date(ts)
			const pad = n => String(n).padStart(2, '0')
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F5F5F5;
}

.status-bar {
	background-color: #FFFFFF;
}

.nav-bar {
	display: flex;
	align-items: center;
	height: 88rpx;
	background-color: #FFFFFF;
	padding: 0 20rpx;

	.nav-back,
	.nav-right {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;
	}
	.nav-right {
		justify-content: flex-end;
	}

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
	}
}

.page-body {
	padding: 24rpx;
}

.balance-card {
	background: linear-gradient(135deg, #C13027 0%, #E74C3C 100%);
	border-radius: 24rpx;
	padding: 40rpx 30rpx;
	color: #FFFFFF;

	.balance-label {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.85);
	}

	.balance-num {
		margin-top: 16rpx;
		font-size: 60rpx;
		font-weight: bold;
		color: #FFFFFF;
		line-height: 1.1;
	}

	.balance-detail {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.85);

		.sep {
			margin: 0 16rpx;
		}
	}
}

.list-card {
	margin-top: 24rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;

	.list-head {
		padding: 24rpx 30rpx;
		border-bottom: 1rpx solid #F3F3F3;

		.list-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #222222;
		}
	}
}

.empty-state {
	padding: 100rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;

	.empty-text {
		margin-top: 20rpx;
		font-size: 28rpx;
		color: #999999;
	}
}

.record-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #F5F5F5;

	&:last-child {
		border-bottom: none;
	}

	.record-info {
		flex: 1;

		.record-title {
			font-size: 28rpx;
			color: #333333;
			font-weight: 500;
		}

		.record-time {
			margin-top: 8rpx;
			font-size: 24rpx;
			color: #999999;
		}
	}

	.record-amount {
		text-align: right;

		.amount-text {
			font-size: 32rpx;
			font-weight: bold;

			&.recharge {
				color: #C13027;
			}

			&.consume {
				color: #333333;
			}
		}

		.record-balance {
			margin-top: 8rpx;
			font-size: 24rpx;
			color: #999999;
		}
	}
}
</style>
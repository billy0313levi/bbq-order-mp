<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">我的订单</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<!-- 类型 tab：全部 / 堂食 / 外卖 -->
			<view class="type-bar">
				<view
					class="type-item"
					:class="{ active: activeType === t.key }"
					v-for="t in typeTabs"
					:key="t.key"
					@click="switchType(t.key)"
				>
					<text>{{ t.label }}</text>
					<view class="type-line" v-if="activeType === t.key"></view>
				</view>
			</view>

			<!-- 状态 tab：全部 / 制作中 / 已完成 / 已取消 -->
			<view class="status-bar-tabs">
				<view
					class="status-item"
					:class="{ active: activeStatus === s.key }"
					v-for="s in statusTabs"
					:key="s.key"
					@click="switchStatus(s.key)"
				>
					<text>{{ s.label }}</text>
				</view>
			</view>

			<view class="order-list" v-if="filteredOrders.length > 0">
				<view class="order-card" v-for="order in filteredOrders" :key="order._id" @click="goDetail(order)">
					<view class="order-head">
						<view class="order-head-left">
							<view class="order-no">订单号: {{ order.orderNo }}</view>
							<view class="order-meta">
								<text class="order-time">{{ formatTime(order.createTime) }}</text>
								<view class="order-type-tag" :class="order.orderType === 'takeout' ? 'takeout' : 'dine'">
									{{ order.orderType === 'takeout' ? '外卖' : '堂食' }}
								</view>
							</view>
						</view>
						<text class="order-status" :style="{ color: statusColor(order.status) }">{{ statusText(order.status) }}</text>
					</view>
					<view class="order-divider"></view>
					<view class="order-content">
						<view class="order-thumbs">
							<image
								class="thumb"
								v-for="(item, index) in (order.goodsList || []).slice(0, 3)"
								:key="index"
								:src="item.img || item.image"
								mode="aspectFill"
								lazy-load
								:style="{ marginLeft: index > 0 ? '-40rpx' : '0', zIndex: 10 - index }"
							/>
							<view class="more" v-if="(order.goodsList || []).length > 3">+{{ (order.goodsList || []).length - 3 }}</view>
						</view>
						<view class="order-right">
							<view class="order-count">共{{ totalCount(order) }}件商品</view>
							<view class="order-total">¥{{ formatPrice(order.totalPrice) }}</view>
						</view>
					</view>
					<view class="order-actions" v-if="Number(order.status) === 2">
						<view class="btn-primary" @click.stop="remind(order)">催单</view>
					</view>
				</view>
			</view>

			<view class="empty" v-if="!loading && filteredOrders.length === 0">
				<text>暂无订单</text>
			</view>
			<view class="loading" v-if="loading">加载中...</view>
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
			typeTabs: [
				{ key: '', label: '全部订单' },
				{ key: 'dine', label: '堂食订单' },
				{ key: 'takeout', label: '外卖订单' }
			],
			statusTabs: [
				{ key: '', label: '全部' },
				{ key: 2, label: '制作中' },
				{ key: 3, label: '已完成' },
				{ key: 4, label: '已取消' }
			],
			activeType: '',
			activeStatus: '',
			orders: [],
			loading: false
		}
	},
	computed: {
		filteredOrders() {
			let list = this.orders || []
			if (this.activeType) {
				list = list.filter(o => o.orderType === this.activeType)
			}
			if ([1, 2, 3, 4].includes(Number(this.activeStatus))) {
				list = list.filter(o => Number(o.status) === Number(this.activeStatus))
			}
			return list
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		if (options && options.type !== undefined) {
			this.activeType = options.type
		}
		if (options && options.status !== undefined && options.status !== '') {
			this.activeStatus = isNaN(Number(options.status)) ? options.status : Number(options.status)
		}
		this.loadOrders()
	},
	onShow() {
		if (this._loaded) this.loadOrders()
		this._loaded = true
	},
	onPullDownRefresh() {
		this.loadOrders().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		switchType(k) {
			if (k === this.activeType) return
			this.activeType = k
		},
		switchStatus(k) {
			if (k === this.activeStatus) return
			this.activeStatus = k
		},
		loadOrders() {
			this.loading = true
			return api.getOrderList('').then(res => {
				if (res.code === 0) {
					const list = res.data || []
					list.forEach(o => { if (Number(o.status) === 1) o.status = 2 })
					this.orders = list
				}
			}).catch(err => {
				console.error('加载订单失败', err)
			}).finally(() => { this.loading = false })
		},
		totalCount(order) {
			return (order.goodsList || []).reduce((s, i) => s + (i.count || 0), 0)
		},
		formatPrice(price) {
			return Number(price || 0).toFixed(0)
		},
		statusText(status) {
			const map = { 2: '制作中', 3: '已完成', 4: '已取消' }
			return map[Number(status)] || '制作中'
		},
		statusColor(status) {
			const s = Number(status)
			if (s === 2) return '#F5A623'
			if (s === 3) return '#00C853'
			if (s === 4) return '#999999'
			return '#F5A623'
		},
		formatTime(value) {
			if (!value) return ''
			let date
			if (value instanceof Date) date = value
			else if (typeof value === 'number') date = new Date(value)
			else {
				date = new Date(String(value).replace(/-/g, '/'))
				if (isNaN(date.getTime())) date = new Date(value)
			}
			if (isNaN(date.getTime())) return ''
			const pad = (n) => String(n).padStart(2, '0')
			return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + pad(date.getHours()) + ':' + pad(date.getMinutes())
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/profile/profile' })
		},
		goDetail(order) {
			uni.navigateTo({ url: '/pages/order-detail/order-detail?id=' + order._id })
		},
		remind(order) {
			uni.showToast({ title: '已通知店家', icon: 'none' })
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;
	padding-bottom: calc(110rpx + env(safe-area-inset-bottom));
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

	.nav-back {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
	}

	.nav-right {
		width: 60rpx;
		height: 60rpx;
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
	padding-bottom: 40rpx;
}

.type-bar {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;

	.type-item {
		flex: 1;
		position: relative;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;

		text {
			font-size: 28rpx;
			color: #333333;
		}

		&.active {
			text { color: #C13027; font-weight: bold; }
		}

		.type-line {
			position: absolute;
			bottom: 0;
			width: 60rpx;
			height: 6rpx;
			border-radius: 3rpx;
			background-color: #C13027;
		}
	}
}

.status-bar-tabs {
	display: flex;
	align-items: center;
	background-color: #FFFFFF;
	margin-top: 2rpx;
	padding: 0 20rpx;

	.status-item {
		height: 76rpx;
		padding: 0 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;

		text {
			font-size: 26rpx;
			color: #666666;
		}

		&.active {
			text {
				color: #C13027;
				font-weight: bold;
			}
		}
	}
}

.order-list {
	padding: 20rpx 30rpx 0;
}

.order-card {
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;

	.order-head {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.order-head-left {
			display: flex;
			flex-direction: column;
		}

		.order-no {
			font-size: 26rpx;
			color: #333333;
		}

		.order-meta {
			margin-top: 10rpx;
			display: flex;
			align-items: center;
		}

		.order-time {
			font-size: 22rpx;
			color: #999999;
		}

		.order-type-tag {
			margin-left: 14rpx;
			padding: 2rpx 14rpx;
			border-radius: 20rpx;
			font-size: 20rpx;

			&.dine {
				background-color: #FFF0EB;
				color: #C13027;
			}

			&.takeout {
				background-color: #E8F5FF;
				color: #2A7EF2;
			}
		}

		.order-status {
			font-size: 28rpx;
			font-weight: bold;
		}
	}

	.order-divider {
		height: 1rpx;
		background-color: #eeeeee;
		margin: 20rpx 0;
	}

	.order-content {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.order-thumbs {
			display: flex;
			align-items: center;
			position: relative;

			.thumb {
				position: relative;
				width: 100rpx;
				height: 100rpx;
				border-radius: 12rpx;
				background-color: #f2f0eb;
				border: 2rpx solid #ffffff;
			}

			.more {
				min-width: 56rpx;
				height: 100rpx;
				line-height: 100rpx;
				margin-left: 10rpx;
				font-size: 22rpx;
				color: #666666;
				background-color: #F4F4F4;
				border-radius: 12rpx;
				padding: 0 14rpx;
				text-align: center;
			}
		}

		.order-right {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
		}

		.order-count {
			font-size: 24rpx;
			color: #666666;
		}

		.order-total {
			margin-top: 8rpx;
			font-size: 32rpx;
			font-weight: bold;
			color: #C13027;
		}
	}

	.order-actions {
		margin-top: 20rpx;
		display: flex;
		justify-content: flex-end;

		.btn-primary {
			padding: 10rpx 30rpx;
			border-radius: 30rpx;
			border: 1rpx solid #C13027;
			font-size: 24rpx;
			color: #C13027;
		}
	}
}

.empty {
	text-align: center;
	padding: 140rpx 0;
	color: #999999;
	font-size: 26rpx;
}

.loading {
	text-align: center;
	padding: 60rpx 0;
	color: #999999;
	font-size: 26rpx;
}
</style>

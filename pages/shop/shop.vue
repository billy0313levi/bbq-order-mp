<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">店铺详情</view>
			<view class="nav-right"></view>
		</view>
		<scroll-view class="page-body" scroll-y>
			<view class="shop-header">
				<image class="shop-banner" src="/static/goods/banner1.jpg" mode="aspectFill" />
				<view class="shop-overlay">
					<view class="shop-logo">
						<image src="/static/logo.png" mode="aspectFit" />
					</view>
					<view class="shop-basic">
						<view class="shop-name">美味烧烤店</view>
						<view class="shop-desc">专注炭火烧烤 · 新鲜食材 · 现烤现做</view>
						<view class="shop-rating">
							<view class="rating-stars">
								<view class="star" v-for="i in 5" :key="i" :class="{ active: i <= rating }"></view>
							</view>
							<text class="rating-num">{{ rating.toFixed(1)}}</text>
							<text class="rating-count">{{ reviewCount }}条评价</text>
						</view>
					</view>
				</view>
			</view>

			<view class="info-card">
				<view class="info-item">
					<view class="info-icon">
						<uni-icons type="location-filled" size="20" color="#C13027" />
					</view>
					<view class="info-content">
						<view class="info-label">店铺地址</view>
						<view class="info-value">北京市朝阳区XX路88号美味大厦1层</view>
					</view>
					<uni-icons type="right" size="14" color="#CCCCCC" />
				</view>
				<view class="info-item">
					<view class="info-icon">
						<uni-icons type="phone-filled" size="20" color="#C13027" />
					</view>
					<view class="info-content">
						<view class="info-label">联系电话</view>
						<view class="info-value">400-888-8888</view>
					</view>
					<uni-icons type="right" size="14" color="#CCCCCC" />
				</view>
				<view class="info-item">
					<view class="info-icon">
						<uni-icons type="calendar" size="20" color="#C13027" />
					</view>
					<view class="info-content">
						<view class="info-label">营业时间</view>
						<view class="info-value">每日 11:00 - 次日 02:00</view>
					</view>
				</view>
				<view class="info-item">
					<view class="info-icon">
						<uni-icons type="shop-filled" size="20" color="#C13027" />
					</view>
					<view class="info-content">
						<view class="info-label">店铺公告</view>
						<view class="info-value">本店选用新鲜食材，炭火现烤，欢迎下单品尝！</view>
					</view>
				</view>
			</view>

			<view class="section-title">
				<text>用户评价</text>
			</view>

			<view class="review-card" v-for="(r, i) in reviews" :key="i">
				<view class="review-head">
					<view class="reviewer-avatar" :style="{ backgroundColor: r.color }">
						<text>{{ r.name.charAt(0) }}</text>
					</view>
					<view class="reviewer-info">
						<view class="reviewer-name">{{ r.name }}</view>
						<view class="reviewer-time">{{ r.time }}</view>
					</view>
					<view class="review-rating">
						<view class="star" v-for="s in 5" :key="s" :class="{ active: s <= r.rating }"></view>
					</view>
				</view>
				<view class="review-content">{{ r.content }}</view>
				<view class="review-tags" v-if="r.tags.length > 0">
					<view class="review-tag" v-for="t in r.tags" :key="t">{{ t }}</view>
				</view>
			</view>

			<view class="empty-review" v-if="reviews.length === 0">
				<text>暂无评价</text>
			</view>

			<view class="bottom-space"></view>
		</scroll-view>

		<view class="action-bar">
			<view class="action-btn" @click="callShop">
				<uni-icons type="phone" size="18" color="#ffffff" />
				<text>联系商家</text>
			</view>
			<view class="action-btn primary" @click="goOrder">
				<uni-icons type="shop-filled" size="18" color="#ffffff" />
				<text>去点餐</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			rating: 4.8,
			reviewCount: 126,
			reviews: [
				{
					name: '美食达人',
					time: '2024-08-15',
					rating: 5,
					content: '味道非常好，肉质新鲜，烤得恰到好处！环境也不错，下次还会再来。',
					tags: ['味道好', '食材新鲜', '服务周到'],
					color: '#FF6B57'
				},
				{
					name: '吃货小王',
					time: '2024-08-10',
					rating: 4,
					content: '整体不错，就是等待时间有点长，建议可以提前预约。',
					tags: ['味道好'],
					color: '#2A7EF2'
				},
				{
					name: '烧烤爱好者',
					time: '2024-08-05',
					rating: 5,
					content: '性价比很高，份量足，推荐他们家的秘制肉串！',
					tags: ['性价比高', '份量足'],
					color: '#00C853'
				}
			]
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
	},
	methods: {
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/index/index' })
		},
		callShop() {
			uni.makePhoneCall({ phoneNumber: '4008888888' })
		},
		goOrder() {
			uni.navigateBack()
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;
	display: flex;
	flex-direction: column;
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

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
	}
}

.page-body {
	flex: 1;
}

.shop-header {
	position: relative;
	height: 360rpx;

	.shop-banner {
		width: 100%;
		height: 100%;
	}

	.shop-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0 30rpx 24rpx;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		display: flex;
		align-items: flex-end;
	}

	.shop-logo {
		width: 110rpx;
		height: 110rpx;
		border-radius: 20rpx;
		background-color: #FFFFFF;
		padding: 10rpx;
		margin-right: 24rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);

		image {
			width: 100%;
			height: 100%;
		}
	}

	.shop-basic {
		flex: 1;
		color: #FFFFFF;
	}

	.shop-name {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 8rpx;
	}

	.shop-desc {
		font-size: 24rpx;
		opacity: 0.85;
		margin-bottom: 10rpx;
	}

	.shop-rating {
		display: flex;
		align-items: center;
	}

	.rating-stars {
		display: flex;
		margin-right: 12rpx;

		.star {
			width: 20rpx;
			height: 20rpx;
			background: #DDDDDD;
			clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);

			&.active {
				background: #FFD700;
			}
		}
	}

	.rating-num {
		font-size: 26rpx;
		font-weight: bold;
		color: #FFD700;
		margin-right: 10rpx;
	}

	.rating-count {
		font-size: 22rpx;
		opacity: 0.8;
	}
}

.info-card {
	margin: 24rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	overflow: hidden;
}

.info-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #F5F5F5;

	&:last-child {
		border-bottom: none;
	}

	.info-icon {
		width: 50rpx;
		display: flex;
		justify-content: center;
		margin-right: 20rpx;
	}

	.info-content {
		flex: 1;
	}

	.info-label {
		font-size: 26rpx;
		color: #999999;
		margin-bottom: 6rpx;
	}

	.info-value {
		font-size: 28rpx;
		color: #333333;
		line-height: 1.5;
	}
}

.section-title {
	padding: 20rpx 30rpx 16rpx;
	font-size: 30rpx;
	font-weight: bold;
	color: #333333;
}

.review-card {
	margin: 0 24rpx 20rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
}

.review-head {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.reviewer-avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #FFFFFF;
	font-size: 30rpx;
	font-weight: bold;
	margin-right: 20rpx;
}

.reviewer-info {
	flex: 1;
}

.reviewer-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333333;
	margin-bottom: 4rpx;
}

.reviewer-time {
	font-size: 22rpx;
	color: #999999;
}

.review-rating {
	display: flex;

	.star {
		width: 24rpx;
		height: 24rpx;
		background: #DDDDDD;
		margin-right: 4rpx;
		clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);

		&.active {
			background: #FFD700;
		}
	}
}

.review-content {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.6;
	margin-bottom: 16rpx;
}

.review-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.review-tag {
	padding: 6rpx 18rpx;
	background-color: #FFF5F4;
	color: #C13027;
	font-size: 22rpx;
	border-radius: 20rpx;
}

.empty-review {
	text-align: center;
	padding: 80rpx 0;
	color: #999999;
	font-size: 28rpx;
}

.bottom-space {
	height: 160rpx;
}

.action-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	gap: 20rpx;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background-color: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
	flex: 1;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	background-color: #666666;
	color: #FFFFFF;
	font-size: 30rpx;
	font-weight: bold;
	border-radius: 44rpx;

	&.primary {
		background-color: #C13027;
	}
}
</style>

<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">商品详情</view>
			<view class="nav-right"></view>
		</view>

		<scroll-view class="page-body" scroll-y v-if="goods">
			<image class="goods-img" :src="goods.img || goods.image" mode="aspectFill" />
			<view class="info-section">
				<view class="goods-name">{{ goods.name }}</view>
				<view class="goods-price-row">
					<view class="price-symbol">¥</view>
					<view class="price-num">{{ formatPrice(goods.price) }}</view>
					<view class="stock" v-if="goods.stock">库存{{ goods.stock }}</view>
				</view>
				<view class="goods-desc">{{ goods.desc || goods.description || '暂无描述' }}</view>
			</view>

			<view class="detail-section">
				<view class="section-title">商品详情</view>
				<view class="detail-content">
					<view class="detail-row">
						<text class="detail-label">商品编号</text>
						<text class="detail-value">{{ goods._id }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">分类</text>
						<text class="detail-value">{{ categoryName }}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">库存</text>
						<text class="detail-value">{{ goods.stock || 0 }} 份</text>
					</view>
				</view>
			</view>

			<view class="review-section">
				<view class="review-head">
					<view class="section-title">用户评价</view>
					<view class="review-summary" v-if="reviews.length > 0">
						<text class="avg-num">{{ avgRating.toFixed(1) }}</text>
						<view class="avg-stars">
							<view class="star" v-for="s in 5" :key="s" :class="{ active: s <= Math.round(avgRating) }"></view>
						</view>
						<text class="review-count">{{ reviews.length }}条评价</text>
					</view>
					<view class="review-summary" v-else>
						<text class="review-count">暂无评价</text>
					</view>
				</view>

				<view class="review-list" v-if="reviews.length > 0">
					<view class="review-card" v-for="(r, i) in reviews" :key="i">
						<view class="review-head-row">
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
					</view>
				</view>

				<view class="write-review-btn" @click="showReviewPopup = true">
					<uni-icons type="compose" size="16" color="#C13027" />
					<text>写评价</text>
				</view>
			</view>
		</scroll-view>

		<view class="review-popup" v-if="showReviewPopup">
			<view class="popup-mask" @click="showReviewPopup = false"></view>
			<view class="popup-content">
				<view class="popup-title">发表评价</view>
				<view class="rating-picker">
					<text class="rating-label">您的评分</text>
					<view class="rating-stars">
						<view class="star" v-for="s in 5" :key="s" :class="{ active: s <= newRating }" @click="newRating = s"></view>
					</view>
				</view>
				<textarea class="review-textarea" v-model="newReviewContent" placeholder="分享您对这款商品的感受..." maxlength="200" />
				<view class="popup-actions">
					<view class="popup-btn cancel" @click="showReviewPopup = false">取消</view>
					<view class="popup-btn submit" @click="submitReview">提交评价</view>
				</view>
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
			goods: null,
			categories: [],
			reviews: [],
			showReviewPopup: false,
			newRating: 5,
			newReviewContent: '',
			reviewColors: ['#FFE4D8', '#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#E0F7FA']
		}
	},
	computed: {
		categoryName() {
			if (!this.goods || !this.goods.category_id) return '-'
			const cat = this.categories.find(c => c._id === this.goods.category_id)
			return cat ? cat.name : this.goods.category_id
		},
		avgRating() {
			if (this.reviews.length === 0) return 0
			const sum = this.reviews.reduce((s, r) => s + r.rating, 0)
			return sum / this.reviews.length
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		const id = options.id || ''
		if (!id) {
			uni.showToast({ title: '商品不存在', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 1500)
			return
		}
		this.loadCategories()
		this.loadGoods(id)
	},
	methods: {
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/index/index' })
		},
		loadCategories() {
			api.getCategories().then(res => {
				if (res.code === 0) this.categories = res.data || []
			})
		},
		loadGoods(id) {
			api.getGoods().then(res => {
				if (res.code === 0) {
					const item = (res.data || []).find(g => g._id === id)
					if (item) {
						this.goods = item
						this.loadReviews(id)
					} else {
						uni.showToast({ title: '商品不存在', icon: 'none' })
						setTimeout(() => uni.navigateBack(), 1500)
					}
				}
			})
		},
		loadReviews(goodsId) {
			const mockReviews = [
				{ name: '美食达人', rating: 5, time: '2024-08-15', content: '味道非常好，肉质鲜嫩，烤得恰到好处，下次还会再来！' },
				{ name: '吃货小王', rating: 4, time: '2024-08-10', content: '整体不错，就是稍微有点咸，希望下次能调整一下。' },
				{ name: '挑剔的嘴', rating: 5, time: '2024-08-05', content: '用料新鲜，火候到位，强烈推荐！' }
			]
			this.reviews = mockReviews.map((r, i) => ({
				...r,
				color: this.reviewColors[i % this.reviewColors.length]
			}))
		},
		formatPrice(v) {
			return Number(v || 0).toFixed(0)
		},
		submitReview() {
			if (this.newRating <= 0) {
				uni.showToast({ title: '请选择评分', icon: 'none' })
				return
			}
			if (!this.newReviewContent.trim()) {
				uni.showToast({ title: '请输入评价内容', icon: 'none' })
				return
			}
			const now = new Date()
			const y = now.getFullYear()
			const m = String(now.getMonth() + 1).padStart(2, '0')
			const d = String(now.getDate()).padStart(2, '0')
			const newReview = {
				name: '我',
				rating: this.newRating,
				time: `${y}-${m}-${d}`,
				content: this.newReviewContent.trim(),
				color: this.reviewColors[this.reviews.length % this.reviewColors.length]
			}
			this.reviews.unshift(newReview)
			this.newRating = 5
			this.newReviewContent = ''
			this.showReviewPopup = false
			uni.showToast({ title: '评价成功', icon: 'none' })
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: #F5F5F5;
}

.status-bar {
	background-color: #FFFFFF;
}

.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	background-color: #FFFFFF;
	padding: 0 20rpx;
	flex-shrink: 0;

	.nav-back {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #222222;
	}

	.nav-right {
		width: 56rpx;
	}
}

.page-body {
	flex: 1;
	overflow: hidden;
	background-color: #F5F5F5;
	padding-bottom: env(safe-area-inset-bottom);
}

.goods-img {
	width: 100%;
	height: 600rpx;
	background-color: #EEEEEE;
}

.info-section {
	background-color: #FFFFFF;
	padding: 30rpx;

	.goods-name {
		font-size: 40rpx;
		font-weight: bold;
		color: #222222;
	}

	.goods-price-row {
		margin-top: 20rpx;
		display: flex;
		align-items: baseline;

		.price-symbol {
			font-size: 28rpx;
			color: #C13027;
			font-weight: bold;
		}

		.price-num {
			font-size: 56rpx;
			color: #C13027;
			font-weight: bold;
			margin-right: 20rpx;
		}

		.stock {
			font-size: 24rpx;
			color: #999999;
		}
	}

	.goods-desc {
		margin-top: 20rpx;
		font-size: 28rpx;
		color: #666666;
		line-height: 1.6;
	}
}

.detail-section {
	margin-top: 20rpx;
	background-color: #FFFFFF;
	padding: 30rpx;

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 20rpx;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 16rpx 0;
		border-bottom: 1rpx solid #F3F3F3;

		&:last-child {
			border-bottom: none;
		}

		.detail-label {
			font-size: 26rpx;
			color: #999999;
		}

		.detail-value {
			font-size: 26rpx;
			color: #333333;
		}
	}
}

.review-section {
	margin-top: 20rpx;
	background-color: #FFFFFF;
	padding: 30rpx;

	.review-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;

		.review-summary {
			display: flex;
			align-items: center;

			.avg-num {
				font-size: 36rpx;
				font-weight: bold;
				color: #C13027;
				margin-right: 10rpx;
			}

			.avg-stars {
				display: flex;
				margin-right: 10rpx;
			}

			.review-count {
				font-size: 24rpx;
				color: #999999;
			}
		}
	}

	.review-list {
		.review-card {
			padding: 24rpx 0;
			border-bottom: 1rpx solid #F3F3F3;

			&:last-child {
				border-bottom: none;
			}

			.review-head-row {
				display: flex;
				align-items: center;
				margin-bottom: 16rpx;
			}

			.reviewer-avatar {
				width: 64rpx;
				height: 64rpx;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: 16rpx;

				text {
					font-size: 28rpx;
					color: #333333;
					font-weight: bold;
				}
			}

			.reviewer-info {
				flex: 1;

				.reviewer-name {
					font-size: 28rpx;
					font-weight: bold;
					color: #333333;
				}

				.reviewer-time {
					font-size: 22rpx;
					color: #999999;
					margin-top: 4rpx;
				}
			}

			.review-rating {
				display: flex;
			}

			.review-content {
				font-size: 26rpx;
				color: #666666;
				line-height: 1.6;
			}
		}
	}

	.write-review-btn {
		margin-top: 20rpx;
		height: 80rpx;
		background-color: #FFF5F0;
		border: 1rpx solid #C13027;
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #C13027;
		font-size: 28rpx;
		font-weight: bold;

		text {
			margin-left: 10rpx;
		}
	}
}

.star {
	width: 28rpx;
	height: 28rpx;
	background-color: #E0E0E0;
	clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);

	&.active {
		background-color: #FFB400;
	}
}

.review-popup {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;

	.popup-mask {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.popup-content {
		position: relative;
		width: 650rpx;
		background-color: #FFFFFF;
		border-radius: 24rpx;
		padding: 40rpx;

		.popup-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #222222;
			text-align: center;
			margin-bottom: 30rpx;
		}

		.rating-picker {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 30rpx;

			.rating-label {
				font-size: 28rpx;
				color: #666666;
				margin-right: 20rpx;
			}

			.rating-stars {
				display: flex;

				.star {
					width: 48rpx;
					height: 48rpx;
					margin: 0 6rpx;
				}
			}
		}

		.review-textarea {
			width: 100%;
			height: 200rpx;
			background-color: #F8F8F8;
			border-radius: 16rpx;
			padding: 20rpx;
			font-size: 28rpx;
			color: #333333;
			box-sizing: border-box;
		}

		.popup-actions {
			display: flex;
			margin-top: 30rpx;

			.popup-btn {
				flex: 1;
				height: 80rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 30rpx;
				font-weight: bold;
				border-radius: 40rpx;

				&.cancel {
					background-color: #F5F5F5;
					color: #666666;
					margin-right: 20rpx;
				}

				&.submit {
					background-color: #C13027;
					color: #FFFFFF;
				}
			}
		}
	}
}
</style>

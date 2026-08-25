<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="page-body">
			<!-- 顶部导航栏 -->
			<view class="top-nav">
				<view class="nav-back" @click="goBack">
					<uni-icons type="left" size="20" color="black" />
				</view>
				<view class="nav-title">外卖点餐</view>
				<view class="nav-right"></view>
			</view>

			<!-- 店铺 + 自取/外送 -->
			<view class="shop-row">
				<view class="shop-info" @click="openShop">
					<text class="shop-name">美味烧烤店</text>
					<uni-icons type="right" size="14" color="#999999" />
				</view>
				<view class="mode-switch">
					<view class="mode-item" :class="{ active: mode === 'pickup' }" @click="mode = 'pickup'">自取</view>
					<view class="mode-item" :class="{ active: mode === 'delivery' }" @click="mode = 'delivery'">外送</view>
				</view>
			</view>

			<!-- 菜单：左分类 + 右商品 -->
			<view class="menu-wrap">
				<scroll-view class="cate-col" scroll-y :style="{ height: colHeight + 'px' }">
					<view class="cate-list">
						<view
							class="cate-item"
							:class="{ active: activeCat === c._id }"
							v-for="c in allCategories"
							:key="c._id"
							@click="switchCat(c._id)"
						>
							<text>{{ c.name }}</text>
						</view>
					</view>
				</scroll-view>
				<scroll-view class="goods-col" scroll-y :scroll-into-view="scrollIntoId" :scroll-with-animation="true">
					<view class="goods-wrap" v-for="c in allCategories" :key="c._id" :id="'cat-' + c._id">
						<view class="goods-cate-title" v-if="showGoodsByCat(c._id).length > 0 && activeCat === c._id">{{ c.name }}</view>
						<view class="goods-card" v-for="g in showGoodsByCat(c._id)" :key="g._id" @click="goDetail(g)">
							<image class="goods-img" :src="g.img || g.image" mode="aspectFill" lazy-load />
							<view class="goods-info">
								<view class="goods-name">{{ g.name }}</view>
								<view class="goods-desc">{{ g.desc || g.description || '' }}</view>
								<view class="goods-bottom">
									<view class="goods-price">
										<text class="price-symbol">¥</text>
										<text class="price-num">{{ formatPrice(g.price) }}</text>
									</view>
									<view class="goods-actions" @click.stop>
								<view class="add-btn" v-if="(cartMap[g._id] || 0) <= 0" @click.stop="onAdd(g)">
									<text>+</text>
								</view>
								<view class="stepper" v-else @click.stop>
									<view class="step-btn minus" @click.stop="onMinus(g)">
										<text>−</text>
									</view>
									<text class="step-count">{{ cartMap[g._id] }}</text>
									<view class="step-btn plus" @click.stop="onAdd(g)">
										<text>+</text>
									</view>
								</view>
							</view>
								</view>
							</view>
						</view>
					</view>
					<view class="goods-footer">没有更多了~</view>
				</scroll-view>
			</view>
		</view>

		<!-- 底部购物车栏 -->
		<view class="cart-bar">
			<view class="cart-left" @click="toggleCartPopup">
				<view class="cart-icon-wrap">
					<uni-icons type="cart" size="28" color="#ffffff" />
					<view class="cart-badge" v-if="cartStore.totalCount > 0">{{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}</view>
				</view>
				<view class="cart-info">
					<text class="cart-label" v-if="cartStore.totalCount > 0">共{{ cartStore.totalCount }}件商品</text>
					<text class="cart-label empty" v-else>未选购商品</text>
				</view>
			</view>
			<view class="settle-btn" :class="{ disabled: cartStore.totalCount <= 0 }" @click="goSettle">
				去结算
			</view>
		</view>

		<!-- 购物车弹层 -->
		<view class="cart-mask" v-if="cartPopup" @click="cartPopup = false"></view>
		<view class="cart-popup" v-if="cartPopup">
			<view class="cart-popup-head">
				<text class="cart-popup-title">已选商品</text>
				<view class="cart-popup-clear" @click="clearCart">
					<uni-icons type="trash" size="16" color="#999999" />
					<text>清空</text>
				</view>
			</view>
			<scroll-view class="cart-popup-scroll" scroll-y>
				<view class="cart-item" v-for="item in cartStore.items" :key="item.goodsId">
					<view class="cart-item-info">
						<text class="cart-item-name">{{ item.name }}</text>
						<text class="cart-item-price">¥{{ formatPrice(item.price) }}</text>
					</view>
					<view class="stepper small">
						<view class="step-btn minus" @click="onMinusId(item.goodsId)">
							<text>−</text>
						</view>
						<text class="step-count">{{ item.count }}</text>
						<view class="step-btn plus" @click="onAddId(item.goodsId)">
							<text>+</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script>
import { useCartStore } from '@/stores/cart.js'
import api from '@/common/api.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			colHeight: 400,
			mode: 'pickup',
			activeCat: 'cat_rec',
			allCategories: [
				{ _id: 'cat_rec', name: '热销' },
				{ _id: 'cat_chuan', name: '秘制肉串' },
				{ _id: 'cat_hao', name: '生蚝套餐' }
			],
			allGoods: [],
			scrollIntoId: '',
			searchKw: '',
			cartPopup: false,
		}
	},
	computed: {
		cartStore() {
			return useCartStore()
		},
		cartMap() {
			const map = {}
			this.cartStore.items.forEach(item => {
				map[item.goodsId] = item.count
			})
			return map
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
			const headH = 140
			this.colHeight = (info.windowHeight || 667) - this.statusBarHeight - headH
		} catch (e) {
			this.statusBarHeight = 20
			this.colHeight = 400
		}
		this.loadCategories()
		this.loadGoods()
	},
	onShow() {
		this.cartStore.reload()
	},
	methods: {
		goDetail(g) {
			uni.navigateTo({ url: '/pages/goods-detail/goods-detail?id=' + g._id })
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/index/index' })
		},
		openShop() {
			uni.navigateTo({ url: '/pages/shop/shop' })
		},
		loadCategories() {
			api.getCategories().then(res => {
				if (res.code === 0 && res.data && res.data.length) {
					const reservedIds = ['cat_rec', 'cat_must']
					const filtered = res.data.filter(c => {
						if (reservedIds.includes(c._id)) return false
						if (c.name === '推荐') return false
						return true
					})
					this.allCategories = [
						{ _id: 'cat_rec', name: '热销' },
						...filtered
					]
				}
			})
		},
		loadGoods() {
			api.getGoods().then(res => {
				if (res.code === 0) this.allGoods = res.data || []
			})
		},
		switchCat(id) {
			this.activeCat = id
			this.scrollIntoId = ''
			this.$nextTick(() => {
				this.scrollIntoId = 'cat-' + id
			})
		},
		showGoodsByCat(catId) {
			if (!this.allGoods) return []
			if (this.searchKw) {
				const kw = this.searchKw.trim()
				return this.allGoods.filter(g => (g.name || '').indexOf(kw) > -1)
			}
			if (catId === 'cat_rec') return this.allGoods.slice(0, 8)
		return this.allGoods.filter(g => g.category_id === catId)
		},
		formatPrice(v) { return Number(v || 0).toFixed(0) },
		onAdd(g) { this.cartStore.addToCart(g) },
		onMinus(g) { this.cartStore.changeCount(g._id, -1) },
		onAddId(id) {
			const g = this.allGoods.find(x => x._id === id)
			if (g) this.cartStore.addToCart(g)
		},
		onMinusId(id) { this.cartStore.changeCount(id, -1) },
		toggleCartPopup() {
			if (this.cartStore.totalCount <= 0) return
			this.cartPopup = !this.cartPopup
		},
		clearCart() {
			uni.showModal({
				title: '提示',
				content: '确定清空购物车吗？',
				success: (r) => {
					if (r.confirm) {
						this.cartStore.clearCart()
						this.cartPopup = false
					}
				}
			})
		},
		goSettle() {
			if (this.cartStore.totalCount <= 0) {
				uni.showToast({ title: '请先选择商品', icon: 'none' })
				return
			}
			uni.navigateTo({ url: '/pages/confirm-order/confirm-order?mode=takeout&delivery=' + this.mode })
		},
		}
	}
</script>

<style lang="scss" scoped>
.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: #F5F5F5;
}

.status-bar { background-color: #FFFFFF; }

.page-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: #F5F5F5;
}

.top-nav {
	display: flex;
	align-items: center;
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
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: bold;
		color: #222222;
	}

	.nav-right {
		width: 60rpx;
	}
}

.shop-row {
	background-color: #FFFFFF;
	padding: 24rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.shop-info {
		display: flex;
		align-items: center;

		.shop-name {
			font-size: 30rpx;
			font-weight: bold;
			color: #222222;
			margin-right: 10rpx;
		}
	}

	.mode-switch {
		display: flex;
		background-color: #F5F5F5;
		border-radius: 30rpx;
		padding: 4rpx;

		.mode-item {
			padding: 12rpx 30rpx;
			font-size: 26rpx;
			color: #666666;
			border-radius: 30rpx;

			&.active {
				background-color: #C13027;
				color: #FFFFFF;
				font-weight: bold;
			}
		}
	}
}

.menu-wrap {
	display: flex;
	flex: 1;
	min-height: 0;
}

.cate-col {
	width: 180rpx;
	background-color: #F7F7F7;
	border-top-left-radius: 16rpx;
	overflow: hidden;
	min-height: 0;

	.cate-list { padding-bottom: 200rpx; }

	.cate-item {
		padding: 30rpx 20rpx;
		font-size: 26rpx;
		color: #333333;
		text-align: center;
		position: relative;

		&.active {
			background-color: #FFFFFF;
			color: #C13027;
			font-weight: bold;

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 6rpx;
				height: 36rpx;
				background-color: #C13027;
				border-radius: 0 3rpx 3rpx 0;
			}
		}
	}
}

.goods-col {
	flex: 1;
	background-color: #FFFFFF;
	border-top-right-radius: 16rpx;
	padding: 0 24rpx;
	padding-bottom: 150rpx;
	overflow: hidden;
	min-height: 0;

	.goods-footer {
		text-align: center;
		font-size: 24rpx;
		color: #BBBBBB;
		padding: 40rpx 0;
	}

	.goods-cate-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #222222;
		padding: 24rpx 0 12rpx;
	}
}

.goods-card {
	display: flex;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #F3F3F3;

	.goods-img {
		width: 180rpx;
		height: 180rpx;
		border-radius: 14rpx;
		flex-shrink: 0;
	}

	.goods-info {
		margin-left: 20rpx;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.goods-name {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
	}

	.goods-desc {
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #999999;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.goods-bottom {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.goods-price {
		.price-symbol { font-size: 24rpx; color: #C13027; }
		.price-num { font-size: 36rpx; font-weight: bold; color: #C13027; }
	}

	.add-btn {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		background-color: #C13027;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #FFFFFF;
		font-size: 32rpx;
		line-height: 1;
		font-weight: bold;

		text {
			display: block;
			width: 100%;
			text-align: center;
			transform: translateY(-2rpx);
		}
	}

	.stepper {
		display: flex;
		align-items: center;

		.step-btn {
			width: 52rpx;
			height: 52rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 32rpx;
			line-height: 1;

			text {
				display: block;
				width: 100%;
				text-align: center;
				transform: translateY(-2rpx);
			}

			&.minus { background-color: #F1F1F1; color: #666666; }
			&.plus  { background-color: #C13027; color: #FFFFFF; }
		}

		.step-count {
			min-width: 48rpx;
			text-align: center;
			font-size: 28rpx;
			color: #333333;
		}

		&.small {
			.step-btn {
				width: 44rpx;
				height: 44rpx;
				font-size: 28rpx;
			}
			.step-count {
				min-width: 42rpx;
				font-size: 26rpx;
			}
		}
	}
}

.cart-bar {
	position: fixed;
	left: 20rpx;
	right: 20rpx;
	// bottom: calc(50rpx + env(safe-area-inset-bottom));
	bottom: 50rpx;
	background-color: #FFFFFF;
	border-radius: 40rpx 40rpx 40rpx 40rpx;
	padding: 12rpx 12rpx 12rpx 24rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	z-index: 998;
	box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);

	.cart-left {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.cart-icon-wrap {
		position: relative;
		width: 90rpx;
		height: 90rpx;
		border-radius: 50%;
		background-color: #666666;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
		margin-top: -10rpx;
	}

	.cart-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 32rpx;
		height: 32rpx;
		line-height: 32rpx;
		padding: 0 8rpx;
		border-radius: 16rpx;
		background-color: #F5A623;
		color: #ffffff;
		font-size: 20rpx;
		text-align: center;
	}

	.cart-info { display: flex; flex-direction: column; }

	.cart-label {
		font-size: 28rpx;
		color: #333333;
		font-weight: bold;

		&.empty { color: #999999; font-weight: normal; }
	}

	.settle-btn {
		min-width: 200rpx;
		height: 88rpx;
		line-height: 88rpx;
		text-align: center;
		border-radius: 44rpx;
		background-color: #C13027;
		color: #ffffff;
		font-size: 30rpx;
		font-weight: bold;
		padding: 0 36rpx;

		&.disabled {
			background-color: #F2B8B3;
			color: rgba(255, 255, 255, 0.8);
		}
	}
}

.cart-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 997;
}

.cart-popup {
	position: fixed;
	left: 0;
	right: 0;
	bottom: calc(50rpx + env(safe-area-inset-bottom));
	background-color: #FFFFFF;
	border-radius: 24rpx 24rpx 0 0;
	z-index: 999;
	padding-bottom: 20rpx;
	max-height: 60vh;

	.cart-popup-head {
		padding: 24rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1rpx solid #F3F3F3;

		.cart-popup-title { font-size: 30rpx; font-weight: bold; color: #222222; }

		.cart-popup-clear { display: flex; align-items: center; font-size: 26rpx; color: #999999; }
	}

	.cart-popup-scroll { max-height: 60vh; }

	.cart-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 30rpx;
		border-bottom: 1rpx solid #F7F7F7;

		.cart-item-info { flex: 1; min-width: 0; }
		.cart-item-name { font-size: 28rpx; color: #222222; }
		.cart-item-price { display: block; margin-top: 6rpx; font-size: 28rpx; font-weight: bold; color: #C13027; }
	}
}

.stepper {
	display: flex;
	align-items: center;

	&.small {
		.step-btn { width: 44rpx; height: 44rpx; font-size: 28rpx; }
		.step-count { min-width: 42rpx; font-size: 26rpx; }
	}
}
</style>

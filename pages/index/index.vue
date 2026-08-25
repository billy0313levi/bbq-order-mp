<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<text class="nav-title">炭火烧烤</text>
		</view>
		<view class="page-body">
			<!-- 顶部大 banner -->
			<view class="banner-wrap">
				<swiper class="banner-swiper" circular autoplay :interval="4000" :duration="500" @change="onSwiperChange">
					<swiper-item v-for="(b, i) in banners" :key="i">
						<view class="banner-item">
							<image class="banner-img" :src="b.image" mode="aspectFill" lazy-load />
							<view class="banner-mask"></view>
						</view>
					</swiper-item>
				</swiper>
				<view class="banner-dots">
					<view class="dot" :class="{ active: bannerIndex === i }" v-for="(b, i) in banners" :key="i"></view>
				</view>
			</view>

			<!-- 扫码点餐胶囊按钮 -->
			<view class="scan-entry" @click="goScanOrMenu">
				<view class="scan-frame">
					<view class="frame-corner tl"></view>
					<view class="frame-corner tr"></view>
					<view class="frame-corner bl"></view>
					<view class="frame-corner br"></view>
					<view class="frame-line"></view>
				</view>
				<view class="scan-title">扫码点餐</view>
			</view>

			<!-- 三个方形大入口 -->
			<view class="entry-grid">
				<view class="entry-item" @click="goTakeout">
					<view class="entry-icon-wrap takeout">
						<uni-icons type="shop-filled" size="60" color="#C13027" />
					</view>
					<view class="entry-info">
						<view class="entry-title">外卖点餐</view>
						<view class="entry-sub">TAKE-OUT</view>
					</view>
				</view>
				<view class="entry-item" @click="goReserve">
					<view class="entry-icon-wrap reserve">
						<uni-icons type="calendar" size="60" color="#C13027" />
					</view>
					<view class="entry-info">
						<view class="entry-title">预约订位</view>
						<view class="entry-sub">RESERVATION</view>
					</view>
				</view>
				<view class="entry-item" @click="goTopup">
					<view class="entry-icon-wrap topup">
						<uni-icons type="wallet-filled" size="60" color="#C13027" />
					</view>
					<view class="entry-info">
						<view class="entry-title">账户充值</view>
						<view class="entry-sub">TOP-UP</view>
					</view>
				</view>
			</view>

			<!-- 热销商品 -->
			<view class="hot-section">
				<view class="hot-head">
					<text class="hot-title">热销产品</text>
					<view class="hot-more" @click="goMenu()">
						<text>更多菜品</text>
						<uni-icons type="right" size="14" color="#999999" />
					</view>
				</view>
				<view class="hot-list">
					<view class="hot-card" v-for="g in hotGoods" :key="g._id" @click="goDetail(g)">
						<image class="hot-img" :src="g.img || g.image" mode="aspectFill" lazy-load />
						<view class="hot-name">{{ g.name }}</view>
						<view class="hot-bottom">
							<view class="hot-price">
								<text class="p-sym">¥</text>
								<text class="p-num">{{ formatPrice(g.price) }}</text>
							</view>
							<view class="hot-actions" @click.stop>
								<view class="add-btn" v-if="(hotCart[g._id] || 0) <= 0" @click.stop="onAdd(g)">
									<text>+</text>
								</view>
								<view class="stepper" v-else @click.stop>
									<view class="step-btn minus" @click.stop="onMinus(g)">
										<text>−</text>
									</view>
									<text class="step-count">{{ hotCart[g._id] }}</text>
									<view class="step-btn plus" @click.stop="onAdd(g)">
										<text>+</text>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 扫码进入弹窗：显示桌号 + 点餐人数 -->
		<view class="table-mask" v-if="tablePopupVisible" @click="closeTablePopup">
			<view class="table-popup" @click.stop>
				<view class="popup-title">扫码点餐</view>
				<view class="popup-table">当前桌号</view>
				<view class="popup-table-no">{{ tableNo }}</view>
				<view class="popup-sub">请选择点餐人数</view>
				<view class="popup-people">
					<view
						class="people-item"
						:class="{ active: peopleCount === n }"
						v-for="n in peopleOptions"
						:key="n"
						:data-n="n"
						@click="onPickPeople"
					>{{ n }}</view>
				</view>
				<view class="popup-actions">
					<view class="popup-btn cancel" @click="closeTablePopup">取消</view>
					<view class="popup-btn confirm" @click="onConfirmTable">确认开始点餐</view>
				</view>
			</view>
		</view>

		<bbq-tabbar current="index" />
	</view>
</template>

<script>
import { useCartStore } from '@/stores/cart.js'
import api from '@/common/api.js'
import { parseScanTableNo } from '@/common/scan.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			bannerIndex: 0,
			tableNo: '',
			banners: [
				{ image: '/static/goods/banner1.jpg' },
				{ image: '/static/goods/banner2.jpg' },
				{ image: '/static/goods/banner3.jpg' }
			],
			hotGoods: [],
			hotCart: {},
			tablePopupVisible: false,
			peopleCount: 1,
			peopleOptions: [1, 2, 3, 4, 5, 6],
			pendingTableNo: ''
		}
	},
	computed: {
		cartStore() {
			return useCartStore()
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		// 1. 优先处理小程序码 scene 参数（格式为 t=A01）
		const sceneRaw = options && options.scene
		if (sceneRaw) {
			const scene = decodeURIComponent(sceneRaw)
			const m = scene.match(/t=([^&]+)/)
			const tableId = (m && m[1]) || ''
			if (tableId) {
				// 小程序码扫码进来：强制绑定，忽略本地旧缓存
				uni.removeStorageSync('bbq_table')
				this.cartStore.clearCart()
				this.pendingTableNo = tableId
				this.tableNo = ''
				this.peopleCount = 1
				this.tablePopupVisible = true
				this.loadHot()
				return
			}
		}
		// 2. 兼容旧普通二维码参数 ?tableId=A01
		this.bindTableFromQuery(options)
		this.loadTable()
		this.loadHot()
	},
	onShow() {
		// 小程序码扫码待确认桌台时，不覆盖 tableNo
		if (this.tablePopupVisible && this.pendingTableNo) {
			this.syncHotCart()
			return
		}
		this.loadTable()
		this.loadHot()
		this.syncHotCart()
	},
	onPullDownRefresh() {
		this.loadHot().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		goDetail(g) {
			uni.navigateTo({ url: '/pages/goods-detail/goods-detail?id=' + g._id })
		},
		onSwiperChange(e) {
			this.bannerIndex = e.detail.current
		},
		loadTable() {
			try {
				const t = uni.getStorageSync('bbq_table')
				this.tableNo = (t && t.tableNo) || ''
				// 校验本地缓存的桌台在云端是否存在，不存在则清理
				if (this.tableNo) {
					api.bindTable(this.tableNo).then(res => {
						if (res.code !== 0) {
							uni.removeStorageSync('bbq_table')
							this.tableNo = ''
							this.cartStore.clear()
						}
					}).catch(() => {})
				}
			} catch (e) {
				this.tableNo = ''
			}
			this.cartStore.reload()
			this.syncHotCart()
		},
		syncHotCart() {
			const map = {}
			this.cartStore.items.forEach(i => { map[i.goodsId] = i.count })
			this.hotCart = map
		},
		loadHot() {
			return api.getGoods().then(res => {
				if (res.code === 0) {
					this.hotGoods = (res.data || []).slice(0, 8)
					this.syncHotCart()
				}
			}).catch(() => {})
		},
		formatPrice(v) {
			return Number(v || 0).toFixed(0)
		},
		onAdd(g) {
			this.cartStore.addToCart(g)
			this.syncHotCart()
		},
		onMinus(g) {
			this.cartStore.changeCount(g._id, -1)
			this.syncHotCart()
		},
		bindTableFromQuery(options) {
			const tableId = (options && options.tableId) || ''
			if (!tableId) return
			// 普通二维码扫码进来：强制绑定
			uni.removeStorageSync('bbq_table')
			this.cartStore.clearCart()
			this.pendingTableNo = tableId
			this.tableNo = ''
			this.peopleCount = 1
			this.tablePopupVisible = true
		},

		onPickPeople(e) {
			const n = Number((e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.n) || 1)
			this.peopleCount = n
		},
		closeTablePopup() {
			this.tablePopupVisible = false
		},
		onConfirmTable() {
			const tableId = this.pendingTableNo
			if (!tableId) {
				this.tablePopupVisible = false
				return
			}
			// 云端校验桌台是否存在
			api.bindTable(tableId).then(res => {
				if (res.code !== 0) {
					uni.showToast({ title: res.msg || '桌台不存在', icon: 'none' })
					return
				}
				uni.setStorageSync('bbq_table', {
					tableNo: tableId,
					tableName: tableId + '号桌',
					peopleCount: this.peopleCount
				})
				this.tableNo = tableId
				this.cartStore.reload()
				this.tablePopupVisible = false
				uni.showToast({ title: `已绑定 ${tableId} 号桌 / ${this.peopleCount}人`, icon: 'none' })
				setTimeout(() => {
					uni.reLaunch({ url: '/pages/menu/menu' })
				}, 500)
			}).catch(() => {
				uni.showToast({ title: '网络异常，请重试', icon: 'none' })
			})
		},
		goScanOrMenu() {
			if (this.tableNo) {
				uni.showActionSheet({
					itemList: [`继续 ${this.tableNo} 号桌点餐`, '扫新的桌号'],
					success: (res) => {
						if (res.tapIndex === 0) {
							uni.reLaunch({ url: '/pages/menu/menu' })
						} else {
							this._doScan()
						}
					},
					fail: () => {}
				})
				return
			}
			this._doScan()
		},
		_doScan() {
			if (uni.scanCode) {
				uni.scanCode({
					onlyFromCamera: false,
					scanType: ['qrCode', 'barCode'],
					success: (res) => {
						const tableId = parseScanTableNo(res)
						if (!tableId) {
							uni.showToast({ title: '无效码', icon: 'none' })
							return
						}
						api.bindTable(tableId).then(r => {
						if (r.code === 0) {
							uni.removeStorageSync('bbq_table')
							uni.setStorageSync('bbq_table', { tableNo: tableId, tableName: tableId + '号桌' })
							this.tableNo = tableId
							this.cartStore.reload()
							uni.reLaunch({ url: '/pages/menu/menu' })
						} else {
							uni.showToast({ title: r.msg || '绑定失败', icon: 'none' })
						}
					})
					},
					fail: (err) => {
						const errMsg = (err && err.errMsg) || ''
						// 用户主动取消扫码：不跳转绑桌页
						if (errMsg.indexOf('cancel') > -1) {
							uni.showToast({ title: '已取消扫码', icon: 'none' })
							return
						}
						// 其他失败（如开发者工具无法调用摄像头）：跳转绑桌页
						uni.navigateTo({ url: '/pages/table/table' })
					}
				})
			} else {
				uni.navigateTo({ url: '/pages/table/table' })
			}
		},
		goMenu() {
			uni.reLaunch({ url: '/pages/menu/menu' })
		},
		goTakeout() {
			uni.navigateTo({ url: '/pages/takeout/takeout' })
		},
		goReserve() {
			uni.navigateTo({ url: '/pages/reserve/reserve' })
		},
		goTopup() {
			uni.navigateTo({ url: '/pages/topup/topup' })
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #FFFFFF;
	padding-bottom: calc(110rpx + env(safe-area-inset-bottom));
}

.status-bar {
	background: linear-gradient(180deg, #FFF0E6 0%, #FFFFFF 100%);
}

.nav-bar {
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(180deg, #FFF0E6 0%, #FFFFFF 100%);

	.nav-title {
		font-size: 40rpx;
		font-weight: bold;
		// color: #C13027;
		letter-spacing: 4rpx;
	}
}

.page-body {
	background: linear-gradient(180deg, #FFF0E6 0%, #FFFFFF 35%);
}

.banner-wrap {
	position: relative;
	width: 100%;

	.banner-swiper {
		height: 1100rpx;
		border-radius: 0;
		overflow: hidden;
	}

	.banner-item {
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.banner-img {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.banner-mask {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.2) 100%);
	}

	.banner-dots {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 20rpx;
		display: flex;
		align-items: center;
		z-index: 3;

		.dot {
			width: 10rpx;
			height: 10rpx;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.5);
			margin: 0 6rpx;

			&.active {
				background-color: #ffffff;
				width: 28rpx;
				border-radius: 5rpx;
			}
		}
	}
}

.scan-entry {
	position: relative;
	z-index: 5;
	background: #FFFFFF;
	border: 2rpx solid #C13027;
	border-radius: 25rpx;
	padding: 30rpx 40rpx;
	display: inline-flex;
	align-items: center;
	left: 50%;
	transform: translateX(-50%);
	margin-top: -55rpx;
	box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);

	.scan-frame {
		position: relative;
		width: 100rpx;
		height: 100rpx;
		margin-right: 30rpx;
	}

	.frame-corner {
		position: absolute;
		width: 22rpx;
		height: 22rpx;
		border: 8rpx solid #C13027;

		&.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
		&.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
		&.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
		&.br { bottom: 0; right: 0; border-left: none; border-top: none; }
	}

	.frame-line {
		position: absolute;
		left: 20rpx;
		right: 20rpx;
		top: 50%;
		height: 8rpx;
		background-color: #C13027;
		transform: translateY(-50%);
	}

	.scan-title {
		font-size: 80rpx;
		font-weight: bold;
		color: #C13027;
		letter-spacing: 6rpx;
	}
}

.entry-grid {
	display: flex;
	padding: 20rpx 20rpx 0;
	gap: 20rpx;

	.entry-item {
		flex: 1;
		background-color: #FFFFFF;
		border: 2rpx solid #FFE4D8;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
		display: flex;
		flex-direction: column;
		align-items: center;

		.entry-icon-wrap {
			width: 140rpx;
			height: 140rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 18rpx;

			&.takeout { background-color: #FFEEE5; }
			&.reserve { background-color: #FDEEE0; }
			&.topup   { background-color: #FFEFE6; }
		}

		.entry-info {
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		.entry-title {
			font-size: 35rpx;
			// font-weight: bold;
			color: #000000;
		}

		.entry-sub {
			margin-top: 10rpx;
			font-size: 22rpx;
			color: #000000;
			letter-spacing: 2rpx;
		}
	}
}

.hot-section {
	margin: 30rpx 24rpx 0;

	.hot-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;

		.hot-title {
			font-size: 40rpx;
			font-weight: bold;
			color: #222222;
		}

		.hot-more {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #999999;
		}
	}

	.hot-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.hot-card {
		width: 49.5%;
		background-color: #FFFFFF;
		border-radius: 20rpx;
		padding: 3rpx;
		box-sizing: border-box;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		margin-bottom: 20rpx;

		.hot-img {
			width: 100%;
			height: 240rpx;
			border-radius: 14rpx;
			background-color: #f3f0ec;
		}

		.hot-name {
			margin-top: 14rpx;
			font-size: 28rpx;
			font-weight: bold;
			color: #222222;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.hot-bottom {
			margin-top: 14rpx;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.hot-price {
			.p-sym {
				font-size: 24rpx;
				color: #C13027;
			}

			.p-num {
				font-size: 34rpx;
				font-weight: bold;
				color: #C13027;
			}
		}

		.hot-actions {
			display: flex;
			align-items: center;
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
			font-size: 40rpx;
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
				font-size: 40rpx;
				line-height: 1;
				font-weight: bold;

				text {
					display: block;
					width: 100%;
					text-align: center;
					transform: translateY(-2rpx);
				}

				&.minus {
					background-color: #F1F1F1;
					color: #666666;
				}
				&.plus  {
					background-color: #C13027;
					color: #FFFFFF;
				}
			}

			.step-count {
				min-width: 40rpx;
				text-align: center;
				font-size: 26rpx;
				color: #333333;
			}
		}
	}
}

/* 扫码进入弹窗 */
.table-mask {
	position: fixed;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.table-popup {
	width: 600rpx;
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 40rpx 32rpx 32rpx;
	box-sizing: border-box;

	.popup-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #222222;
		text-align: center;
	}

	.popup-table {
		margin-top: 30rpx;
		font-size: 26rpx;
		color: #999999;
		text-align: center;
	}

	.popup-table-no {
		margin-top: 8rpx;
		font-size: 72rpx;
		font-weight: bold;
		color: #C13027;
		text-align: center;
		letter-spacing: 4rpx;
	}

	.popup-sub {
		margin-top: 30rpx;
		font-size: 26rpx;
		color: #666666;
		text-align: center;
	}

	.popup-people {
		margin-top: 20rpx;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;

		.people-item {
			width: 30%;
			height: 80rpx;
			margin-bottom: 16rpx;
			border-radius: 12rpx;
			border: 2rpx solid #E5E5E5;
			font-size: 32rpx;
			color: #333333;
			display: flex;
			align-items: center;
			justify-content: center;

			&.active {
				border-color: #C13027;
				color: #C13027;
				background-color: #FFF0E6;
				font-weight: bold;
			}
		}
	}

	.popup-actions {
		margin-top: 30rpx;
		display: flex;
		gap: 20rpx;

		.popup-btn {
			flex: 1;
			height: 88rpx;
			border-radius: 44rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 30rpx;

			&.cancel {
				background-color: #F5F5F5;
				color: #666666;
			}

			&.confirm {
				background-color: #C13027;
				color: #FFFFFF;
				font-weight: bold;
			}
		}
	}
}
</style>

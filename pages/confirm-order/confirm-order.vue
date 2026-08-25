<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">{{ orderType === 'takeout' ? (deliveryMode === 'pickup' ? '确认订单' : '提交订单') : '提交订单' }}</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<!-- 门店自提 / 收货地址 / 桌台 -->
			<view class="addr-card" v-if="orderType === 'takeout' && deliveryMode === 'pickup'">
				<view class="addr-left">
					<uni-icons type="shop-filled" size="28" color="#C13027" />
					<view class="addr-info">
						<view class="addr-title">门店自提</view>
						<view class="addr-detail">美味烧烤店 · 朝阳区XX路88号</view>
					</view>
				</view>
				<text class="addr-tag">自取</text>
			</view>
			<view class="addr-card" v-else-if="orderType === 'takeout'" @click="chooseAddr">
				<view class="addr-left">
					<uni-icons type="location-filled" size="28" color="#C13027" />
					<view class="addr-info">
						<view class="addr-title">{{ addressText || '请选择收货地址' }}</view>
						<view class="addr-detail" v-if="address && address.name">
							<text class="addr-name">{{ address.name }}</text>
							<text class="addr-phone">{{ address.phone }}</text>
						</view>
					</view>
				</view>
				<uni-icons type="right" size="18" color="#CCCCCC" />
			</view>
			<view class="addr-card" v-else>
				<view class="addr-left">
					<uni-icons type="shop-filled" size="28" color="#C13027" />
					<view class="addr-info">
						<view class="addr-title">就餐桌台</view>
						<view class="addr-detail">{{ tableNo || '未绑定' }}</view>
					</view>
				</view>
				<text class="addr-tag">堂食</text>
			</view>

			<!-- 配送方式 + 送达时间（仅外卖模式） -->
			<view class="delivery-card" v-if="orderType === 'takeout' && deliveryMode === 'delivery'">
				<view class="delivery-row" @click="chooseDelivery">
					<text class="delivery-label">配送方式</text>
					<view class="delivery-value">
						<text>{{ deliveryMethod }}</text>
						<text class="delivery-fee">（配送费¥{{ deliveryFee }}）</text>
						<uni-icons type="right" size="14" color="#CCCCCC" />
					</view>
				</view>
				<view class="delivery-row" @click="chooseTime">
					<text class="delivery-label">送达时间</text>
					<view class="delivery-value">
						<text :class="{ placeholder: !deliveryTime }">{{ deliveryTime || '请选择送达时间' }}</text>
						<uni-icons type="right" size="14" color="#CCCCCC" />
					</view>
				</view>
			</view>

			<!-- 自提时间（仅自取模式） -->
			<view class="delivery-card" v-if="orderType === 'takeout' && deliveryMode === 'pickup'">
				<view class="delivery-row" @click="chooseTime">
					<text class="delivery-label">自提时间</text>
					<view class="delivery-value">
						<text :class="{ placeholder: !pickupTime }">{{ pickupTime || '请选择自提时间' }}</text>
						<uni-icons type="right" size="14" color="#CCCCCC" />
					</view>
				</view>
			</view>

			<!-- 商品信息 -->
			<view class="goods-card">
				<view class="card-title">商品信息</view>
				<view v-for="group in groupedItems" :key="group.catId">
					<view class="goods-cate-title">{{ group.catName }}</view>
					<view class="goods-item" v-for="item in group.items" :key="item.goodsId">
						<view class="goods-left">
							<image class="goods-img" :src="item.image" mode="aspectFill" />
							<view class="goods-info">
								<view class="goods-name">{{ item.name }}</view>
								<view class="goods-spec" v-if="itemSpice[item.goodsId]">
									口味：{{ spiceLabel(itemSpice[item.goodsId]) }}
								</view>
							</view>
						</view>
						<view class="goods-right">
							<text class="goods-price">¥{{ formatPrice(item.price) }}</text>
							<text class="goods-count">x{{ item.count }}</text>
						</view>
					</view>
				</view>
				<view class="goods-total">
					<text>共{{ cartStore.totalCount }}件商品，合计：</text>
					<text class="total-price">¥{{ cartTotal }}</text>
				</view>
			</view>

			<!-- 买家留言 / 备注 -->
			<view class="remark-card">
				<view class="remark-row">
					<text class="remark-label">客户备注</text>
					<input
						class="remark-input"
						v-model="cartStore.remark"
						type="text"
						placeholder="口味、偏好等要求"
						placeholder-class="remark-placeholder"
					/>
				</view>
				<view class="spice-row">
					<text class="remark-label">口味选择</text>
					<view class="spice-tags">
						<view
							class="spice-tag"
							:class="{ active: globalSpice === s.v }"
							v-for="s in spiceOptions"
							:key="s.v"
							@click="setGlobalSpice(s.v)"
						>{{ s.label }}</view>
					</view>
				</view>
			</view>

			<!-- 结算信息 -->
			<view class="settle-card">
				<view class="settle-row" @click="chooseCoupon">
					<text class="settle-label">优惠券</text>
					<view class="settle-value">
						<text v-if="selectedCoupon" class="coupon-discount">-¥{{ couponDiscount }}</text>
						<text v-else class="count">{{ availableCoupons.length }}张可用</text>
						<uni-icons type="right" size="14" color="#CCCCCC" />
					</view>
				</view>
				<view class="pay-method-row">
					<text class="settle-label">支付方式</text>
					<view class="pay-options">
						<view class="pay-item" :class="{ active: payMethod === 'wechat' }" @click="payMethod = 'wechat'">
							<view class="pay-icon wechat-icon"></view>
							<text class="pay-name">微信支付</text>
							<view class="pay-radio" :class="{ checked: payMethod === 'wechat' }"></view>
						</view>
						<view class="pay-item" :class="{ active: payMethod === 'balance' }" @click="payMethod = 'balance'">
							<view class="pay-icon balance-icon"></view>
							<view class="pay-name-wrap">
								<text class="pay-name">余额支付</text>
								<text class="pay-balance">¥{{ formatMoney(userBalance) }}</text>
							</view>
							<view class="pay-radio" :class="{ checked: payMethod === 'balance' }"></view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部结算栏 -->
		<view class="submit-bar">
			<view class="submit-left">
				<text class="submit-label">需支付：</text>
				<text class="submit-total">¥{{ payPrice }}</text>
			</view>
			<view class="submit-btn" :class="{ disabled: submitting }" @click="submitOrder">
				{{ submitting ? '支付中...' : '去支付' }}
			</view>
		</view>
	</view>
</template>

<script>
import { useCartStore } from '@/stores/cart.js'
import api from '@/common/api.js'
import payment from '@/common/payment.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			tableNo: '',
			address: null,
			orderType: 'dine',
			deliveryMode: 'delivery',
			allGoods: [],
			allCategories: [],
			submitting: false,
			payMethod: 'wechat',
			userBalance: 0,
			globalSpice: '',
			itemSpice: {},
			spiceOptions: [
				{ v: 'no', label: '不辣' },
				{ v: 'mi', label: '微辣' },
				{ v: 'zh', label: '中辣' },
				{ v: 'chao', label: '超辣' }
			],
			deliveryMethod: '同城配送',
			deliveryFee: 0,
			deliveryTime: '',
			pickupTime: '',
			selectedDeliveryTime: '',
			selectedPickupTime: '',
			couponCount: 3,
			availableCoupons: [],
			selectedCoupon: null
		}
	},
	computed: {
		cartStore() {
			return useCartStore()
		},
		cartTotal() {
			return this.cartStore.totalPrice.toFixed(1)
		},
		groupedItems() {
			if (!this.cartStore.items.length) return []
			const goodsMap = {}
			this.allGoods.forEach(g => { goodsMap[g._id] = g })
			const catMap = {}
			this.allCategories.forEach(c => { catMap[c._id] = c.name })
			const recIds = ['cat_rec']
			const groups = {}
			const orderedCats = []
			this.cartStore.items.forEach(item => {
				const goods = goodsMap[item.goodsId]
				let catId = 'cat_rec'
				let catName = '热销'
				if (goods && goods.category_id) {
					catId = goods.category_id
					if (catMap[catId]) catName = catMap[catId]
				}
				if (!groups[catId]) {
					groups[catId] = { catId, catName, items: [] }
					orderedCats.push(catId)
				}
				groups[catId].items.push(item)
			})
			return orderedCats.map(id => groups[id])
		},
		payPrice() {
			const total = Number(this.cartStore.totalPrice)
			const fee = (this.orderType === 'takeout' && this.deliveryMode === 'delivery') ? Number(this.deliveryFee) : 0
			let discount = 0
			if (this.selectedCoupon) {
				if (this.selectedCoupon.type === 'fixed') {
					discount = Number(this.selectedCoupon.value)
				} else if (this.selectedCoupon.type === 'discount') {
					discount = total * (1 - Number(this.selectedCoupon.value))
				}
			}
			const raw = total + fee - discount
			return Math.max(0, raw).toFixed(1)
		},
		couponDiscount() {
			if (!this.selectedCoupon) return '0'
			const total = Number(this.cartStore.totalPrice)
			if (this.selectedCoupon.type === 'fixed') return Number(this.selectedCoupon.value).toFixed(1)
			if (this.selectedCoupon.type === 'discount') return (total * (1 - Number(this.selectedCoupon.value))).toFixed(1)
			return '0'
		},
		addressText() {
			if (!this.address) return ''
			const a = this.address
			return [a.province, a.city, a.district, a.detail].filter(Boolean).join('')
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = (info.statusBarHeight || 20) + 44
		} catch (e) {
			this.statusBarHeight = 64
		}
		if (options && options.mode === 'takeout') {
			this.orderType = 'takeout'
			this.deliveryMode = options.delivery === 'pickup' ? 'pickup' : 'delivery'
		} else {
			this.orderType = 'dine'
		}
		this.loadTable()
		this.loadAddress()
		this.loadGoodsAndCategories()
		this.loadUserBalance()
		this.loadAvailableCoupons()
	},
	onShow() {
		const selected = uni.getStorageSync('bbq_selected_coupon')
		if (selected) {
			this.selectedCoupon = selected
			uni.removeStorageSync('bbq_selected_coupon')
		}
		const addrData = uni.getStorageSync('bbq_selected_address')
		if (addrData) {
			this.address = addrData
			uni.removeStorageSync('bbq_selected_address')
		}
	},
	methods: {
		loadTable() {
			try {
				const table = uni.getStorageSync('bbq_table')
				this.tableNo = (table && table.tableNo) || ''
				if (!this.tableNo) this.orderType = 'takeout'
			} catch (e) {
				this.tableNo = ''
				this.orderType = 'takeout'
			}
		},
		loadAddress() {
			try {
				const list = uni.getStorageSync('bbq_address_list') || []
				const defaultAddr = list.find(a => a.isDefault) || list[0] || null
				if (defaultAddr) {
					this.address = defaultAddr
				}
			} catch (e) {}
		},
		loadGoodsAndCategories() {
			api.getCategories().then(res => {
				if (res.code === 0 && res.data) this.allCategories = res.data
			})
			api.getGoods().then(res => {
				if (res.code === 0) this.allGoods = res.data || []
			})
		},
		formatPrice(price) {
			return Number(price || 0).toFixed(0)
		},
		spiceLabel(v) {
			const s = this.spiceOptions.find(o => o.v === v)
			return s ? s.label : ''
		},
		formatMoney(v) {
			return Number(v || 0).toFixed(2).replace(/\.00$/, '')
		},
		loadUserBalance() {
			try {
				const user = uni.getStorageSync('bbq_user') || {}
				this.userBalance = Number(user.balance || 0)
			} catch (e) {}
		},
		loadAvailableCoupons() {
			const total = Number(this.cartStore.totalPrice)
			api.getAvailableCoupons(total).then(res => {
				if (res.code === 0) {
					this.availableCoupons = res.data || []
					this.couponCount = this.availableCoupons.length
				}
			})
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/menu/menu' })
		},
		chooseAddr() {
			uni.navigateTo({ url: '/pages/address/address?mode=select' })
		},
		chooseDelivery() {
			uni.showActionSheet({
				itemList: ['同城配送 (¥0.1)', '自取'],
				success: (res) => {
					if (res.tapIndex === 0) {
						this.deliveryMethod = '同城配送'
						this.deliveryFee = 0.1
					} else {
						this.deliveryMethod = '自取'
						this.deliveryFee = 0
					}
				}
			})
		},
		generateTimeSlots(type) {
			const now = new Date()
			const slots = []
			const interval = 30
			const startOffset = type === 'pickup' ? 20 : 30
			const endHour = 24
			let cur = new Date(now.getTime() + startOffset * 60 * 1000)
			cur.setSeconds(0, 0)
			cur.setMinutes(Math.ceil(cur.getMinutes() / interval) * interval)

			const pad = n => String(n).padStart(2, '0')
			const fmt = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`

			const addHours = (d, h) => { const x = new Date(d); x.setHours(x.getHours() + h); return x }

			slots.push({
				label: type === 'pickup' ? '尽快取（约20-30分钟）' : '尽快送（约30-40分钟）',
				value: 'ASAP'
			})

			let dayLabel = ''
			const todayStart = new Date(now)
			todayStart.setHours(0, 0, 0, 0)
			const diffMs = cur - todayStart
			const diffHours = diffMs / (1000 * 3600)

			if (diffHours >= endHour) {
				cur = addHours(cur, 24)
				dayLabel = '明天 '
			} else if (diffHours >= 18) {
				dayLabel = '今天晚些 '
			} else {
				dayLabel = '今天 '
			}

			let count = 0
			while (count < 5 && cur.getHours() < endHour) {
				const end = new Date(cur.getTime() + interval * 60 * 1000)
				slots.push({
					label: `${dayLabel}${fmt(cur)}-${fmt(end)}`,
					value: `${fmt(cur)}-${fmt(end)}`
				})
				cur = end
				count++
			}
			return slots
		},
		chooseTime() {
			const type = this.deliveryMode === 'pickup' ? 'pickup' : 'delivery'
			const slots = this.generateTimeSlots(type)
			uni.showActionSheet({
				itemList: slots.map(s => s.label),
				success: (res) => {
					const slot = slots[res.tapIndex]
					if (type === 'pickup') {
						this.selectedPickupTime = slot.value
						this.pickupTime = slot.label
					} else {
						this.selectedDeliveryTime = slot.value
						this.deliveryTime = slot.label
					}
				}
			})
		},
		chooseCoupon() {
			const total = Number(this.cartStore.totalPrice)
			uni.navigateTo({ url: '/pages/coupon/coupon?mode=select&amount=' + total })
		},
		setGlobalSpice(v) {
			this.globalSpice = this.globalSpice === v ? '' : v
			if (this.globalSpice) {
				this.cartStore.items.forEach(item => {
					this.$set(this.itemSpice, item.goodsId, this.globalSpice)
				})
			}
		},
		submitOrder() {
			if (this.submitting) return
			if (this.orderType === 'dine' && !this.tableNo) {
				uni.showToast({ title: '请先扫码绑定桌台', icon: 'none' })
				return
			}
			if (this.orderType === 'takeout' && this.deliveryMode === 'delivery' && !this.address) {
				uni.showToast({ title: '请选择收货地址', icon: 'none' })
				return
			}
			if (this.orderType === 'takeout' && this.deliveryMode === 'delivery' && !this.deliveryTime) {
				uni.showToast({ title: '请选择送达时间', icon: 'none' })
				return
			}
			if (this.orderType === 'takeout' && this.deliveryMode === 'pickup' && !this.pickupTime) {
				uni.showToast({ title: '请选择自提时间', icon: 'none' })
				return
			}
			const goodsList = this.cartStore.items.map(item => ({
				goodsId: item.goodsId,
				name: item.name,
				price: item.price,
				count: item.count,
				img: item.image,
				spice: this.itemSpice[item.goodsId] || ''
			}))
			if (goodsList.length === 0) {
				uni.showToast({ title: '请先选择商品', icon: 'none' })
				return
			}
			// 余额支付检查
			if (this.payMethod === 'balance') {
				const total = Number(this.payPrice)
				if (this.userBalance < total) {
					uni.showToast({ title: '余额不足，请选择其他支付方式', icon: 'none' })
					return
				}
			}
			this.submitting = true
			const orderParams = {
				tableId: this.orderType === 'dine' ? this.tableNo : '',
				orderType: this.orderType,
				deliveryMode: this.deliveryMode,
				address: (this.orderType === 'takeout' && this.deliveryMode === 'delivery') ? this.address : '',
				goodsList,
				totalPrice: Number(this.payPrice),
				remark: this.cartStore.remark,
				deliveryTime: this.selectedDeliveryTime || '',
				pickupTime: this.selectedPickupTime || ''
			}
			api.createOrder(orderParams).then(res => {
				if (res.code === 0) {
					const orderId = res.data.orderId
					const orderNo = res.data.orderNo
					// 余额支付：先扣除余额
					if (this.payMethod === 'balance') {
						this.deductBalance(Number(this.payPrice), orderNo)
					}
					// 核销优惠券
					if (this.selectedCoupon) {
						api.useCoupon(this.selectedCoupon._id)
					}
					payment.pay({
						orderId,
						orderNo,
						totalPrice: Number(this.payPrice)
					}).then(payRes => {
						if (payRes.code === 0) {
							this.cartStore.clearCart()
							uni.showToast({ title: '下单成功', icon: 'success' })
							setTimeout(() => {
								uni.redirectTo({ url: '/pages/order-detail/order-detail?id=' + orderId })
							}, 800)
						} else {
							uni.showToast({ title: payRes.msg || '支付未完成', icon: 'none' })
							this.submitting = false
						}
					})
				} else {
					uni.showToast({ title: res.msg || '下单失败', icon: 'none' })
					this.submitting = false
				}
			}).catch(err => {
				console.error('下单失败', err)
				uni.showToast({ title: '下单失败，请重试', icon: 'none' })
				this.submitting = false
			})
		},
		deductBalance(amount, orderNo) {
			try {
				const user = uni.getStorageSync('bbq_user') || {}
				const newBalance = Number(user.balance || 0) - amount
				const usedPrincipal = Math.min(Number(user.principal || 0), amount)
				const usedGift = amount - usedPrincipal
				user.balance = Math.max(0, newBalance)
				user.principal = Math.max(0, Number(user.principal || 0) - usedPrincipal)
				user.gift = Math.max(0, Number(user.gift || 0) - usedGift)
				user.updatedAt = Date.now()
				uni.setStorageSync('bbq_user', user)
				// 记录消费历史
				const history = uni.getStorageSync('bbq_balance_history') || []
				history.unshift({
					id: 'consume_' + Date.now(),
					type: 'consume',
					title: '订单消费',
					amount: amount,
					balance: newBalance,
					time: Date.now()
				})
				uni.setStorageSync('bbq_balance_history', history)
				// 同步更新本地显示余额
				this.userBalance = newBalance
			} catch (e) {
				console.error('扣减余额失败', e)
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F5F5F5;
	padding-bottom: 160rpx;
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

.page-body {
	padding: 20rpx 24rpx;
}

.addr-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;

	.addr-left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;

		.addr-info {
			flex: 1;
			margin-left: 20rpx;
			min-width: 0;

			.addr-title {
				font-size: 30rpx;
				font-weight: bold;
				color: #222222;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.addr-detail {
				margin-top: 8rpx;
				font-size: 26rpx;
				color: #666666;
			}

			.addr-name { color: #333333; margin-right: 20rpx; }
			.addr-phone { color: #999999; }
		}
	}

	.addr-tag {
		padding: 8rpx 20rpx;
		background-color: #FFF0EB;
		border-radius: 24rpx;
		font-size: 24rpx;
		color: #C13027;
	}
}

.delivery-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 0 30rpx;
	margin-top: 20rpx;

	.delivery-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #F5F5F5;

		&:last-child { border-bottom: none; }

		.delivery-label {
			font-size: 28rpx;
			color: #333333;
		}

		.delivery-value {
			display: flex;
			align-items: center;
			font-size: 26rpx;
			color: #666666;

			.placeholder {
				color: #CCCCCC;
			}

			.delivery-fee {
				color: #999999;
				margin: 0 10rpx;
			}
		}
	}
}

.goods-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-top: 20rpx;

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 24rpx;
	}

	.goods-cate-title {
		font-size: 26rpx;
		font-weight: bold;
		color: #C13027;
		padding: 20rpx 0 10rpx;
	}

	.goods-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #F5F5F5;

		&:last-of-type { border-bottom: none; }

		.goods-left {
			display: flex;
			align-items: center;
			flex: 1;
			min-width: 0;

			.goods-img {
				width: 120rpx;
				height: 120rpx;
				border-radius: 14rpx;
				flex-shrink: 0;
			}

			.goods-info {
				margin-left: 20rpx;
				flex: 1;
				min-width: 0;

				.goods-name {
					font-size: 28rpx;
					color: #222222;
					font-weight: bold;
				}

				.goods-spec {
					margin-top: 8rpx;
					font-size: 24rpx;
					color: #C13027;
				}
			}
		}

		.goods-right {
			display: flex;
			flex-direction: column;
			align-items: flex-end;

			.goods-price {
				font-size: 30rpx;
				font-weight: bold;
				color: #333333;
			}

			.goods-count {
				margin-top: 6rpx;
				font-size: 24rpx;
				color: #999999;
			}
		}
	}

	.goods-total {
		margin-top: 24rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid #F5F5F5;
		display: flex;
		justify-content: flex-end;
		font-size: 26rpx;
		color: #666666;

		.total-price {
			color: #C13027;
			font-weight: bold;
			margin-left: 10rpx;
		}
	}
}

.remark-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-top: 20rpx;

	.remark-row {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #F5F5F5;

		.remark-label {
			width: 160rpx;
			flex-shrink: 0;
			font-size: 28rpx;
			color: #333333;
		}

		.remark-input {
			flex: 1;
			font-size: 28rpx;
			color: #333333;
			text-align: right;
		}

		.remark-placeholder {
			color: #CCCCCC;
		}
	}

	.spice-row {
		display: flex;
		align-items: center;
		padding-top: 24rpx;
		
		.remark-label {
			width: 160rpx;
			flex-shrink: 0;
			font-size: 28rpx;
			color: #333333;
		}
		.spice-tags {
			flex: 1;
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 16rpx;
		}

		.spice-tag {
			padding: 10rpx 24rpx;
			border-radius: 28rpx;
			border: 1rpx solid #E6E6E6;
			background-color: #FAFAFA;
			font-size: 24rpx;
			color: #666666;

			&.active {
				background-color: #FFF0EB;
				border-color: #C13027;
				color: #C13027;
				// font-weight: bold;
			}
		}
	}
}

.settle-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 0 30rpx;
	margin-top: 20rpx;

	.settle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #F5F5F5;

		&:last-child { border-bottom: none; }

		.settle-label {
			font-size: 28rpx;
			color: #333333;
		}

		.settle-value {
			display: flex;
			align-items: center;
			font-size: 26rpx;
			color: #666666;

			.count { color: #999999; margin-right: 10rpx; }
			.balance { color: #F5A623; margin-right: 10rpx; }
			.coupon-discount { color: #C13027; margin-right: 10rpx; font-weight: bold; }
			.coupon-discount { color: #C13027; margin-right: 10rpx; font-weight: bold; }
			.coupon-discount { color: #C13027; margin-right: 10rpx; font-weight: bold; }
			.coupon-discount { color: #C13027; margin-right: 10rpx; font-weight: bold; }
			.coupon-discount { color: #C13027; margin-right: 10rpx; font-weight: bold; }
			.go-recharge { color: #C13027; }
		}
	}

	.pay-method-row {
		display: flex;
		flex-direction: column;
		padding: 28rpx 0;

		.settle-label {
			font-size: 28rpx;
			color: #333333;
			margin-bottom: 20rpx;
		}

		.pay-options {
			display: flex;
			gap: 20rpx;
		}

		.pay-item {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16rpx 20rpx;
			border: 2rpx solid #EEEEEE;
			border-radius: 12rpx;

			&.active {
				border-color: #C13027;
				background-color: #FFFAF8;
			}

			.pay-icon {
				width: 36rpx;
				height: 36rpx;
				border-radius: 50%;
				flex-shrink: 0;

				&.wechat-icon {
					background-color: #09BB07;
				}

				&.balance-icon {
					background-color: #C13027;
				}
			}

			.pay-name-wrap {
				flex: 1;
				margin: 0 16rpx;
				text-align: center;
			}

			.pay-name {
				font-size: 28rpx;
				color: #333333;
			}

			.pay-balance {
				display: block;
				margin-top: 4rpx;
				font-size: 24rpx;
				color: #C13027;
			}

			.pay-radio {
				width: 32rpx;
				height: 32rpx;
				border: 2rpx solid #DDDDDD;
				border-radius: 50%;
				flex-shrink: 0;
				display: flex;
				align-items: center;
				justify-content: center;

				&.checked {
					border-color: #C13027;
					background-color: #FFFAF8;
				}

				&.checked::after {
					content: '';
					display: block;
					width: 14rpx;
					height: 14rpx;
					background-color: #C13027;
					border-radius: 50%;
				}
			}
		}
	}
}

.submit-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #FFFFFF;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

	.submit-left {
		display: flex;
		align-items: baseline;

		.submit-label {
			font-size: 26rpx;
			color: #666666;
		}

		.submit-total {
			margin-left: 8rpx;
			font-size: 44rpx;
			font-weight: bold;
			color: #C13027;
		}
	}

	.submit-btn {
		width: 240rpx;
		height: 100rpx;
		border-radius: 50rpx;
		background-color: #C13027;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: bold;
		color: #FFFFFF;

		&.disabled {
			opacity: 0.6;
		}
	}
}
</style>

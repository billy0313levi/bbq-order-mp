<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">账户充值</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<!-- 余额卡 -->
			<view class="balance-card">
				<view class="balance-label">当前余额 (元)</view>
				<view class="balance-num">{{ formatMoney(currentBalance) }}</view>
				<view class="balance-detail">
					<text>本金 (元) {{ formatMoney(principal) }}</text>
					<text class="sep">|</text>
					<text>赠额 (元) {{ formatMoney(gift) }}</text>
				</view>
			</view>

			<!-- 充值金额 -->
			<view class="section">
				<view class="section-head">
					<text class="section-title">充值金额</text>
					<view class="section-rule" @click="showRule">储值规则</view>
				</view>
				<view class="amount-grid">
					<view
						class="amount-item"
						v-for="a in amounts"
						:key="a.value"
						:class="{ active: selected === a.value }"
						@click="selectAmount(a.value)"
					>
						<view class="value">
							<text class="sym">¥</text>
							<text class="num">{{ a.value }}</text>
						</view>
						<view class="gift" v-if="a.gift > 0">立赠{{ a.gift }}元</view>
					</view>
				</view>
			</view>

			<!-- 自定义金额 -->
			<view class="section">
				<view class="input-row">
					<input
						class="amount-input"
						v-model="inputAmount"
						type="number"
						placeholder="请输入充值金额"
						placeholder-class="input-placeholder"
						@input="onInput"
					/>
					<text class="unit">元</text>
				</view>
				<view class="input-detail">
					<text>赠送：{{ formatMoney(giftAmount) }}元</text>
				</view>
			</view>

			<view class="link" @click="goHistory">查看余额明细</view>
		</view>

		<view class="submit-bar">
			<view class="submit-btn" :class="{ disabled: !canSubmit }" @click="submit">确定</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			currentBalance: 0,
			principal: 0,
			gift: 0,
			selected: 500,
			inputAmount: '500',
			amounts: [
				{ value: 500, gift: 50 },
				{ value: 1000, gift: 150 },
				{ value: 2000, gift: 350 }
			]
		}
	},
	computed: {
		giftAmount() {
			const v = Number(this.inputAmount) || 0
			if (v >= 2000) return 350
			if (v >= 1000) return 150
			if (v >= 500) return 50
			return 0
		},
		finalBalance() {
			return Number(this.inputAmount || 0) + this.giftAmount + this.currentBalance
		},
		canSubmit() {
			return Number(this.inputAmount) > 0
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		this.loadBalance()
	},
	methods: {
		loadBalance() {
			try {
				const info = uni.getStorageSync('bbq_user') || {}
				this.currentBalance = Number(info.balance || 0)
				this.principal = Number(info.principal || 0)
				this.gift = Number(info.gift || 0)
			} catch (e) {}
		},
		formatMoney(v) {
			return Number(v || 0).toFixed(2).replace(/\.00$/, '')
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/profile/profile' })
		},
		selectAmount(v) {
			this.selected = v
			this.inputAmount = String(v)
		},
		onInput() {
			const v = Number(this.inputAmount)
			const match = this.amounts.find(a => a.value === v)
			this.selected = match ? match.value : 0
		},
		showRule() {
			uni.showModal({
				title: '储值规则',
				content: '充值500元送50元\n充值1000元送150元\n充值2000元送350元\n赠额有效期12个月',
				showCancel: false
			})
		},
		goHistory() {
			uni.navigateTo({ url: '/pages/balance-history/balance-history' })
		},
		submit() {
			if (!this.canSubmit) {
				uni.showToast({ title: '请输入充值金额', icon: 'none' })
				return
			}
			const amount = Number(this.inputAmount)
			const gift = this.giftAmount
			uni.showModal({
				title: '确认充值',
				content: `充值金额 ¥${amount}\n赠送 ¥${gift}\n实际到账 ¥${amount + gift}`,
				success: (r) => {
					if (r.confirm) {
						try {
							const user = uni.getStorageSync('bbq_user') || {}
							const newBalance = Number(user.balance || 0) + amount + gift
							const newPrincipal = Number(user.principal || 0) + amount
							const newGift = Number(user.gift || 0) + gift
							user.balance = newBalance
							user.principal = newPrincipal
							user.gift = newGift
							user.updatedAt = Date.now()
							uni.setStorageSync('bbq_user', user)
							const history = uni.getStorageSync('bbq_balance_history') || []
							history.unshift({
								id: 'recharge_' + Date.now(),
								type: 'recharge',
								title: '账户充值',
								amount: amount + gift,
								gift: gift,
								balance: newBalance,
								time: Date.now()
							})
							uni.setStorageSync('bbq_balance_history', history)
							this.currentBalance = newBalance
							this.principal = newPrincipal
							this.gift = newGift
							uni.showToast({ title: '充值成功', icon: 'success' })
							setTimeout(() => uni.navigateBack(), 800)
						} catch (e) {
							uni.showToast({ title: '充值失败', icon: 'none' })
						}
					}
				}
			})
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
	.nav-right { justify-content: flex-end; }

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
	}
}

.page-body {
	padding: 24rpx 24rpx 160rpx;
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
		font-size: 68rpx;
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

.section {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	margin-top: 24rpx;
	padding: 30rpx;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;

	.section-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #222222;
	}

	.section-rule {
		font-size: 26rpx;
		color: #999999;
	}
}

.amount-grid {
	display: flex;
	gap: 20rpx;
}

.amount-item {
	flex: 1;
	border: 2rpx solid #EEEEEE;
	border-radius: 16rpx;
	padding: 30rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: all 0.2s;

	&.active {
		border-color: #C13027;
		background-color: #FFFAF8;
	}

	.value {
		display: flex;
		align-items: baseline;

		.sym {
			font-size: 26rpx;
			color: #C13027;
		}

		.num {
			font-size: 44rpx;
			font-weight: bold;
			color: #C13027;
			margin-left: 4rpx;
		}
	}

	.gift {
		margin-top: 14rpx;
		font-size: 24rpx;
		color: #C13027;
	}
}

.input-row {
	display: flex;
	align-items: center;
	border-bottom: 2rpx solid #EEEEEE;
	padding-bottom: 20rpx;

	.amount-input {
		flex: 1;
		font-size: 48rpx;
		font-weight: bold;
		color: #222222;
		height: 72rpx;
	}

	.input-placeholder {
		font-weight: normal;
		color: #CCCCCC;
		font-size: 32rpx;
	}

	.unit {
		font-size: 32rpx;
		color: #666666;
	}
}

.input-detail {
	margin-top: 20rpx;
	display: flex;
	justify-content: space-between;
	font-size: 26rpx;
	color: #666666;

	.total {
		color: #C13027;
		font-weight: bold;
	}
}

.link {
	margin-top: 30rpx;
	text-align: center;
	font-size: 26rpx;
	color: #999999;
	text-decoration: underline;
}

.submit-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #FFFFFF;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

	.submit-btn {
		height: 96rpx;
		line-height: 96rpx;
		text-align: center;
		background-color: #C13027;
		color: #FFFFFF;
		font-size: 34rpx;
		font-weight: bold;
		border-radius: 48rpx;

		&.disabled {
			opacity: 0.6;
		}
	}
}
</style>

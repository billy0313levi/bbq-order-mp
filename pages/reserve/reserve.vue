<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">预约订位</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<view class="form-card">
				<view class="form-item">
					<text class="label">到店日期</text>
					<picker mode="date" :value="date" :start="today" @change="onDate">
						<view class="value">
							<text :class="{ placeholder: !date }">{{ date || '请选择' }}</text>
							<uni-icons type="right" size="14" color="#CCCCCC" />
						</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="label">到店时间</text>
					<picker mode="time" :value="time" @change="onTime">
						<view class="value">
							<text :class="{ placeholder: !time }">{{ time || '请选择' }}</text>
							<uni-icons type="right" size="14" color="#CCCCCC" />
						</view>
					</picker>
				</view>
				<view class="form-item">
					<text class="label">人数</text>
					<view class="stepper-row">
					<view class="step-btn minus" :class="{ disabled: people <= 1 }" @click="minusPeople">
						<text>−</text>
					</view>
					<text class="step-num">{{ people }}人</text>
					<view class="step-btn plus" :class="{ disabled: people >= 20 }" @click="plusPeople">
						<text>+</text>
					</view>
				</view>
				</view>
				<view class="form-item">
					<text class="label">姓名</text>
					<input class="input" v-model="name" placeholder="请输入姓名" placeholder-class="ph" />
				</view>
				<view class="form-item">
					<text class="label">手机号</text>
					<input class="input" v-model="phone" type="number" placeholder="请输入手机号" placeholder-class="ph" />
				</view>
				<view class="form-item column">
					<text class="label">备注</text>
					<textarea class="textarea" v-model="remark" placeholder="如有特殊需求请备注" placeholder-class="ph" />
				</view>
			</view>

			<view class="submit-bar">
				<view class="submit-btn" @click="submit">提交预约</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		const now = new Date()
		const pad = n => String(n).padStart(2, '0')
		const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
		return {
			statusBarHeight: 20,
			today,
			date: '',
			time: '',
			people: 2,
			name: '',
			phone: '',
			remark: ''
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) { this.statusBarHeight = 20 }
	},
	methods: {
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/index/index' })
		},
		onDate(e) { this.date = e.detail.value },
		onTime(e) { this.time = e.detail.value },
		minusPeople() {
			if (this.people > 1) this.people--
		},
		plusPeople() {
			if (this.people < 20) this.people++
		},
		submit() {
			if (!this.date) return uni.showToast({ title: '请选择日期', icon: 'none' })
			if (!this.time) return uni.showToast({ title: '请选择时间', icon: 'none' })
			if (!this.name) return uni.showToast({ title: '请输入姓名', icon: 'none' })
			if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
			uni.showModal({
				title: '预约成功',
				content: `预约时间：${this.date} ${this.time}\n人数：${this.people}人`,
				showCancel: false,
				success: () => {
					setTimeout(() => uni.navigateBack(), 400)
				}
			})
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
	display: flex; align-items: center;
	height: 88rpx; background-color: #FFFFFF; padding: 0 20rpx;

	.nav-back, .nav-right { width: 60rpx; height: 60rpx; display: flex; align-items: center; }
	.nav-back { justify-content: flex-start; }
	.nav-right { justify-content: flex-end; }

	.nav-title { flex: 1; text-align: center; font-size: 34rpx; font-weight: bold; color: #333333; }
}

.page-body { padding: 30rpx 30rpx 40rpx; }

.form-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 0 30rpx;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 28rpx 0;
	border-bottom: 1rpx solid #F3F3F3;

	&.column {
		flex-direction: column;
		align-items: flex-start;

		.textarea {
			margin-top: 20rpx;
			width: 100%;
			height: 180rpx;
			background-color: #F7F7F7;
			border-radius: 12rpx;
			padding: 20rpx;
			font-size: 26rpx;
			color: #333333;
			box-sizing: border-box;
		}
	}

	&:last-child { border-bottom: none; }

	.label {
		width: 160rpx;
		flex-shrink: 0;
		font-size: 28rpx;
		color: #333333;
	}

	.value {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 28rpx;
		color: #333333;

		.placeholder { color: #CCCCCC; }
	}

	.input {
		flex: 1;
		font-size: 28rpx;
		color: #333333;
		height: 60rpx;
	}

	.ph { color: #CCCCCC; }

	.stepper-row {
		flex: 1;
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

			&.minus {
				background-color: #F1F1F1;
				color: #666666;
			}

			&.plus {
				background-color: #C13027;
				color: #FFFFFF;
			}

			&.disabled {
				opacity: 0.5;
			}
		}

		.step-num {
			min-width: 120rpx;
			text-align: center;
			font-size: 28rpx;
			color: #333333;
		}
	}
}

.submit-bar {
	margin-top: 60rpx;
	padding: 0 30rpx;

	.submit-btn {
		height: 96rpx;
		line-height: 96rpx;
		text-align: center;
		background-color: #C13027;
		color: #FFFFFF;
		font-size: 32rpx;
		font-weight: bold;
		border-radius: 48rpx;
	}
}
</style>

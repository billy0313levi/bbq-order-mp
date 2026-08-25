<template>
	<view class="page">
		<bbq-navbar title="扫码绑定桌台" />
		<view class="page-body" :style="{ paddingTop: navHeight + 'px' }">
			<view class="qr-card">
				<view class="qr-grid">
					<view class="qr-row" v-for="(row, ri) in qrPattern" :key="ri">
						<view class="qr-cell" v-for="(cell, ci) in row" :key="ci" :class="{ black: cell === 1, red: cell === 2 }"></view>
					</view>
				</view>
			</view>

			<view class="qr-title">扫码绑定桌台</view>
			<view class="qr-tip">请扫描桌上的二维码，绑定后即可点餐</view>

			<view class="scan-btn" @click="handleScan">
				<uni-icons type="scan" size="28" color="#ffffff" />
				<text class="scan-btn-text">立即扫码</text>
			</view>

			<view class="divider"></view>

			<view class="manual-wrap">
				<view class="manual-title">手动输入桌号</view>
				<view class="manual-row">
					<input
						class="manual-input"
						v-model="tableNo"
						type="text"
						placeholder="A01"
						placeholder-class="manual-placeholder"
						maxlength="6"
					/>
					<view class="manual-btn" @click="handleConfirm">确认</view>
				</view>
			</view>
		</view>
		<bbq-tabbar current="table" />
	</view>
</template>

<script>
import api from '@/common/api.js'
import { extractTableNo, parseScanTableNo } from '@/common/scan.js'

export default {
	data() {
		return {
			navHeight: 44,
			tableNo: '',
			qrPattern: [
				[1, 1, 1, 1, 1, 0, 1],
				[1, 0, 0, 0, 1, 0, 1],
				[1, 0, 2, 0, 1, 1, 0],
				[1, 0, 0, 0, 1, 0, 1],
				[1, 1, 1, 1, 1, 0, 0],
				[0, 1, 0, 1, 0, 1, 1],
				[1, 0, 1, 0, 1, 0, 1]
			]
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.navHeight = (info.statusBarHeight || 20) + 44
		} catch (e) {
			this.navHeight = 64
		}
	},
	methods: {
		parseTableNo(content) {
			// 手动输入：兼容纯桌号与各类参数格式
			return extractTableNo(content)
		},
		handleScan() {
			// 真实扫码：拉起系统扫码，识别桌台码后自动绑定
			if (typeof uni.scanCode !== 'function') {
				uni.showToast({
					title: '当前环境不支持扫码，请手动输入桌号',
					icon: 'none'
				})
				return
			}
			uni.scanCode({
				onlyFromCamera: false,
				scanType: ['qrCode', 'barCode'],
				success: (res) => {
					const no = parseScanTableNo(res)
					if (no) {
						this.bindTable(no)
					} else {
						uni.showToast({
							title: '未识别到有效桌号',
							icon: 'none'
						})
					}
				},
				fail: (err) => {
					const errMsg = (err && err.errMsg) || ''
					// 用户主动取消扫码：轻提示
					if (errMsg.indexOf('cancel') > -1) {
						uni.showToast({
							title: '已取消扫码',
							icon: 'none'
						})
						return
					}
					// 其他失败：轻提示，不弹模拟窗
					console.warn('扫码失败', err)
					uni.showToast({
						title: '扫码失败，请手动输入桌号',
						icon: 'none'
					})
				}
			})
		},
		handleConfirm() {
			const no = this.parseTableNo(this.tableNo)
			if (!no) {
				uni.showToast({
					title: '请输入正确的桌号',
					icon: 'none'
				})
				return
			}
			this.bindTable(no)
		},
		bindTable(tableId) {
			api.bindTable(tableId).then((res) => {
				if (res.code !== 0) {
					uni.showToast({
						title: res.msg || '该桌号不存在，请确认',
						icon: 'none'
					})
					return
				}
				uni.setStorageSync('bbq_table', {
					tableNo: tableId,
					tableName: tableId + '号桌'
				})
				uni.showToast({
					title: '绑定成功',
					icon: 'success'
				})
				setTimeout(() => {
					uni.reLaunch({
						url: '/pages/index/index'
					})
				}, 800)
			}).catch((err) => {
				console.error('绑定桌台失败', err)
				uni.showToast({
					title: '绑定失败，请重试',
					icon: 'none'
				})
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;

	.page-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 150rpx;
	}
}

.qr-card {
	margin-top: 60rpx;
	background-color: #ffffff;
	border: 2rpx solid #C13027;
	border-radius: 24rpx;
	padding: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;

	.qr-grid {
		width: 320rpx;
		height: 320rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.qr-row {
		display: flex;
		justify-content: space-between;
	}

	.qr-cell {
		width: 34rpx;
		height: 34rpx;
		border-radius: 4rpx;
		background-color: #ffffff;

		&.black {
			background-color: #222222;
		}

		&.red {
			background-color: #C13027;
		}
	}
}

.qr-title {
	margin-top: 40rpx;
	font-size: 40rpx;
	font-weight: bold;
	color: #222222;
}

.qr-tip {
	margin-top: 20rpx;
	font-size: 24rpx;
	color: #999999;
}

.scan-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 620rpx;
	height: 90rpx;
	margin-top: 50rpx;
	border-radius: 45rpx;
	background-color: #C13027;

	.scan-btn-text {
		margin-left: 14rpx;
		font-size: 30rpx;
		font-weight: bold;
		color: #ffffff;
	}
}

.divider {
	width: 680rpx;
	height: 1rpx;
	background-color: #e5e2dc;
	margin: 50rpx 0;
}

.manual-wrap {
	width: 680rpx;

	.manual-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #222222;
		margin-bottom: 20rpx;
	}

	.manual-row {
		display: flex;
		align-items: center;
	}

	.manual-input {
		flex: 1;
		height: 80rpx;
		background-color: #ffffff;
		border: 1rpx solid #dddddd;
		border-radius: 8rpx;
		padding: 0 24rpx;
		font-size: 30rpx;
		color: #333333;
	}

	.manual-placeholder {
		color: #bbbbbb;
	}

	.manual-btn {
		width: 140rpx;
		height: 80rpx;
		margin-left: 16rpx;
		border-radius: 8rpx;
		background-color: #F5A623;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: bold;
		color: #ffffff;
	}
}
</style>

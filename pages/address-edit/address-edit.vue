<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">{{ isEdit ? '编辑地址' : '新增地址' }}</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<view class="form-card">
				<view class="form-row">
					<text class="form-label">联系人</text>
					<input class="form-input" v-model="form.name" type="text" placeholder="请输入联系人姓名" placeholder-class="form-placeholder" />
				</view>
				<view class="form-row">
					<text class="form-label">手机号</text>
					<input class="form-input" v-model="form.phone" type="number" maxlength="11" placeholder="请输入手机号" placeholder-class="form-placeholder" />
				</view>
			</view>

			<view class="form-card">
				<view class="form-row">
					<text class="form-label">所在地区</text>
					<picker class="form-picker" mode="region" :value="regionValue" @change="onRegionChange">
						<view class="form-picker-inner">
							<text class="picker-value" :class="{ placeholder: !regionText }">{{ regionText || '请选择省/市/区' }}</text>
							<uni-icons type="right" size="16" color="#CCCCCC" />
						</view>
					</picker>
				</view>
				<view class="form-row">
					<text class="form-label">详细地址</text>
					<textarea class="form-textarea" v-model="form.detail" placeholder="请输入详细地址，如街道、门牌号" placeholder-class="form-placeholder" :maxlength="100" />
				</view>
			</view>

			<view class="form-card switch-card">
				<text class="switch-label">设为默认地址</text>
				<switch :checked="form.isDefault" @change="onSwitchChange" color="#C13027" />
			</view>
		</view>

		<view class="footer-bar">
			<view class="save-btn" @click="onSave">保存</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			isEdit: false,
			editId: '',
			form: {
				name: '',
				phone: '',
				province: '',
				city: '',
				district: '',
				detail: '',
				isDefault: false
			}
		}
	},
	computed: {
		regionText() {
			const p = this.form.province
			const c = this.form.city
			const d = this.form.district
			return [p, c, d].filter(Boolean).join(' ')
		},
		regionValue() {
			if (!this.form.province) return []
			return [this.form.province, this.form.city, this.form.district]
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		if (options && options.id) {
			this.isEdit = true
			this.editId = options.id
			this.loadDetail(options.id)
		}
	},
	methods: {
		loadDetail(id) {
			try {
				const list = uni.getStorageSync('bbq_address_list') || []
				const item = list.find(i => i.id === id)
				if (item) {
					this.form = {
						name: item.name || '',
						phone: item.phone || '',
						province: item.province || '',
						city: item.city || '',
						district: item.district || '',
						detail: item.detail || '',
						isDefault: item.isDefault || false
					}
				}
			} catch (e) {}
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/address/address' })
		},
		onRegionChange(e) {
			const vals = e.detail.value
			if (vals && vals.length >= 3) {
				this.form.province = vals[0]
				this.form.city = vals[1]
				this.form.district = vals[2]
			}
		},
		onSwitchChange(e) {
			this.form.isDefault = e.detail.value
		},
		onSave() {
			if (!this.form.name.trim()) {
				uni.showToast({ title: '请输入联系人', icon: 'none' })
				return
			}
			if (!this.form.phone.trim()) {
				uni.showToast({ title: '请输入手机号', icon: 'none' })
				return
			}
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title: '手机号格式不正确', icon: 'none' })
				return
			}
			if (!this.form.province || !this.form.city || !this.form.district) {
				uni.showToast({ title: '请选择所在地区', icon: 'none' })
				return
			}
			if (!this.form.detail.trim()) {
				uni.showToast({ title: '请输入详细地址', icon: 'none' })
				return
			}
			try {
				let list = uni.getStorageSync('bbq_address_list') || []
				if (this.form.isDefault) {
					list.forEach(i => { i.isDefault = false })
				}
				if (this.isEdit) {
					const idx = list.findIndex(i => i.id === this.editId)
					if (idx > -1) {
						list[idx] = { ...list[idx], ...this.form }
					}
				} else {
					const newItem = {
						id: 'addr_' + Date.now(),
						...this.form
					}
					if (list.length === 0) newItem.isDefault = true
					list.push(newItem)
				}
				if (list.filter(i => i.isDefault).length === 0 && list.length > 0) {
					list[0].isDefault = true
				}
				uni.setStorageSync('bbq_address_list', list)
				uni.showToast({ title: '保存成功', icon: 'success' })
				setTimeout(() => uni.navigateBack(), 500)
			} catch (e) {
				uni.showToast({ title: '保存失败', icon: 'none' })
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F5F5F5;
	padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
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
	padding: 20rpx 24rpx;
}

.form-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 0 30rpx;
	margin-bottom: 20rpx;

	.form-row {
		display: flex;
		align-items: flex-start;
		padding: 28rpx 0;
		border-bottom: 1rpx solid #F5F5F5;

		&:last-child {
			border-bottom: none;
		}
	}

	.form-label {
		width: 180rpx;
		flex-shrink: 0;
		font-size: 28rpx;
		color: #333333;
		line-height: 44rpx;
	}

	.form-input {
		flex: 1;
		font-size: 28rpx;
		color: #222222;
		height: 44rpx;
	}

	.form-textarea {
		flex: 1;
		font-size: 28rpx;
		color: #222222;
		width: 100%;
		min-height: 120rpx;
		line-height: 1.5;
	}

	.form-placeholder {
		color: #CCCCCC;
		font-size: 28rpx;
	}

	.form-picker {
		flex: 1;

		.form-picker-inner {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
	}

	.picker-value {
		font-size: 28rpx;
		color: #222222;

		&.placeholder {
			color: #CCCCCC;
		}
	}
}

.switch-card {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 30rpx !important;

	.switch-label {
		font-size: 28rpx;
		color: #333333;
	}
}

.footer-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #FFFFFF;
	padding: 20rpx 30rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));

	.save-btn {
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

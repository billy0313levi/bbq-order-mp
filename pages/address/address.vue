<template>
	<view class="page">
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-bar">
			<view class="nav-back" @click="goBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-title">{{ selectMode ? '选择收货地址' : '收货地址' }}</view>
			<view class="nav-right"></view>
		</view>
		<view class="page-body">
			<view class="addr-list" v-if="addressList.length > 0">
				<view class="addr-card" v-for="(item, index) in addressList" :key="index" @click="onSelect(item)">
					<view class="addr-main">
						<view class="addr-top">
							<text class="addr-name">{{ item.name }}</text>
							<text class="addr-phone">{{ item.phone }}</text>
							<view class="addr-tag" v-if="item.isDefault">默认</view>
						</view>
						<view class="addr-detail">{{ item.province }}{{ item.city }}{{ item.district }}{{ item.detail }}</view>
					</view>
					<view class="addr-actions">
						<view class="action-item" v-if="selectMode">
							<text>选择</text>
						</view>
						<view class="action-item" @click.stop="onEdit(item)">
							<uni-icons type="compose" size="18" color="#666666" />
							<text>编辑</text>
						</view>
						<view class="action-item" @click.stop="onDelete(item, index)">
							<uni-icons type="trash" size="18" color="#999999" />
							<text>删除</text>
						</view>
						<view class="action-item" @click.stop="onSetDefault(item, index)">
							<uni-icons :type="item.isDefault ? 'checkbox-filled' : 'circle'" size="18" :color="item.isDefault ? '#C13027' : '#999999'" />
							<text :class="{ active: item.isDefault }">默认</text>
						</view>
					</view>
				</view>
			</view>
			<view class="addr-empty" v-else>
				<uni-icons type="location" size="80" color="#CCCCCC" />
				<text class="empty-text">暂无收货地址</text>
			</view>
		</view>
		<view class="footer-bar">
			<view class="add-btn" @click="onAdd">+ 新增收货地址</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			addressList: [],
			selectMode: false
		}
	},
	onLoad(options) {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		if (options && options.mode === 'select') {
			this.selectMode = true
		}
		this.loadList()
	},
	onShow() {
		this.loadList()
	},
	methods: {
		loadList() {
			try {
				const list = uni.getStorageSync('bbq_address_list')
				this.addressList = Array.isArray(list) ? list : []
			} catch (e) {
				this.addressList = []
			}
		},
		saveList() {
			try {
				uni.setStorageSync('bbq_address_list', this.addressList)
			} catch (e) {}
		},
		goBack() {
			const pages = getCurrentPages()
			if (pages.length > 1) uni.navigateBack()
			else uni.reLaunch({ url: '/pages/profile/profile' })
		},
		onAdd() {
			uni.navigateTo({ url: '/pages/address-edit/address-edit' })
		},
		onEdit(item) {
			uni.navigateTo({ url: '/pages/address-edit/address-edit?id=' + item.id })
		},
		onDelete(item, index) {
			uni.showModal({
				title: '提示',
				content: '确定删除该收货地址吗？',
				success: (r) => {
					if (r.confirm) {
						this.addressList.splice(index, 1)
						this.saveList()
						uni.showToast({ title: '删除成功', icon: 'success' })
					}
				}
			})
		},
		onSetDefault(item, index) {
			this.addressList.forEach(i => { i.isDefault = false })
			this.addressList[index].isDefault = true
			this.saveList()
			uni.showToast({ title: '已设为默认', icon: 'success' })
		},
		onSelect(item) {
			try {
				uni.setStorageSync('bbq_selected_address', item)
			} catch (e) {}
			uni.navigateBack()
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

.addr-list {
	padding-bottom: 20rpx;
}

.addr-card {
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;

	.addr-main {
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid #F5F5F5;
	}

	.addr-top {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.addr-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #222222;
		margin-right: 20rpx;
	}

	.addr-phone {
		font-size: 28rpx;
		color: #666666;
	}

	.addr-tag {
		margin-left: 16rpx;
		padding: 4rpx 14rpx;
		background-color: #C13027;
		border-radius: 6rpx;
		font-size: 20rpx;
		color: #FFFFFF;
	}

	.addr-detail {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.5;
	}

	.addr-actions {
		display: flex;
		align-items: center;
		padding-top: 24rpx;
		gap: 40rpx;

		.action-item {
			display: flex;
			align-items: center;
			font-size: 26rpx;
			color: #666666;

			text {
				margin-left: 8rpx;
			}

			text.active {
				color: #C13027;
			}
		}
	}
}

.addr-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 200rpx;

	.empty-text {
		margin-top: 30rpx;
		font-size: 28rpx;
		color: #999999;
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

	.add-btn {
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

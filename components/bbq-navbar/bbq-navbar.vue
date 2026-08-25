<template>
	<view class="bbq-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="nav-inner">
			<view class="nav-side" @click="goBack" v-if="showBack">
				<uni-icons type="left" size="22" color="#333333" />
			</view>
			<view class="nav-side" v-else></view>
			<view class="nav-title">{{ title }}</view>
			<view class="nav-side"></view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'BbqNavbar',
	props: {
		title: {
			type: String,
			default: ''
		},
		showBack: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			statusBarHeight: 20
		}
	},
	created() {
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
			if (pages.length > 1) {
				uni.navigateBack()
			} else {
				uni.reLaunch({
					url: '/pages/index/index'
				})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.bbq-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 999;
	background-color: #F8F5F0;

	.nav-inner {
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20rpx;
	}

	.nav-side {
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
</style>

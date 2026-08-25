<template>
	<view class="bbq-tabbar">
		<view
			class="tab-item"
			v-for="item in tabs"
			:key="item.key"
			:class="{ active: current === item.key }"
			@click="switchTab(item.key)"
		>
			<view class="tab-icon-wrap">
				<uni-icons :type="item.icon" size="24" :color="current === item.key ? '#C13027' : '#999999'" />
			</view>
			<text class="tab-text">{{ item.label }}</text>
		</view>
	</view>
</template>

<script>
const TAB_MAP = {
	index: '/pages/index/index',
	menu: '/pages/menu/menu',
	profile: '/pages/profile/profile'
}

export default {
	name: 'BbqTabbar',
	props: {
		current: {
			type: String,
			default: 'index'
		}
	},
	data() {
		return {
			tabs: [
				{ key: 'index', label: '首页', icon: 'home' },
				{ key: 'menu', label: '扫码点餐', icon: 'shop' },
				{ key: 'profile', label: '个人中心', icon: 'person' }
			]
		}
	},
	methods: {
		switchTab(key) {
			if (key === this.current) return
			uni.reLaunch({
				url: TAB_MAP[key]
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.bbq-tabbar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	background-color: #ffffff;
	border-top: 1rpx solid #eeeeee;
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);

	.tab-item {
		flex: 1;
		height: 110rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		&.active {
			.tab-text {
				color: #C13027;
				font-weight: bold;
			}
		}
	}

	.tab-icon-wrap {
		position: relative;
	}

	.tab-text {
		margin-top: 6rpx;
		font-size: 22rpx;
		color: #999999;
	}
}
</style>

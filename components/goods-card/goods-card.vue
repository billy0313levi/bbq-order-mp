<template>
	<view class="goods-card">
		<image class="goods-img" :src="goods.img || goods.image" mode="aspectFill" lazy-load />
		<view class="goods-info">
			<view class="goods-name">{{ goods.name }}</view>
			<view class="goods-desc">{{ goods.desc || goods.description }}</view>
			<view class="goods-price">
				<text class="price-symbol">¥</text>
				<text class="price-num">{{ formatPrice(goods.price) }}</text>
			</view>
		</view>
		<view class="goods-add" v-if="count <= 0" @click.stop="handleAdd">
			<uni-icons type="plus" size="22" color="#ffffff" />
		</view>
		<view class="goods-stepper" v-else @click.stop>
			<view class="step-btn step-minus" @click.stop="handleMinus">
				<uni-icons type="minus" size="16" color="#666666" />
			</view>
			<text class="step-count">{{ count }}</text>
			<view class="step-btn step-plus" @click.stop="handleAdd">
				<uni-icons type="plus" size="16" color="#ffffff" />
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'GoodsCard',
	props: {
		goods: {
			type: Object,
			default: () => ({})
		},
		count: {
			type: Number,
			default: 0
		}
	},
	methods: {
		formatPrice(price) {
			return Number(price || 0).toFixed(0)
		},
		handleAdd() {
			this.$emit('add', this.goods)
		},
		handleMinus() {
			this.$emit('minus', this.goods)
		}
	}
}
</script>

<style lang="scss" scoped>
.goods-card {
	display: flex;
	align-items: center;
	background-color: #ffffff;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;

	.goods-img {
		width: 150rpx;
		height: 150rpx;
		border-radius: 12rpx;
		flex-shrink: 0;
		background-color: #f2f0eb;
	}

	.goods-info {
		flex: 1;
		margin-left: 20rpx;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.goods-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 5rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.goods-desc {
		font-size: 22rpx;
		color: #999999;
		margin-bottom: 12rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.goods-price {
		color: #C13027;
		font-weight: bold;

		.price-symbol {
			font-size: 26rpx;
			margin-right: 2rpx;
		}

		.price-num {
			font-size: 36rpx;
		}
	}

	.goods-add {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background-color: #F5A623;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-left: 20rpx;
	}

	.goods-stepper {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: 20rpx;

		.step-btn {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
		}

		.step-minus {
			background-color: #ffffff;
			border: 2rpx solid #dddddd;
		}

		.step-plus {
			background-color: #F5A623;
			border: 2rpx solid #F5A623;
		}

		.step-count {
			min-width: 52rpx;
			text-align: center;
			font-size: 30rpx;
			font-weight: bold;
			color: #222222;
		}
	}
}
</style>

<template>
	<view class="page">
		<bbq-navbar title="桌号管理" :show-back="true" />
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		<view class="nav-placeholder"></view>

		<!-- 操作区 -->
		<view class="action-bar">
			<view class="input-wrap">
				<input class="table-input" v-model="newTableNo" placeholder="桌号，如 A01" maxlength="20" />
				<view class="capacity-wrap">
					<text class="cap-label">容纳</text>
					<view class="cap-step" @click="changeCap(-1)">-</view>
					<text class="cap-val">{{ newCapacity }}</text>
					<view class="cap-step" @click="changeCap(1)">+</view>
					<text class="cap-label">人</text>
				</view>
			</view>
			<view class="btn-primary" :class="{ disabled: generating }" @click="onGenerate">
				{{ generating ? '生成中...' : '生成小程序码' }}
			</view>
			<view class="btn-secondary" @click="onBatchVisible">批量生成</view>
		</view>

		<!-- 列表 -->
		<view class="list-wrap">
			<view class="list-head">
				<text class="list-title">桌号列表 ({{ total }})</text>
				<view class="list-refresh" @click="loadList">
					<uni-icons type="refresh" size="16" color="#999" />
					<text>刷新</text>
				</view>
			</view>

			<view v-if="loading" class="empty">加载中...</view>
			<view v-else-if="list.length === 0" class="empty">暂无桌号，请先生成</view>

			<view v-else class="grid">
				<view class="card" v-for="item in list" :key="item._id">
					<view class="card-head">
						<text class="card-table">{{ item.tableNo }}</text>
						<text class="card-cap">{{ item.capacity }}人桌</text>
					</view>
					<image
						class="card-qrcode"
						:src="item.qrcodeImg"
						mode="aspectFit"
						:data-id="item._id"
						@click="onPreviewQrcode"
						lazy-load
					/>
					<view class="card-meta">
						<text class="meta-label">创建时间</text>
						<text class="meta-val">{{ formatTime(item.createTime) }}</text>
					</view>
					<view class="card-actions">
						<view class="card-btn download" :data-id="item._id" @click="onDownload">下载</view>
						<view class="card-btn delete" :data-id="item._id" @click="onRemove">删除</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 批量生成弹窗 -->
		<view class="mask" v-if="batchVisible" @click="onCloseBatch">
			<view class="batch-popup" @click.stop="stopPropagation">
				<view class="batch-title">批量生成</view>
				<view class="batch-sub">格式：每行一个桌号，如 A01,A02... 或 B01-B10（支持区间）</view>
				<textarea
					class="batch-textarea"
					v-model="batchText"
					placeholder="每行一个桌号，如 A01、A02 或 A01-A06"
					maxlength="-1"
				/>
				<view class="batch-row">
					<text class="cap-label">容纳</text>
					<view class="cap-step" @click="batchCap(-1)">-</view>
					<text class="cap-val">{{ batchCapacity }}</text>
					<view class="cap-step" @click="batchCap(1)">+</view>
					<text class="cap-label">人</text>
				</view>
				<view class="batch-actions">
					<view class="popup-btn cancel" @click="onCloseBatch">取消</view>
					<view class="popup-btn confirm" :class="{ disabled: batchLoading }" @click="onBatchGenerate">
						{{ batchLoading ? '生成中...' : '开始生成' }}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import api from '@/common/api.js'

export default {
	data() {
		return {
			statusBarHeight: 20,
			list: [],
			total: 0,
			loading: false,
			newTableNo: '',
			newCapacity: 4,
			generating: false,
			batchVisible: false,
			batchText: '',
			batchCapacity: 4,
			batchLoading: false
		}
	},
	onLoad() {
		try {
			const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
			this.statusBarHeight = info.statusBarHeight || 20
		} catch (e) {
			this.statusBarHeight = 20
		}
		this.loadList()
	},
	onShow() {
		this.loadList()
	},
	methods: {
		loadList() {
			this.loading = true
			api.getTableList({ page: 1, pageSize: 200 }).then(res => {
				this.loading = false
				if (res.code === 0) {
					this.list = res.data.list || []
					this.total = res.data.total || 0
				} else {
					uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
				}
			}).catch(() => {
				this.loading = false
			})
		},
		changeCap(delta) {
			const v = this.newCapacity + delta
			if (v >= 1 && v <= 20) this.newCapacity = v
		},
		batchCap(delta) {
			const v = this.batchCapacity + delta
			if (v >= 1 && v <= 20) this.batchCapacity = v
		},
		onGenerate() {
			const tableNo = (this.newTableNo || '').trim()
			if (!tableNo) {
				uni.showToast({ title: '请输入桌号', icon: 'none' })
				return
			}
			if (this.generating) return
			this.generating = true
			uni.showLoading({ title: '生成中', mask: true })
			api.generateTableQrcode(tableNo, this.newCapacity).then(res => {
				this.generating = false
				uni.hideLoading()
				if (res.code === 0) {
					uni.showToast({ title: '生成成功', icon: 'success' })
					this.newTableNo = ''
					this.loadList()
				} else {
					uni.showToast({ title: res.msg || '生成失败', icon: 'none' })
				}
			}).catch(() => {
				this.generating = false
				uni.hideLoading()
			})
		},
		onBatchVisible() {
			this.batchText = ''
			this.batchCapacity = 4
			this.batchVisible = true
		},
		onCloseBatch() {
			this.batchVisible = false
		},
		stopPropagation() {},
		parseBatchInput(text) {
			const result = []
			const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
			for (const line of lines) {
				if (/^[A-Za-z]+\d+-[A-Za-z]*\d+$/.test(line)) {
					// 区间格式 A01-A06
					const m = line.match(/^([A-Za-z]+)(\d+)-([A-Za-z]*)(\d+)$/)
					if (!m) continue
					const prefix = m[1]
					const start = parseInt(m[2], 10)
					const prefix2 = m[3] || prefix
					const end = parseInt(m[4], 10)
					if (prefix !== prefix2) continue
					const width = m[2].length
					const lo = Math.min(start, end)
					const hi = Math.max(start, end)
					for (let i = lo; i <= hi; i++) {
						result.push(prefix + String(i).padStart(width, '0'))
					}
				} else if (/^[A-Za-z0-9]+$/.test(line)) {
					result.push(line)
				} else if (line.includes(',')) {
					line.split(',').forEach(s => {
						s = s.trim()
						if (s) result.push(s)
					})
				}
			}
			return [...new Set(result)]
		},
		onBatchGenerate() {
			const arr = this.parseBatchInput(this.batchText)
			if (arr.length === 0) {
				uni.showToast({ title: '请输入有效桌号', icon: 'none' })
				return
			}
			if (this.batchLoading) return
			this.batchLoading = true
			uni.showLoading({ title: `生成中 0/${arr.length}`, mask: true })
			const list = arr.map(tableNo => ({ tableNo, capacity: this.batchCapacity }))
			api.batchGenerateTableQrcode(list).then(res => {
				this.batchLoading = false
				uni.hideLoading()
				if (res.code === 0) {
					const d = res.data
					uni.showModal({
						title: '生成结果',
						content: `成功 ${d.success} 个，失败 ${d.fail} 个` + (d.fails.length ? `\n失败：${d.fails.map(f => f.tableNo).join('、')}` : ''),
						showCancel: false
					})
					this.batchVisible = false
					this.loadList()
				} else {
					uni.showToast({ title: res.msg || '批量生成失败', icon: 'none' })
				}
			}).catch(() => {
				this.batchLoading = false
				uni.hideLoading()
			})
		},
		onPreviewQrcode(e) {
			const id = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
			const item = this.list.find(i => i._id === id)
			if (!item || !item.qrcodeImg) return
			uni.previewImage({ urls: [item.qrcodeImg] })
		},
		onDownload(e) {
			const id = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
			const item = this.list.find(i => i._id === id)
			if (!item || !item.qrcodeImg) {
				uni.showToast({ title: '暂无二维码', icon: 'none' })
				return
			}
			uni.showLoading({ title: '下载中', mask: true })
			uni.downloadFile({
				url: item.qrcodeImg,
				success: (res) => {
					if (res.statusCode === 200) {
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
							fail: () => uni.showToast({ title: '保存失败，请授权相册权限', icon: 'none' })
						})
					} else {
						uni.showToast({ title: '下载失败', icon: 'none' })
					}
				},
				fail: () => uni.showToast({ title: '下载失败', icon: 'none' }),
				complete: () => uni.hideLoading()
			})
		},
		onRemove(e) {
			const id = (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
			const item = this.list.find(i => i._id === id)
			if (!item) return
			uni.showModal({
				title: '确认删除',
				content: `确定删除 ${item.tableNo} 号桌吗？`,
				success: (r) => {
					if (!r.confirm) return
					api.removeTable(item._id).then(res => {
						if (res.code === 0) {
							uni.showToast({ title: '已删除', icon: 'success' })
							this.loadList()
						} else {
							uni.showToast({ title: res.msg || '删除失败', icon: 'none' })
						}
					})
				}
			})
		},
		formatTime(t) {
			if (!t) return '-'
			let n = typeof t === 'number' ? t : Number(t)
			if (isNaN(n)) return String(t)
			if (n < 1e12) n = n * 1000 // 秒级时间戳转毫秒
			const d = new Date(n)
			const pad = (x) => String(x).padStart(2, '0')
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
		}
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #F8F5F0;
	padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

.nav-placeholder {
	height: 88rpx;
}

.action-bar {
	background-color: #FFFFFF;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 24rpx 20rpx;

	.input-wrap {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.table-input {
		flex: 1;
		height: 72rpx;
		padding: 0 20rpx;
		border-radius: 12rpx;
		background-color: #F5F5F5;
		font-size: 28rpx;
	}

	.capacity-wrap {
		display: flex;
		align-items: center;
		gap: 6rpx;

		.cap-label {
			font-size: 24rpx;
			color: #666;
		}

		.cap-step {
			width: 44rpx;
			height: 44rpx;
			border-radius: 50%;
			background-color: #F5F5F5;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28rpx;
			color: #333;
		}

		.cap-val {
			min-width: 40rpx;
			text-align: center;
			font-size: 28rpx;
			color: #C13027;
			font-weight: bold;
		}
	}

	.btn-primary {
		margin-top: 20rpx;
		height: 80rpx;
		border-radius: 40rpx;
		background-color: #C13027;
		color: #FFFFFF;
		font-size: 30rpx;
		font-weight: bold;
		display: flex;
		align-items: center;
		justify-content: center;

		&.disabled {
			opacity: 0.6;
		}
	}

	.btn-secondary {
		margin-top: 16rpx;
		height: 72rpx;
		border-radius: 36rpx;
		border: 2rpx solid #C13027;
		color: #C13027;
		font-size: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.list-wrap {
	margin: 20rpx;
	background-color: #FFFFFF;
	border-radius: 20rpx;
	padding: 20rpx;

	.list-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;

		.list-title {
			font-size: 30rpx;
			font-weight: bold;
			color: #222;
		}

		.list-refresh {
			display: flex;
			align-items: center;
			gap: 4rpx;
			font-size: 24rpx;
			color: #999;
		}
	}

	.empty {
		text-align: center;
		font-size: 26rpx;
		color: #999;
		padding: 60rpx 0;
	}
}

.grid {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.card {
	width: calc(50% - 8rpx);
	box-sizing: border-box;
	background-color: #FFFAF6;
	border: 2rpx solid #FFE4D8;
	border-radius: 16rpx;
	padding: 16rpx;

	.card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 12rpx;

		.card-table {
			font-size: 36rpx;
			font-weight: bold;
			color: #C13027;
		}

		.card-cap {
			font-size: 22rpx;
			color: #999;
		}
	}

	.card-qrcode {
		width: 100%;
		height: 240rpx;
		background-color: #FFFFFF;
		border-radius: 8rpx;
	}

	.card-meta {
		margin-top: 10rpx;
		display: flex;
		justify-content: space-between;
		font-size: 20rpx;
		color: #999;
	}

	.card-actions {
		margin-top: 12rpx;
		display: flex;
		gap: 10rpx;

		.card-btn {
			flex: 1;
			height: 56rpx;
			border-radius: 28rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rpx;

			&.download {
				background-color: #FFE4D8;
				color: #C13027;
			}

			&.delete {
				background-color: #F5F5F5;
				color: #666;
			}
		}
	}
}

/* 批量生成弹窗 */
.mask {
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

.batch-popup {
	width: 620rpx;
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	box-sizing: border-box;

	.batch-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #222;
		text-align: center;
	}

	.batch-sub {
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #999;
		text-align: center;
	}

	.batch-textarea {
		margin-top: 20rpx;
		width: 100%;
		height: 200rpx;
		padding: 16rpx;
		box-sizing: border-box;
		background-color: #F5F5F5;
		border-radius: 12rpx;
		font-size: 26rpx;
	}

	.batch-row {
		margin-top: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;

		.cap-label {
			font-size: 24rpx;
			color: #666;
		}

		.cap-step {
			width: 44rpx;
			height: 44rpx;
			border-radius: 50%;
			background-color: #F5F5F5;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28rpx;
			color: #333;
		}

		.cap-val {
			min-width: 40rpx;
			text-align: center;
			font-size: 28rpx;
			color: #C13027;
			font-weight: bold;
		}
	}

	.batch-actions {
		margin-top: 24rpx;
		display: flex;
		gap: 16rpx;

		.popup-btn {
			flex: 1;
			height: 80rpx;
			border-radius: 40rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 28rpx;

			&.cancel {
				background-color: #F5F5F5;
				color: #666;
			}

			&.confirm {
				background-color: #C13027;
				color: #FFFFFF;
				font-weight: bold;

				&.disabled {
					opacity: 0.6;
				}
			}
		}
	}
}
</style>

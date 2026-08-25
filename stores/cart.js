import { defineStore } from 'pinia'

// 读取当前绑定的桌号，按桌分区购物车
function currentTableNo() {
  try {
    const t = uni.getStorageSync('bbq_table')
    return (t && t.tableNo) || ''
  } catch (e) {
    return ''
  }
}

// 已绑桌: bbq_cart_{tableId}；未绑桌: bbq_cart
function storageKey() {
  const no = currentTableNo()
  return no ? `bbq_cart_${no}` : 'bbq_cart'
}

function loadStorage() {
  try {
    const data = uni.getStorageSync(storageKey())
    if (data && data.items) {
      return data
    }
  } catch (e) {
    // 忽略读取异常
  }
  return { items: [], remark: '' }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    remark: ''
  }),

  getters: {
    totalCount: (state) => {
      return state.items.reduce((sum, item) => sum + item.count, 0)
    },
    selectedItems: (state) => {
      return state.items.filter((item) => item.checked !== false)
    },
    totalPrice: (state) => {
      return state.selectedItems.reduce((sum, item) => sum + item.price * item.count, 0)
    },
    allChecked: (state) => {
      return state.items.length > 0 && state.items.every((item) => item.checked)
    }
  },

  actions: {
    // 桌台切换/首次进入时调用，按当前桌号回填购物车
    reload() {
      const data = loadStorage()
      this.items = data.items
      this.remark = data.remark
    },

    save() {
      uni.setStorageSync(storageKey(), {
        items: this.items,
        remark: this.remark
      })
    },

    addToCart(goods) {
      const index = this.items.findIndex((item) => item.goodsId === goods._id)
      if (index > -1) {
        this.items[index].count++
      } else {
        this.items.push({
          goodsId: goods._id,
          name: goods.name,
          price: goods.price,
          image: goods.img || goods.image || '',
          count: 1,
          checked: true
        })
      }
      this.save()
    },

    removeItem(goodsId) {
      this.items = this.items.filter((item) => item.goodsId !== goodsId)
      this.save()
    },

    changeCount(goodsId, delta) {
      const item = this.items.find((i) => i.goodsId === goodsId)
      if (!item) return
      item.count += delta
      if (item.count <= 0) {
        this.items = this.items.filter((i) => i.goodsId !== goodsId)
      }
      this.save()
    },

    setCount(goodsId, count) {
      const item = this.items.find((i) => i.goodsId === goodsId)
      if (!item) return
      item.count = Math.max(1, count)
      this.save()
    },

    toggleCheck(goodsId) {
      const item = this.items.find((i) => i.goodsId === goodsId)
      if (!item) return
      item.checked = !item.checked
      this.save()
    },

    toggleAll(checked) {
      this.items.forEach((item) => {
        item.checked = checked
      })
      this.save()
    },

    setRemark(remark) {
      this.remark = remark
      this.save()
    },

    clearCart() {
      this.items = []
      this.remark = ''
      this.save()
    }
  }
})
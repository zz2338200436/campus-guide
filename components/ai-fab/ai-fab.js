const storage = require('../../utils/storage');

const STORAGE_KEY = 'ai-fab-settings';
const DEFAULT_STATE = {
  hidden: false,
  x: null,
  y: null
};

function getSystemInfo() {
  return wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 375, windowHeight: 667 };
}

function getBounds() {
  const systemInfo = getSystemInfo();
  const ratio = 750 / (systemInfo.windowWidth || 375);
  return {
    ratio,
    maxX: Math.max(24, 750 - 132),
    maxY: Math.max(180, Math.round((systemInfo.windowHeight || 667) * ratio) - 220)
  };
}

function loadState() {
  return Object.assign({}, DEFAULT_STATE, storage.get(STORAGE_KEY, {}));
}

function saveState(nextState) {
  storage.set(STORAGE_KEY, nextState);
}

Component({
  data: {
    hidden: false,
    useCustomPos: false,
    posX: 0,
    posY: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    touchStartX: 0,
    touchStartY: 0
  },
  lifetimes: {
    attached() {
      const state = loadState();
      this.setData({
        hidden: !!state.hidden,
        useCustomPos: Number.isFinite(state.x) && Number.isFinite(state.y),
        posX: Number.isFinite(state.x) ? state.x : 0,
        posY: Number.isFinite(state.y) ? state.y : 0
      });
    }
  },
  methods: {
    onTouchStart(event) {
      const touch = event.touches[0];
      this.setData({
        dragging: true,
        startX: this.data.posX,
        startY: this.data.posY,
        touchStartX: touch.clientX,
        touchStartY: touch.clientY
      });
    },
    onTouchMove(event) {
      if (!this.data.dragging) {
        return;
      }
      const touch = event.touches[0];
      const bounds = getBounds();
      const nextX = this.data.startX + Math.round((touch.clientX - this.data.touchStartX) * bounds.ratio);
      const nextY = this.data.startY + Math.round((touch.clientY - this.data.touchStartY) * bounds.ratio);

      this.setData({
        useCustomPos: true,
        posX: Math.max(24, Math.min(nextX, bounds.maxX)),
        posY: Math.max(180, Math.min(nextY, bounds.maxY))
      });
    },
    onTouchEnd() {
      if (!this.data.dragging) {
        return;
      }
      const bounds = getBounds();
      const snapX = this.data.posX < 375 ? 24 : bounds.maxX;
      const state = loadState();
      const nextState = Object.assign({}, state, {
        x: snapX,
        y: this.data.posY
      });

      saveState(nextState);
      this.setData({
        dragging: false,
        useCustomPos: true,
        posX: snapX
      });
    },
    openAssistant() {
      wx.navigateTo({
        url: '/pages/assistant/assistant'
      });
    },
    toggleHidden() {
      const nextState = Object.assign({}, loadState(), {
        hidden: !this.data.hidden
      });
      saveState(nextState);
      this.setData({
        hidden: nextState.hidden
      });
    },
    restoreFab() {
      const nextState = Object.assign({}, loadState(), {
        hidden: false
      });
      saveState(nextState);
      this.setData({
        hidden: false
      });
    }
  }
});

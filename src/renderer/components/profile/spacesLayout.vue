<template>
  <!-- Ported from SmallVerse's own profile markup (profile/index +
       profile.css): a horizontal scroll row of fixed-width cards with an arrow
       either side, and square tabs - not a grid of pills. -->
  <div class="destination-section">
    <div class="destination-header">
      <div class="destination-title"><span>Where to?</span></div>

      <div class="destination-tabs">
        <button
          class="destination-tab"
          :class="{ active: mySpacesActive }"
          @click="changeTab('mySpaces')"
        >My Spaces</button>
        <button
          class="destination-tab"
          :class="{ active: popularActive }"
          @click="changeTab('pop')"
        >Popular Spaces</button>
        <button
          class="destination-tab"
          :class="{ active: favsActive }"
          @click="changeTab('favs')"
        >Favorites</button>
        <button
          class="destination-tab"
          :class="{ active: featuredActive }"
          @click="changeTab('featured')"
        >Featured</button>
      </div>
    </div>

    <div class="destination-cards-wrapper">
      <button class="destination-arrow" :disabled="leftActive" @click="prevSpace">
        <i class="fa-solid fa-chevron-left" />
      </button>

      <div class="destination-cards">
        <p v-if="!isMsgEmpty" class="destination-empty">{{ msg }}</p>

        <div
          v-for="space in spaces"
          :key="space.id"
          class="destination-card"
          :class="{ active: space.currentVisitors > 0 }"
          :title="space.name"
          @click="navigateToSpace(space.id)"
        >
          <div class="destination-image">
            <img v-if="thumb(space)" :src="thumb(space)" :alt="space.name" />
            <div v-else class="destination-placeholder">
              <i :class="placeholderIcon(space)" />
            </div>
          </div>
          <div class="destination-info">
            <div class="destination-name">{{ space.name }}</div>
            <div class="destination-online">
              <span class="online-dot" :class="{ empty: !space.currentVisitors }" />
              {{ space.currentVisitors || 0 }} online
            </div>
          </div>
        </div>
      </div>

      <button class="destination-arrow" :disabled="rightActive" @click="nextSpace">
        <i class="fa-solid fa-chevron-right" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'spacesLayout',

  props: {
    spaces: { type: Array, required: true },
    mySpacesActive: { type: Boolean, required: true },
    favsActive: { type: Boolean, required: true },
    featuredActive: { type: Boolean, required: true },
    popularActive: { type: Boolean, required: true },
    rightActive: { type: Boolean, required: true },
    leftActive: { type: Boolean, required: true },
    msg: { type: String, required: true },
  },

  emits: ['changeTab', 'nextSpace', 'prevSpace', 'navigateToSpace'],

  methods: {
    navigateToSpace(spaceId) {
      this.$router.push({ name: 'space', params: { id: spaceId } });
    },
    changeTab(tab) {
      this.$emit('changeTab', tab);
    },
    nextSpace() {
      this.$emit('nextSpace');
    },
    prevSpace() {
      this.$emit('prevSpace');
    },

    thumb(space) {
      const icon = (space.icon || '').trim();
      const t = (space.spaceThumbnailSource || '').trim();
      return icon || t || '';
    },

    // No space has a rendered snapshot yet, so hint at what it is instead.
    placeholderIcon(space) {
      const n = (space.name || '').toLowerCase();
      if (n.includes("'s house") || n.includes('home')) return 'fa-solid fa-house';
      if (n.includes('shop') || n.includes('wear') || n.includes('store')) return 'fa-solid fa-bag-shopping';
      if (n.includes('green') || n.includes('park') || n.includes('outdoor') || n.includes('plaza')) return 'fa-solid fa-tree';
      if (n.includes('hall') || n.includes('room')) return 'fa-solid fa-door-open';
      return 'fa-solid fa-location-dot';
    },
  },

  computed: {
    isMsgEmpty() {
      return !this.msg || this.msg.trim() === '';
    },
  },
};
</script>

<style scoped>
.destination-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d3d3d3;
}

.destination-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.destination-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1e304d;
  font-size: 28px;
  font-weight: bold;
}

.destination-tabs {
  display: flex;
  gap: 8px;
}

.destination-tab {
  padding: 8px 16px;
  border: 1px solid #d3d3d3;
  border-radius: 5px;
  background: #f0f0f0;
  color: #1e304d;
  font-family: var(--sw-font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.destination-tab:hover {
  background: #e0e0e0;
}

.destination-tab.active {
  background: #1e304d;
  color: #fff;
  border-color: #1e304d;
}

.destination-cards-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.destination-cards {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  scroll-behavior: smooth;
  flex: 1;
}

.destination-cards::-webkit-scrollbar { height: 6px; display: block; }
.destination-cards::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 3px; }
.destination-cards::-webkit-scrollbar-thumb { background: #c0c0c0; border-radius: 3px; }
.destination-cards::-webkit-scrollbar-thumb:hover { background: #1e304d; }

.destination-card {
  display: flex;
  flex-direction: column;
  max-width: 160px;
  width: 128px;
  flex-shrink: 0;
  background: #f8f8f8;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.destination-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.destination-card.active {
  border-color: #47a403;
  box-shadow: 0 0 0 2px rgba(71, 164, 3, 0.2);
}

.destination-image {
  width: 100%;
  height: 84px;
  overflow: hidden;
  background: #e9eef6;
}

.destination-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.destination-card:hover .destination-image img {
  transform: scale(1.05);
}

.destination-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #eef2f8 0%, #dbe3ef 100%);
}

.destination-placeholder i {
  font-size: 24px;
  color: #9fb0c8;
}

.destination-info {
  padding: 7px 8px 9px 8px;
}

.destination-name {
  font-size: 12px;
  font-weight: 600;
  color: #1e304d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.destination-online {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #777;
  margin-top: 3px;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #47a403;
  flex-shrink: 0;
}

.online-dot.empty {
  background: #b9c5d6;
}

.destination-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #1e304d;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  outline: none;
}

.destination-arrow:hover:not(:disabled) {
  background: #2a4166;
  transform: scale(1.05);
}

.destination-arrow:active:not(:disabled) {
  transform: scale(0.95);
}

.destination-arrow:disabled {
  background: #d0d0d0;
  color: #999;
  transform: none;
  cursor: default;
}

.destination-arrow i { font-size: 12px; }

.destination-empty {
  color: #8a94a6;
  font-size: 14px;
  padding: 26px 4px;
  margin: 0;
}
</style>

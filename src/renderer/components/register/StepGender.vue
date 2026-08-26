<template>
  <div class="sw-reg-step">
    <h2 class="sw-reg-step-title">Choose your look</h2>
    <p class="sw-reg-step-sub">
      Pick the body your avatar starts with. You can restyle everything else
      once you are in world.
    </p>

    <div class="gender-cards">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="gender-card"
        :class="{ selected: form.gender === option.value }"
        :aria-pressed="form.gender === option.value"
        @click="select(option.value)"
      >
        <span class="gender-art" :class="option.art" />
        <span class="gender-name">{{ option.label }}</span>
        <span class="gender-tick">
          <i class="fa-solid fa-check" />
        </span>
      </button>
    </div>

    <span v-if="showError" class="sw-reg-error gender-error">
      {{ errors.gender }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'StepGender',
  props: {
    form: { type: Object, required: true },
    errors: { type: Object, required: true },
    attempted: { type: Boolean, default: false },
  },
  data: () => ({
    options: [
      { value: 'M', label: 'Male', art: 'art-male' },
      { value: 'F', label: 'Female', art: 'art-female' },
    ],
  }),
  computed: {
    showError() {
      return Boolean(this.errors.gender) && this.attempted;
    },
  },
  methods: {
    select(value) {
      this.form.gender = value;
      this.$emit('selected', value);
    },
  },
  emits: ['selected'],
};
</script>

<style scoped>
.gender-cards {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 10px 0 4px 0;
}

.gender-card {
  position: relative;
  flex: 1;
  max-width: 190px;
  background: var(--sw-panel-alt);
  border: 2px solid var(--sw-border-soft);
  border-radius: 8px;
  padding: 18px 10px 12px 10px;
  cursor: pointer;
  font-family: var(--sw-font);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: border-color 0.15s ease, background-color 0.15s ease,
    transform 0.1s ease;
}

.gender-card:hover {
  border-color: var(--sw-steel);
  transform: translateY(-2px);
}

.gender-card.selected {
  border-color: var(--sw-green);
  background: rgba(71, 164, 3, 0.08);
}

.gender-art {
  width: 55px;
  height: 200px;
  background-repeat: no-repeat;
  background-position: 0 0;
}

.art-male {
  background-image: url('/images/avatar_male.png');
}

.art-female {
  background-image: url('/images/avatar_female.png');
}

.gender-name {
  font-size: 15px;
  font-weight: bold;
  color: var(--sw-navy);
}

.gender-tick {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--sw-green);
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.gender-card.selected .gender-tick {
  opacity: 1;
  transform: scale(1);
}

.gender-error {
  text-align: center;
}
</style>

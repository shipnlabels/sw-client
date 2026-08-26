<template>
  <div class="sw-reg-step">
    <h2 class="sw-reg-step-title">Name your character</h2>
    <p class="sw-reg-step-sub">
      This is the name everyone in world sees — it does not have to be your real
      name.
    </p>

    <div class="sw-reg-row">
      <label class="sw-reg-field">
        <span class="sw-reg-label">Character first name</span>
        <input
          v-model.trim="form.avFirst"
          type="text"
          autocomplete="off"
          maxlength="20"
          :class="{ 'has-error': show('avFirst') }"
          @blur="touch('avFirst')"
        />
        <span v-if="show('avFirst')" class="sw-reg-error">
          {{ errors.avFirst }}
        </span>
      </label>

      <label class="sw-reg-field">
        <span class="sw-reg-label">Character last name</span>
        <input
          v-model.trim="form.avLast"
          type="text"
          autocomplete="off"
          maxlength="20"
          :class="{ 'has-error': show('avLast') }"
          @blur="touch('avLast')"
        />
        <span v-if="show('avLast')" class="sw-reg-error">
          {{ errors.avLast }}
        </span>
      </label>
    </div>

    <div
      v-if="statusText"
      class="name-status"
      :class="{
        checking: checking,
        ok: !checking && available && nameInstance === 1,
        warn: !checking && available && nameInstance > 1,
        bad: !checking && !available,
      }"
    >
      <i v-if="checking" class="fa-solid fa-circle-notch fa-spin" />
      <i v-else-if="available" class="fa-solid fa-circle-check" />
      <i v-else class="fa-solid fa-circle-exclamation" />
      <span>{{ statusText }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StepCharacter',
  props: {
    form: { type: Object, required: true },
    errors: { type: Object, required: true },
    attempted: { type: Boolean, default: false },
  },
  emits: ['checkNameAvailability', 'availability'],
  data: () => ({
    touched: {},
    checking: false,
    available: false,
    nameInstance: 1,
    statusText: '',
    checkTimer: null,
  }),
  watch: {
    'form.avFirst': function () {
      this.queueCheck();
    },
    'form.avLast': function () {
      this.queueCheck();
    },
  },
  mounted() {
    // Coming back to this step should not look "unchecked" if the names are
    // already filled in.
    if (this.form.avFirst && this.form.avLast) this.queueCheck();
  },
  unmounted() {
    clearTimeout(this.checkTimer);
  },
  methods: {
    touch(field) {
      this.touched = { ...this.touched, [field]: true };
    },
    show(field) {
      return Boolean(this.errors[field]) && (this.attempted || this.touched[field]);
    },

    reset() {
      this.checking = false;
      this.available = false;
      this.nameInstance = 1;
      this.statusText = '';
      this.$emit('availability', { available: false, nameInstance: 1 });
    },

    // Same debounce-then-ask-the-parent shape aviLayout/createAvatar use, so
    // there is only one place that knows the endpoint.
    queueCheck() {
      clearTimeout(this.checkTimer);

      if (this.errors.avFirst || this.errors.avLast) {
        this.reset();
        return;
      }

      this.checking = true;
      this.available = false;
      this.statusText = 'Checking availability…';
      this.$emit('availability', { available: false, nameInstance: 1 });

      this.checkTimer = setTimeout(() => {
        this.$emit('checkNameAvailability', {
          firstName: this.form.avFirst,
          lastName: this.form.avLast,
          callback: this.handleResult,
        });
      }, 400);
    },

    handleResult(result) {
      this.checking = false;
      this.available = Boolean(result.isAvailable);
      this.nameInstance = result.nameInstance || 1;

      if (!this.available) {
        this.statusText = result.message || "That name isn't available.";
      } else if (this.nameInstance > 1) {
        this.statusText = `Taken — you will be known as "${result.fullName}".`;
      } else {
        this.statusText = 'That name is available!';
      }

      this.$emit('availability', {
        available: this.available,
        nameInstance: this.nameInstance,
      });
    },
  },
};
</script>

<style scoped>
.name-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding: 9px 12px;
  border-radius: 4px;
  font-size: 13px;
  border-left: 3px solid transparent;
}

.name-status.checking {
  background: rgba(85, 116, 167, 0.1);
  border-left-color: var(--sw-steel);
  color: var(--sw-slate);
}

.name-status.ok {
  background: rgba(71, 164, 3, 0.1);
  border-left-color: var(--sw-green);
  color: var(--sw-green-dark);
}

.name-status.warn {
  background: rgba(243, 212, 58, 0.16);
  border-left-color: #d9a406;
  color: #8a6400;
}

.name-status.bad {
  background: rgba(217, 83, 79, 0.1);
  border-left-color: #d9534f;
  color: #a33531;
}
</style>

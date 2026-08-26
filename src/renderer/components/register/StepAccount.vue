<template>
  <div class="sw-reg-step">
    <h2 class="sw-reg-step-title">Account details</h2>
    <p class="sw-reg-step-sub">
      This is the real you — it stays private and is only used to secure your
      account.
    </p>

    <label class="sw-reg-field">
      <span class="sw-reg-label">Email</span>
      <input
        v-model.trim="form.email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        :class="{ 'has-error': show('email') }"
        @blur="touch('email')"
      />
      <span v-if="show('email')" class="sw-reg-error">{{ errors.email }}</span>
    </label>

    <div class="sw-reg-row">
      <label class="sw-reg-field">
        <span class="sw-reg-label">Password</span>
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          :class="{ 'has-error': show('password') }"
          @blur="touch('password')"
        />
        <span v-if="show('password')" class="sw-reg-error">
          {{ errors.password }}
        </span>
      </label>

      <label class="sw-reg-field">
        <span class="sw-reg-label">Confirm password</span>
        <input
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          :class="{ 'has-error': show('confirmPassword') }"
          @blur="touch('confirmPassword')"
        />
        <span v-if="show('confirmPassword')" class="sw-reg-error">
          {{ errors.confirmPassword }}
        </span>
      </label>
    </div>

    <div class="sw-reg-row">
      <label class="sw-reg-field">
        <span class="sw-reg-label">First name</span>
        <input
          v-model.trim="form.firstName"
          type="text"
          autocomplete="given-name"
          :class="{ 'has-error': show('firstName') }"
          @blur="touch('firstName')"
        />
        <span v-if="show('firstName')" class="sw-reg-error">
          {{ errors.firstName }}
        </span>
      </label>

      <label class="sw-reg-field">
        <span class="sw-reg-label">Last name</span>
        <input
          v-model.trim="form.lastName"
          type="text"
          autocomplete="family-name"
          :class="{ 'has-error': show('lastName') }"
          @blur="touch('lastName')"
        />
        <span v-if="show('lastName')" class="sw-reg-error">
          {{ errors.lastName }}
        </span>
      </label>
    </div>

    <div class="sw-reg-field">
      <span class="sw-reg-label">Date of birth</span>
      <div class="sw-reg-dob">
        <select
          v-model="form.dobDay"
          :class="{ 'has-error': show('dob') }"
          @change="touch('dob')"
        >
          <option value="">Day</option>
          <option v-for="d in 31" :key="d" :value="String(d)">{{ d }}</option>
        </select>
        <select
          v-model="form.dobMonth"
          :class="{ 'has-error': show('dob') }"
          @change="touch('dob')"
        >
          <option value="">Month</option>
          <option v-for="(m, i) in months" :key="m" :value="String(i)">
            {{ m }}
          </option>
        </select>
        <select
          v-model="form.dobYear"
          :class="{ 'has-error': show('dob') }"
          @change="touch('dob')"
        >
          <option value="">Year</option>
          <option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option>
        </select>
      </div>
      <span v-if="show('dob')" class="sw-reg-error">{{ errors.dob }}</span>
    </div>

    <label class="sw-reg-field">
      <span class="sw-reg-label">Security question</span>
      <select
        v-model="form.question"
        :class="{ 'has-error': show('question') }"
        @change="touch('question')"
      >
        <option v-for="q in questions" :key="q" :value="q">{{ q }}</option>
      </select>
      <span v-if="show('question')" class="sw-reg-error">
        {{ errors.question }}
      </span>
    </label>

    <label class="sw-reg-field">
      <span class="sw-reg-label">Security answer</span>
      <input
        v-model.trim="form.answer"
        type="text"
        autocomplete="off"
        placeholder="Something you will not forget"
        :class="{ 'has-error': show('answer') }"
        @blur="touch('answer')"
      />
      <span v-if="show('answer')" class="sw-reg-error">{{ errors.answer }}</span>
    </label>

  </div>
</template>

<script>
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What street did you grow up on?',
  'What was the name of your first school?',
  'What is your mother’s maiden name?',
  'What was your childhood nickname?',
  'What is your favourite film?',
];

export default {
  name: 'StepAccount',
  props: {
    // The wizard owns the form object; the steps write straight into it so
    // every field does not need its own emit round trip.
    form: { type: Object, required: true },
    errors: { type: Object, required: true },
    // Set once the user has pressed Next on this step - then every error
    // shows, not just the ones for fields they have already left.
    attempted: { type: Boolean, default: false },
  },
  data: () => ({
    touched: {},
    months: MONTHS,
    questions: SECURITY_QUESTIONS,
  }),
  computed: {
    years() {
      const now = new Date().getFullYear();
      const list = [];
      for (let y = now; y >= 1920; y--) list.push(y);
      return list;
    },
  },
  methods: {
    touch(field) {
      this.touched = { ...this.touched, [field]: true };
    },
    show(field) {
      return Boolean(this.errors[field]) && (this.attempted || this.touched[field]);
    },
  },
};
</script>

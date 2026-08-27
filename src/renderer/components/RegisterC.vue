<template>
  <div class="sw-page register-page">
    <div class="sw-page-background" />

    <div class="register-wrap">
      <img
        class="sw-brand-mark"
        src="/img/sw2018/logo.png"
        alt="SmallWorlds"
      />

      <div class="sw-panel register-card register-wizard">
        <div class="sw-panel-header">
          <div class="sw-panel-title">Create your account</div>
          <div class="sw-pill" style="margin-left: auto">
            Step {{ step + 1 }} of {{ stepLabels.length }}
          </div>
        </div>

        <ol class="step-track">
          <li
            v-for="(label, i) in stepLabels"
            :key="label"
            class="step-node"
            :class="{ done: i < step, current: i === step }"
          >
            <span class="step-dot">
              <i v-if="i < step" class="fa-solid fa-check" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            <span class="step-label">{{ label }}</span>
          </li>
        </ol>

        <StepAccount
          v-if="step === 0"
          :form="form"
          :errors="errors"
          :attempted="attempted[0]"
        />
        <StepGender
          v-else-if="step === 1"
          :form="form"
          :errors="errors"
          :attempted="attempted[1]"
        />
        <StepCharacter
          v-else
          :form="form"
          :errors="errors"
          :attempted="attempted[2]"
          @checkNameAvailability="checkNameAvailability"
          @availability="onAvailability"
        />

        <div class="sw-panel-footer wizard-nav">
          <button
            type="button"
            class="sw-btn-quiet nav-back"
            :disabled="busy"
            @click="back"
          >
            <i class="fa-solid fa-chevron-left" />
            <span>{{ step === 0 ? 'Cancel' : 'Back' }}</span>
          </button>

          <button
            type="button"
            class="sw-btn-green nav-next"
            :disabled="busy"
            @click="next"
          >
            {{ nextLabel }}
          </button>
        </div>
      </div>

      <p class="signin-hint">
        Already have an account?
        <router-link class="sw-link" to="/login">Sign in</router-link>
      </p>
    </div>

    <snackBar :snackbar="snackbar" />
  </div>
</template>

<script>
import { postAuthDestination } from '../browser-shim.js';
import axios from 'axios';
import { reactive } from 'vue';
import { useAuthStore } from '@stores/auth';
import snackBar from '@components/utils/snackBar.vue';
import StepAccount, { SECURITY_QUESTIONS } from '@components/register/StepAccount.vue';
import StepGender from '@components/register/StepGender.vue';
import StepCharacter from '@components/register/StepCharacter.vue';

const auth = useAuthStore();

const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,24}))$/;

// The backend's name_available() rejects anything that is not >= 3 plain
// letters, so mirror that here instead of making the user find out via a
// round trip.
const ALPHA_RE = /^[A-Za-z]+$/;

// Which fields belong to which step, so Next only validates what is on screen.
const STEP_FIELDS = [
  [
    'email',
    'password',
    'confirmPassword',
    'firstName',
    'lastName',
    'dob',
    'question',
    'answer',
  ],
  ['gender'],
  ['avFirst', 'avLast'],
];

export default {
  name: 'RegisterC',
  components: { snackBar, StepAccount, StepGender, StepCharacter },

  data: () => ({
    step: 0,
    stepLabels: ['Account', 'Look', 'Character'],
    attempted: [false, false, false],
    busy: false,
    nameAvailable: false,
    // Kept outside `form` because it is no longer collected or validated -
    // it is only carried through from a ?code= link so an invite-sourced
    // signup can still be attributed.
    inviteCode: '',
    form: reactive({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      dobDay: '',
      dobMonth: '',
      dobYear: '',
      question: SECURITY_QUESTIONS[0],
      answer: '',
      gender: '',
      avFirst: '',
      avLast: '',
    }),
    snackbar: {
      visible: false,
      text: '',
      color: '',
      icon: '',
      timeout: null,
      offset: '',
    },
  }),

  computed: {
    errors() {
      const f = this.form;
      const e = {};

      if (!f.email) e.email = 'Enter your email address.';
      else if (!EMAIL_RE.test(f.email)) e.email = 'Enter a valid email address.';

      if (!f.password) e.password = 'Choose a password.';
      else if (f.password.length < 6)
        e.password = 'Password must be at least 6 characters.';

      if (!f.confirmPassword) e.confirmPassword = 'Confirm your password.';
      else if (f.confirmPassword !== f.password)
        e.confirmPassword = 'Passwords do not match.';

      if (!f.firstName) e.firstName = 'Enter your first name.';
      if (!f.lastName) e.lastName = 'Enter your last name.';

      const dobError = this.dobError;
      if (dobError) e.dob = dobError;

      if (!f.question) e.question = 'Pick a security question.';
      if (!f.answer) e.answer = 'Enter your security answer.';

      if (!f.gender) e.gender = 'Pick a look to continue.';

      if (!f.avFirst) e.avFirst = 'Enter a first name.';
      else if (f.avFirst.length < 3) e.avFirst = 'At least 3 letters.';
      else if (!ALPHA_RE.test(f.avFirst)) e.avFirst = 'Letters only.';

      if (!f.avLast) e.avLast = 'Enter a last name.';
      else if (f.avLast.length < 3) e.avLast = 'At least 3 letters.';
      else if (!ALPHA_RE.test(f.avLast)) e.avLast = 'Letters only.';

      return e;
    },

    dobError() {
      const { dobDay, dobMonth, dobYear } = this.form;
      if (!dobDay || dobMonth === '' || !dobYear)
        return 'Select your full date of birth.';

      const d = Number(dobDay);
      const m = Number(dobMonth);
      const y = Number(dobYear);
      const date = new Date(y, m, d);
      // Rolls over on impossible dates (31 February), so compare the parts back.
      if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d)
        return 'That date does not exist.';
      if (date > new Date()) return 'Date of birth cannot be in the future.';
      return '';
    },

    nextLabel() {
      if (this.busy) return 'Creating…';
      return this.step === STEP_FIELDS.length - 1 ? 'Create account' : 'Next';
    },
  },

  created() {
    // /register?code=XXXX - carried through purely for attribution.
    const code = this.$route && this.$route.query && this.$route.query.code;
    // Registration is open; a ?code= is still passed through for
    // attribution if someone arrives from an invite link.
    if (code) this.inviteCode = String(code);
  },

  methods: {
    triggerSnackbar(data) {
      this.snackbar.visible = data.visible;
      this.snackbar.text = data.text;
      this.snackbar.color = data.color;
      this.snackbar.icon = data.icon;
      this.snackbar.timeout = data.timeout;
      this.snackbar.offset = data.offset;
      setTimeout(() => {
        this.snackbar.visible = false;
      }, this.snackbar.timeout);
    },

    fail(text) {
      this.triggerSnackbar({
        visible: true,
        text,
        color: 'red',
        timeout: 6000,
        icon: 'mdi-alert-circle',
        offset: 'left',
      });
    },

    firstErrorFor(step) {
      const key = STEP_FIELDS[step].find((f) => this.errors[f]);
      return key ? this.errors[key] : '';
    },

    onAvailability({ available }) {
      this.nameAvailable = available;
    },

    back() {
      if (this.step === 0) {
        this.$router.push('/login');
        return;
      }
      this.step -= 1;
    },

    next() {
      const attempted = [...this.attempted];
      attempted[this.step] = true;
      this.attempted = attempted;

      const problem = this.firstErrorFor(this.step);
      if (problem) {
        this.fail(problem);
        return;
      }

      if (this.step < STEP_FIELDS.length - 1) {
        this.step += 1;
        return;
      }

      if (!this.nameAvailable) {
        this.fail('Pick a character name that is available first.');
        return;
      }

      this.submit();
    },

    // Owned here rather than in the step so there is a single place that knows
    // the endpoint - same shape as aviLayout's checkNameAvailability.
    async checkNameAvailability({ firstName, lastName, callback }) {
      try {
        const response = await fetch('/api/avatar/nameavailable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName }),
        });
        if (!response.ok) throw new Error('Failed to check name availability');

        const result = await response.json();
        callback({
          isAvailable: !!result.value,
          nameInstance: result.nameInstance || 1,
          fullName: result.fullName || `${firstName} ${lastName}`,
          message: result.message || '',
        });
      } catch (error) {
        console.error(error);
        callback({
          isAvailable: false,
          nameInstance: 1,
          fullName: '',
          message: 'Could not check that name right now.',
        });
      }
    },

    // Exactly the shape RegisterController::register() validates. Every value
    // is a string, and avatar.nameInstance is deliberately omitted (the
    // controller's rule for it is not a real validation rule, so sending the
    // key makes Laravel blow up).
    buildPayload() {
      const f = this.form;
      return {
        avatar: {
          firstName: f.avFirst,
          lastName: f.avLast,
          gender: f.gender,
        },
        user: {
          firstName: f.firstName,
          lastName: f.lastName,
          sex: f.gender,
          // dob_month is stored zero-based - ds.php reads it back as
          // (dob_month + 1) when it builds the date for the game client.
          dobMonth: String(f.dobMonth),
          dobDate: String(f.dobDay),
          dobYear: String(f.dobYear),
          email: f.email,
          password: f.password,
          question: f.question,
          answer: f.answer,
          invite_code: this.inviteCode || null,
        },
      };
    },

    describeError(error) {
      const res = error && error.response;
      if (!res) return 'Could not reach the server. Please try again.';

      const body = res.data;
      let message = '';

      if (typeof body === 'string' && body.trim()) message = body;
      else if (body && body.errors) {
        const first = Object.values(body.errors)[0];
        if (Array.isArray(first) && first.length) message = first[0];
      }
      if (!message && body && body.message) message = body.message;

      if (!message)
        message =
          res.status === 401
            ? 'Registration was refused. Please try again.'
            : 'Registration failed. Please try again.';

      // Laravel names the fields "user.email" / "avatar.first name" in its
      // messages; strip the group prefix so the text reads normally.
      return String(message).replace(/\b(user|avatar)\.\s?/g, '');
    },

    async submit() {
      this.busy = true;
      try {
        const { data } = await axios.post('/api/register', this.buildPayload());
        const swsid = data && data.id;
        if (!swsid) throw new Error('Register succeeded but returned no session');

        // Same post-login sequence LoginComponent uses.
        if (await auth.loginWithToken(swsid)) {
          await window.storage.setItem('SWSID', JSON.stringify(auth.session));
          window.location.href = postAuthDestination();
          return;
        }

        this.fail('Account created, but signing in failed. Try logging in.');
      } catch (error) {
        console.error(error);
        this.fail(this.describeError(error));
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-wrap {
  width: 100%;
  max-width: 520px;
}

.register-card {
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
}

/* ---------- step indicator ---------- */

.step-track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  list-style: none;
  margin: 0 0 20px 0;
  padding: 0;
  position: relative;
}

.step-track::before {
  content: '';
  position: absolute;
  top: 13px;
  left: 12%;
  right: 12%;
  height: 2px;
  background: var(--sw-border-soft);
  z-index: 0;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--sw-panel);
  border: 2px solid var(--sw-border-soft);
  color: #9aa9c0;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.step-node.current .step-dot {
  background: var(--sw-navy);
  border-color: var(--sw-navy);
  color: #fff;
}

.step-node.done .step-dot {
  background: var(--sw-green);
  border-color: var(--sw-green);
  color: #fff;
}

.step-label {
  font-size: 11px;
  color: #8a8a8a;
}

.step-node.current .step-label {
  color: var(--sw-navy);
  font-weight: bold;
}

/* ---------- footer nav ---------- */

.wizard-nav {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 20px;
}

.nav-back {
  width: 110px;
  height: 38px;
  flex-shrink: 0;
}

.nav-next {
  flex: 1;
  height: 38px;
  font-size: 15px;
}

.signin-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  margin-top: 16px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.signin-hint .sw-link {
  color: #d9e6ff;
}
</style>

<!-- Shared field chrome for the step components. Deliberately unscoped (the
     steps are separate SFCs) but namespaced under .sw-reg-*. -->
<style>
.sw-reg-step-title {
  font-family: var(--sw-font);
  font-size: 17pt;
  color: var(--sw-navy);
  margin: 0;
}

.sw-reg-step-sub {
  color: #7a7a7a;
  font-size: 12.5px;
  margin: 4px 0 16px 0;
}

.sw-reg-field {
  display: block;
  position: relative;
  margin-bottom: 14px;
  flex: 1;
}

.sw-reg-row {
  display: flex;
  gap: 12px;
}

.sw-reg-label {
  display: block;
  font-size: 12px;
  color: #555;
  margin-bottom: 4px;
  font-weight: 500;
}

.sw-reg-field input[type='text'],
.sw-reg-field input[type='email'],
.sw-reg-field input[type='password'],
.sw-reg-field select,
.sw-reg-dob select {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--sw-border-soft);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  background: #fff;
  color: #333;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.sw-reg-field input:focus,
.sw-reg-field select:focus,
.sw-reg-dob select:focus {
  border-color: var(--sw-steel);
  box-shadow: 0 0 0 3px rgba(85, 116, 167, 0.18);
}

.sw-reg-field input.has-error,
.sw-reg-field select.has-error,
.sw-reg-dob select.has-error {
  border-color: #d9534f;
}

.sw-reg-dob {
  display: flex;
  gap: 8px;
}

.sw-reg-error {
  display: block;
  color: #d9534f;
  font-size: 11px;
  margin-top: 3px;
}

.sw-reg-hint {
  display: block;
  color: #8a8a8a;
  font-size: 11px;
  margin-top: 3px;
}
</style>

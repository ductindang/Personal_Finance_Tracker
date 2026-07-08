/**
 * Forgot Password Flow JavaScript module.
 * Wraps all the logic in an IIFE (Immediately Invoked Function Expression)
 * to encapsulate the variables and protect the global scope namespace.
 */
const ForgotPasswordPage = (() => {
    
    // DOM Selectors Cache
    // Centralizes all DOM element selectors for easier maintenance.
    const DOM = {
        card: '.auth-card',
        subtitle: '.auth-subtitle',
        errorBox: '#errorBox',
        errorMessage: '#errorMessage',
        successBox: '#successBox',
        successMessage: '#successMessage',
        antiForgery: 'input[name="__RequestVerificationToken"]',

        // Step container IDs
        step1: '#step-email',
        step2: '#step-code',
        step3: '#step-password',

        // Input field elements
        emailInput: '#EmailAddress',
        codeInput: '#VerificationCode',
        passwordInput: '#NewPassword',
        confirmPasswordInput: '#ConfirmPassword',

        // Buttons and feedback elements
        sendBtn: '#sendCodeBtn',
        verifyBtn: '#verifyCodeBtn',
        resetBtn: '#resetPasswordBtn',
        resendBtn: '#resendCodeBtn',
        countdownText: '#countdownText',

        // Password visibility helpers
        togglePasswordBtn: '.toggle-password'
    };

    // State Variables
    // Keeps track of runtime wizard state: email, code, and active countdown timer.
    let state = {
        email: '',
        verificationCode: '',
        countdownTimer: null,
        countdownSeconds: 30
    };

    /**
     * Helper: Displays an error message box with dynamic feedback styling.
     */
    const showError = (message) => {
        const errorBox = document.querySelector(DOM.errorBox);
        const errorMsg = document.querySelector(DOM.errorMessage);
        if (errorBox && errorMsg) {
            errorMsg.textContent = message;
            errorBox.style.display = 'block'; // Make the error box visible
            // Smoothly scroll the card into view to capture user attention
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    /**
     * Helper: Hides the error alert box.
     */
    const hideError = () => {
        const errorBox = document.querySelector(DOM.errorBox);
        if (errorBox) {
            errorBox.style.display = 'none';
        }
    };

    /**
     * Helper: Displays a green success banner alert box.
     */
    const showSuccess = (message) => {
        const successBox = document.querySelector(DOM.successBox);
        const successMsg = document.querySelector(DOM.successMessage);
        if (successBox && successMsg) {
            successMsg.textContent = message;
            successBox.style.display = 'block'; // Make success box visible
        }
    };

    /**
     * Helper: Hides the success banner alert box.
     */
    const hideSuccess = () => {
        const successBox = document.querySelector(DOM.successBox);
        if (successBox) {
            successBox.style.display = 'none';
        }
    };

    /**
     * Helper: Smoothly transitions the UI from one step to another using CSS transitions.
     * @param {string} fromStepSelector Selector of the current active step container.
     * @param {string} toStepSelector Selector of the next target step container.
     * @param {string} newSubtitle Optional updated subtitle string to guide the user.
     */
    const transitionToStep = (fromStepSelector, toStepSelector, newSubtitle) => {
        const fromStep = document.querySelector(fromStepSelector);
        const toStep = document.querySelector(toStepSelector);
        const subtitle = document.querySelector(DOM.subtitle);

        if (fromStep && toStep) {
            hideError();
            hideSuccess();

            // Step A: Trigger opacity fade-out and slide-up animation.
            fromStep.style.opacity = '0';
            fromStep.style.transform = 'translateY(-10px)';
            
            // Step B: Wait for the 300ms CSS transition to complete before hiding the display.
            setTimeout(() => {
                fromStep.style.display = 'none'; // Clear from viewport layout
                toStep.style.display = 'block';   // Draw next step onto screen
                
                // Force a browser paint redraw trigger to allow subsequent transitions to render.
                toStep.offsetHeight; 

                // Step C: Animate next step into focus.
                toStep.style.opacity = '1';
                toStep.style.transform = 'translateY(0)';

                if (subtitle && newSubtitle) {
                    subtitle.textContent = newSubtitle;
                }
            }, 300);
        }
    };

    /**
     * Helper: Sends AJAX POST requests using application/x-www-form-urlencoded content encoding.
     * Automatically appends the Anti-Forgery token for CSRF verification.
     * @param {string} url Endpoint target route path.
     * @param {Object} paramsObj Collection of parameters to stringify.
     */
    const postData = async (url, paramsObj) => {
        // Read the CSRF token from the DOM input
        const tokenElement = document.querySelector(DOM.antiForgery);
        if (tokenElement) {
            paramsObj['__RequestVerificationToken'] = tokenElement.value;
        }

        // Serialize data object keys into URL-encoded format
        const formBody = Object.keys(paramsObj)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(paramsObj[key]))
            .join('&');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json(); // Parses JSON response properties (e.g. success, message)
    };

    /**
     * Action Handler: Step 1 - Send email address code request.
     */
    const handleSendCode = async (e) => {
        e.preventDefault(); // Intercept browser page refresh submit reload
        hideError();

        const emailInput = document.querySelector(DOM.emailInput);
        if (!emailInput || !emailInput.value.trim()) {
            showError("Please enter your email address.");
            return;
        }

        const email = emailInput.value.trim();
        const sendBtn = document.querySelector(DOM.sendBtn);

        try {
            // Disable button to prevent duplicate clicks during API fetch
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Code...';

            const result = await postData('/Account/SendVerificationCode', { Email: email });

            if (result.success) {
                state.email = email; // Cache verified email in state
                showSuccess(result.message);
                
                // Allow brief delay so user can read successful banner status
                setTimeout(() => {
                    transitionToStep(DOM.step1, DOM.step2, `We've sent a 6-digit verification code to ${email}`);
                    startCountdown(); // Initialize resend cooldown
                }, 1000);
            } else {
                showError(result.message);
            }
        } catch (err) {
            showError("An error occurred while sending verification code. Please try again.");
            console.error(err);
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = 'Send Verification Code';
        }
    };

    /**
     * Action Handler: Step 2 - Verify code verification validity.
     */
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        hideError();

        const codeInput = document.querySelector(DOM.codeInput);
        if (!codeInput || !codeInput.value.trim() || codeInput.value.trim().length !== 6) {
            showError("Please enter the 6-digit verification code.");
            return;
        }

        const code = codeInput.value.trim();
        const verifyBtn = document.querySelector(DOM.verifyBtn);

        try {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

            const result = await postData('/Account/VerifyCode', { Email: state.email, Code: code });

            if (result.success) {
                state.verificationCode = code; // Cache verified code in state
                showSuccess("Code verified. Please set your new password.");

                setTimeout(() => {
                    transitionToStep(DOM.step2, DOM.step3, "Enter your new password below.");
                }, 1000);
            } else {
                showError(result.message);
            }
        } catch (err) {
            showError("An error occurred while verifying the code. Please try again.");
            console.error(err);
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verify Code';
        }
    };

    /**
     * Action Handler: Step 3 - Submit password modifications.
     */
    const handleResetPassword = async (e) => {
        e.preventDefault();
        hideError();

        const passwordInput = document.querySelector(DOM.passwordInput);
        const confirmPasswordInput = document.querySelector(DOM.confirmPasswordInput);

        // Enforce strict client-side validation aligned with registration
        if (!passwordInput || !passwordInput.value) {
            showError("Please enter your new password.");
            return;
        }

        if (passwordInput.value.length < 8) {
            showError("Password must be at least 8 characters long.");
            return;
        }

        // Validate complexity (at least 1 uppercase, 1 lowercase, 1 digit, and 1 special character)
        const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordComplexityRegex.test(passwordInput.value)) {
            showError("Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
            return;
        }

        if (!confirmPasswordInput || passwordInput.value !== confirmPasswordInput.value) {
            showError("Passwords do not match.");
            return;
        }

        const resetBtn = document.querySelector(DOM.resetBtn);

        try {
            resetBtn.disabled = true;
            resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting Password...';

            const result = await postData('/Account/ResetPassword', {
                Email: state.email,
                Code: state.verificationCode,
                Password: passwordInput.value,
                ConfirmPassword: confirmPasswordInput.value
            });

            if (result.success) {
                showSuccess(result.message);
                
                // Clear active timing schedules
                clearInterval(state.countdownTimer);

                // Smoothly route back to the Login view page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/Account/Login';
                }, 2000);
            } else {
                showError(result.message);
            }
        } catch (err) {
            showError("An error occurred while resetting password. Please try again.");
            console.error(err);
        } finally {
            resetBtn.disabled = false;
            resetBtn.innerHTML = 'Reset Password';
        }
    };

    /**
     * Cooldown Logic: Prevents verification resending spam by enforcing a 30s timer.
     */
    const startCountdown = () => {
        clearInterval(state.countdownTimer);
        state.countdownSeconds = 30;

        const resendBtn = document.querySelector(DOM.resendBtn);
        const countdownText = document.querySelector(DOM.countdownText);

        if (resendBtn && countdownText) {
            // Disable button click capability
            resendBtn.style.pointerEvents = 'none';
            resendBtn.style.opacity = '0.5';
            countdownText.style.display = 'inline';
            countdownText.textContent = ` (${state.countdownSeconds}s)`;

            // Decrement active seconds value once per 1000ms
            state.countdownTimer = setInterval(() => {
                state.countdownSeconds--;
                countdownText.textContent = ` (${state.countdownSeconds}s)`;

                // When cooldown reaches 0, release lock state
                if (state.countdownSeconds <= 0) {
                    clearInterval(state.countdownTimer);
                    resendBtn.style.pointerEvents = 'auto'; // Re-enable pointer clicks
                    resendBtn.style.opacity = '1';
                    countdownText.style.display = 'none';
                }
            }, 1000);
        }
    };

    /**
     * Action Handler: Trigger resending code via SMTP API.
     */
    const handleResendCode = async (e) => {
        e.preventDefault();
        hideError();
        hideSuccess();

        const resendBtn = document.querySelector(DOM.resendBtn);

        try {
            resendBtn.style.pointerEvents = 'none';
            resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resending...';

            const result = await postData('/Account/SendVerificationCode', { Email: state.email });

            if (result.success) {
                showSuccess("A new code has been sent to your email!");
                startCountdown(); // Restart the 30-second cooldown timer
            } else {
                showError(result.message);
                resendBtn.style.pointerEvents = 'auto'; // Re-allow if API throws validation reject
            }
        } catch (err) {
            showError("Failed to resend code. Please try again.");
            console.error(err);
            resendBtn.style.pointerEvents = 'auto';
        } finally {
            resendBtn.innerHTML = 'Resend Code';
        }
    };

    /**
     * Initializes all event bindings on module start.
     */
    const init = () => {
        // Bind step forms submission events
        const step1Form = document.querySelector(`${DOM.step1} form`);
        if (step1Form) step1Form.addEventListener('submit', handleSendCode);

        const step2Form = document.querySelector(`${DOM.step2} form`);
        if (step2Form) step2Form.addEventListener('submit', handleVerifyCode);

        const step3Form = document.querySelector(`${DOM.step3} form`);
        if (step3Form) step3Form.addEventListener('submit', handleResetPassword);

        // Bind resend code trigger button
        const resendBtn = document.querySelector(DOM.resendBtn);
        if (resendBtn) resendBtn.addEventListener('click', handleResendCode);

        // Bind eye toggles for password fields visibility
        document.querySelectorAll(DOM.togglePasswordBtn).forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.closest('.input-wrapper').querySelector('input');
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    
                    // Toggle font-awesome icon visibility class
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                }
            });
        });
    };

    // Public API returned to scope
    return { init };
})();

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => ForgotPasswordPage.init());

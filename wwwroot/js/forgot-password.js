/**
 * Forgot Password Flow JavaScript module
 * Wraps logic in an IIFE to prevent global scope contamination.
 */
const ForgotPasswordPage = (() => {
    // DOM Cache
    const DOM = {
        card: '.auth-card',
        subtitle: '.auth-subtitle',
        errorBox: '#errorBox',
        errorMessage: '#errorMessage',
        successBox: '#successBox',
        successMessage: '#successMessage',
        antiForgery: 'input[name="__RequestVerificationToken"]',

        // Steps
        step1: '#step-email',
        step2: '#step-code',
        step3: '#step-password',

        // Inputs
        emailInput: '#EmailAddress',
        codeInput: '#VerificationCode',
        passwordInput: '#NewPassword',
        confirmPasswordInput: '#ConfirmPassword',

        // Buttons / Elements
        sendBtn: '#sendCodeBtn',
        verifyBtn: '#verifyCodeBtn',
        resetBtn: '#resetPasswordBtn',
        resendBtn: '#resendCodeBtn',
        countdownText: '#countdownText',

        // Helpers
        togglePasswordBtn: '.toggle-password'
    };

    let state = {
        email: '',
        verificationCode: '',
        countdownTimer: null,
        countdownSeconds: 30
    };

    // Helper: Show error alert
    const showError = (message) => {
        const errorBox = document.querySelector(DOM.errorBox);
        const errorMsg = document.querySelector(DOM.errorMessage);
        if (errorBox && errorMsg) {
            errorMsg.textContent = message;
            errorBox.style.display = 'block';
            // Scroll to top of card if needed
            errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    // Helper: Hide error alert
    const hideError = () => {
        const errorBox = document.querySelector(DOM.errorBox);
        if (errorBox) {
            errorBox.style.display = 'none';
        }
    };

    // Helper: Show success message
    const showSuccess = (message) => {
        const successBox = document.querySelector(DOM.successBox);
        const successMsg = document.querySelector(DOM.successMessage);
        if (successBox && successMsg) {
            successMsg.textContent = message;
            successBox.style.display = 'block';
        }
    };

    // Helper: Hide success message
    const hideSuccess = () => {
        const successBox = document.querySelector(DOM.successBox);
        if (successBox) {
            successBox.style.display = 'none';
        }
    };

    // Helper: Transition steps smoothly
    const transitionToStep = (fromStepSelector, toStepSelector, newSubtitle) => {
        const fromStep = document.querySelector(fromStepSelector);
        const toStep = document.querySelector(toStepSelector);
        const subtitle = document.querySelector(DOM.subtitle);

        if (fromStep && toStep) {
            hideError();
            hideSuccess();

            // Apply fade-out animation to current step
            fromStep.style.opacity = '0';
            fromStep.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                fromStep.style.display = 'none';
                toStep.style.display = 'block';
                
                // Triggers styling redraw
                toStep.offsetHeight; 

                // Fade-in target step
                toStep.style.opacity = '1';
                toStep.style.transform = 'translateY(0)';

                if (subtitle && newSubtitle) {
                    subtitle.textContent = newSubtitle;
                }
            }, 300);
        }
    };

    // Helper: Post Form Data helper using URL-encoded parameters to bind correctly with CSRF protection
    const postData = async (url, paramsObj) => {
        const tokenElement = document.querySelector(DOM.antiForgery);
        if (tokenElement) {
            paramsObj['__RequestVerificationToken'] = tokenElement.value;
        }

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

        return await response.json();
    };

    // Step 1: Send Code Handler
    const handleSendCode = async (e) => {
        e.preventDefault();
        hideError();

        const emailInput = document.querySelector(DOM.emailInput);
        if (!emailInput || !emailInput.value.trim()) {
            showError("Please enter your email address.");
            return;
        }

        const email = emailInput.value.trim();
        const sendBtn = document.querySelector(DOM.sendBtn);

        try {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending Code...';

            const result = await postData('/Account/SendVerificationCode', { Email: email });

            if (result.success) {
                state.email = email;
                showSuccess(result.message);
                
                // Wait briefly for user to see success before transitioning
                setTimeout(() => {
                    transitionToStep(DOM.step1, DOM.step2, `We've sent a 6-digit verification code to ${email}`);
                    startCountdown();
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

    // Step 2: Verify Code Handler
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
                state.verificationCode = code;
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

    // Step 3: Reset Password Handler
    const handleResetPassword = async (e) => {
        e.preventDefault();
        hideError();

        const passwordInput = document.querySelector(DOM.passwordInput);
        const confirmPasswordInput = document.querySelector(DOM.confirmPasswordInput);

        if (!passwordInput || !passwordInput.value) {
            showError("Please enter your new password.");
            return;
        }

        if (passwordInput.value.length < 6) {
            showError("Password must be at least 6 characters long.");
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
                
                // Clear state
                clearInterval(state.countdownTimer);

                // Redirect to login after 2 seconds
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

    // Cooldown Resend Countdown Logic
    const startCountdown = () => {
        clearInterval(state.countdownTimer);
        state.countdownSeconds = 30;

        const resendBtn = document.querySelector(DOM.resendBtn);
        const countdownText = document.querySelector(DOM.countdownText);

        if (resendBtn && countdownText) {
            resendBtn.style.pointerEvents = 'none';
            resendBtn.style.opacity = '0.5';
            countdownText.style.display = 'inline';
            countdownText.textContent = ` (${state.countdownSeconds}s)`;

            state.countdownTimer = setInterval(() => {
                state.countdownSeconds--;
                countdownText.textContent = ` (${state.countdownSeconds}s)`;

                if (state.countdownSeconds <= 0) {
                    clearInterval(state.countdownTimer);
                    resendBtn.style.pointerEvents = 'auto';
                    resendBtn.style.opacity = '1';
                    countdownText.style.display = 'none';
                }
            }, 1000);
        }
    };

    // Resend Code Action
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
                startCountdown();
            } else {
                showError(result.message);
                // Allow trying again immediately if rate limit wasn't the issue
                resendBtn.style.pointerEvents = 'auto';
            }
        } catch (err) {
            showError("Failed to resend code. Please try again.");
            console.error(err);
            resendBtn.style.pointerEvents = 'auto';
        } finally {
            resendBtn.innerHTML = 'Resend Code';
        }
    };

    // Initialize module events
    const init = () => {
        // Form binds
        const step1Form = document.querySelector(`${DOM.step1} form`);
        if (step1Form) step1Form.addEventListener('submit', handleSendCode);

        const step2Form = document.querySelector(`${DOM.step2} form`);
        if (step2Form) step2Form.addEventListener('submit', handleVerifyCode);

        const step3Form = document.querySelector(`${DOM.step3} form`);
        if (step3Form) step3Form.addEventListener('submit', handleResetPassword);

        // Resend button bind
        const resendBtn = document.querySelector(DOM.resendBtn);
        if (resendBtn) resendBtn.addEventListener('click', handleResendCode);

        // Password visibility toggles
        document.querySelectorAll(DOM.togglePasswordBtn).forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.closest('.input-wrapper').querySelector('input');
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    
                    // Toggle icon class
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                }
            });
        });
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => ForgotPasswordPage.init());

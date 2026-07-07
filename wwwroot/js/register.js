/* -------------------------------------------------------------
 * Aura Style System - Register Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution
 * ------------------------------------------------------------- */

const RegisterPage = (() => {
    // DOM selectors object
    const DOM = {
        themeSelect: '#theme-select',
        passwordField: '#Password',
        confirmPasswordField: '#ConfirmPassword',
        togglePasswordBtn: '#toggle-password-btn',
        toggleConfirmPasswordBtn: '#toggle-confirm-password-btn',
        strengthFill: '#strength-fill',
        strengthText: '#strength-text',
        authForm: '.auth-form',
        toastContainer: '#toast-container',
        placeholderBtns: '.placeholder-btn'
    };

    // Initialize layout theme dropdown
    const initTheme = () => {
        const themeSelect = document.querySelector(DOM.themeSelect);
        const currentTheme = localStorage.getItem('aura_theme') || 'dark';
        
        if (themeSelect) {
            themeSelect.value = currentTheme;
            applyTheme(currentTheme);

            themeSelect.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                localStorage.setItem('aura_theme', selectedTheme);
                applyTheme(selectedTheme);
            });
        }
    };

    // Apply classes for background theme colors
    const applyTheme = (themeName) => {
        if (themeName === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }
    };

    // Show or hide password characters
    const initPasswordToggle = () => {
        const setupToggle = (btnId, inputId) => {
            const toggleBtn = document.querySelector(btnId);
            const inputField = document.querySelector(inputId);
            if (toggleBtn && inputField) {
                toggleBtn.addEventListener('click', () => {
                    const isPassword = inputField.getAttribute('type') === 'password';
                    
                    if (isPassword) {
                        inputField.setAttribute('type', 'text');
                        toggleBtn.classList.remove('fa-eye-slash');
                        toggleBtn.classList.add('fa-eye');
                    } else {
                        inputField.setAttribute('type', 'password');
                        toggleBtn.classList.remove('fa-eye');
                        toggleBtn.classList.add('fa-eye-slash');
                    }
                });
            }
        };

        setupToggle(DOM.togglePasswordBtn, DOM.passwordField);
        setupToggle(DOM.toggleConfirmPasswordBtn, DOM.confirmPasswordField);
    };

    // Password strength verification
    const initPasswordStrength = () => {
        const passwordInput = document.querySelector(DOM.passwordField);
        const strengthFill = document.querySelector(DOM.strengthFill);
        const strengthText = document.querySelector(DOM.strengthText);

        if (!passwordInput || !strengthFill || !strengthText) return;

        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let score = 0;

            if (!val) {
                strengthFill.style.width = '0%';
                strengthFill.style.backgroundColor = 'transparent';
                strengthText.textContent = 'Password Strength';
                return;
            }

            // Length rule
            if (val.length >= 8) score++;
            // Lower case rule
            if (/[a-z]/.test(val)) score++;
            // Upper case rule
            if (/[A-Z]/.test(val)) score++;
            // Number rule
            if (/\d/.test(val)) score++;
            // Special character rule
            if (/[\W_]/.test(val)) score++;

            let pct = 0;
            let color = '';
            let text = '';

            switch (score) {
                case 1:
                case 2:
                    pct = 25;
                    color = '#ef4444'; // Red
                    text = 'Weak';
                    break;
                case 3:
                    pct = 50;
                    color = '#f59e0b'; // Amber
                    text = 'Fair';
                    break;
                case 4:
                    pct = 75;
                    color = '#3b82f6'; // Blue
                    text = 'Good';
                    break;
                case 5:
                    pct = 100;
                    color = '#10b981'; // Green
                    text = 'Strong & Secure';
                    break;
                default:
                    pct = 0;
                    color = 'transparent';
                    text = 'Too short';
            }

            strengthFill.style.width = `${pct}%`;
            strengthFill.style.backgroundColor = color;
            strengthText.textContent = `Strength: ${text}`;
            strengthText.style.color = color;
        });
    };

    // Build and display toaster messages
    const showToast = (title, message, toastType = 'info') => {
        const container = document.querySelector(DOM.toastContainer);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${toastType}`;

        let iconClass = 'fa-circle-info';
        if (toastType === 'error') {
            iconClass = 'fa-circle-xmark';
        } else if (toastType === 'warning') {
            iconClass = 'fa-circle-exclamation';
        } else if (toastType === 'success') {
            iconClass = 'fa-circle-check';
        }

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close message">&times;</button>
        `;

        container.appendChild(toast);

        // Transition animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Bind click handler on close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeToast(toast);
            });
        }

        // Auto close toast
        setTimeout(() => {
            if (toast.parentNode) {
                removeToast(toast);
            }
        }, 5000);
    };

    const removeToast = (toast) => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    };

    // Check for validation errors or login issues returned by server
    const initErrorHandling = () => {
        const serverErrorData = document.querySelector('#server-error-data');
        if (serverErrorData && serverErrorData.dataset.message) {
            showToast("Registration Failure", serverErrorData.dataset.message, "error");
        }

        const summaryContainer = document.querySelector('#validation-summary-container');
        if (summaryContainer) {
            const errors = summaryContainer.querySelectorAll('li');
            for (let i = 0; i < errors.length; i++) {
                const err = errors[i];
                const text = err.textContent.trim();
                if (text && text !== "" && err.style.display !== "none") {
                    showToast("Validation Error", text, "error");
                }
            }
        }
    };

    // Integrate with jQuery unobtrusive form validation
    const initFormSubmit = () => {
        const form = document.querySelector(DOM.authForm);
        if (form) {
            const jqForm = $(form);

            // Configure jQuery validator behavior
            const validator = jqForm.data('validator');
            if (validator) {
                validator.settings.onfocusout = function (element) {
                    const isCheckable = this.checkable(element);
                    const isAlreadySubmitted = element.name in this.submitted;
                    const isRequired = !this.optional(element);

                    if (!isCheckable && (isAlreadySubmitted || isRequired)) {
                        this.element(element);
                    }
                };

                validator.settings.onkeyup = function (element) {
                    if (element.name in this.submitted) {
                        this.element(element);
                    }
                };
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    if (jqForm.length && !jqForm.valid()) {
                        setTimeout(() => {
                            const firstError = form.querySelector('.field-validation-error');
                            let msg = "Please correct the highlighted errors in the form.";
                            if (firstError && firstError.textContent.trim() !== "") {
                                msg = firstError.textContent.trim();
                            }
                            showToast("Form Incomplete", msg, "warning");
                        }, 50);
                    }
                });
            }
        }
    };

    const initSocialPlaceholders = () => {
        const btns = document.querySelectorAll(DOM.placeholderBtns);
        for (let i = 0; i < btns.length; i++) {
            const btn = btns[i];
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.getAttribute('data-provider');
                const warningMsg = `${provider} login is not configured for this workspace. Please sign in with Google or account credentials.`;
                showToast("Provider Offline", warningMsg, "warning");
            });
        }
    };

    return {
        init: () => {
            initTheme();
            initPasswordToggle();
            initPasswordStrength();
            initErrorHandling();
            initFormSubmit();
            initSocialPlaceholders();
        },
        toast: (title, message, toastType) => {
            showToast(title, message, toastType);
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    RegisterPage.init();
});

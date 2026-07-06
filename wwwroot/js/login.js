/* -------------------------------------------------------------
 * Aura Style System - Login Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution
 * ------------------------------------------------------------- */

const LoginPage = (() => {
    // DOM selectors object
    const DOM = {
        themeSelect: '#theme-select',
        passwordField: '#Password',
        togglePasswordBtn: '#toggle-password-btn',
        authForm: '.auth-form',
        toastContainer: '#toast-container',
        placeholderBtns: '.placeholder-btn'
    };

    // Initialize layout theme dropdown on login page
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
        const toggleBtn = document.querySelector(DOM.togglePasswordBtn);
        const passwordField = document.querySelector(DOM.passwordField);
        if (toggleBtn && passwordField) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordField.getAttribute('type') === 'password';
                
                if (isPassword) {
                    passwordField.setAttribute('type', 'text');
                    toggleBtn.classList.remove('fa-eye-slash');
                    toggleBtn.classList.add('fa-eye');
                } else {
                    passwordField.setAttribute('type', 'password');
                    toggleBtn.classList.remove('fa-eye');
                    toggleBtn.classList.add('fa-eye-slash');
                }
            });
        }
    };

    // Build and display toaster messages (e.g. alerts or errors)
    const showToast = (title, message, toastType = 'info') => {
        const container = document.querySelector(DOM.toastContainer);
        if (!container) {
            return;
        }

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

        // Delay 10ms to allow browser to trigger CSS entrance animation
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

        // Auto close toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                removeToast(toast);
            }
        }, 5000);
    };

    // Clear toast with animation
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
        // 1. Read TempData Message if populated
        const serverErrorData = document.querySelector('#server-error-data');
        if (serverErrorData && serverErrorData.dataset.message) {
            showToast("Login Failure", serverErrorData.dataset.message, "error");
        }

        // 2. Read ASP.NET Core Validation Summary errors
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

    // Integrate with jQuery unobtrusive form validation to validate inputs dynamically
    const initFormSubmit = () => {
        const form = document.querySelector(DOM.authForm);
        if (form) {
            const jqForm = $(form);

            // Configure jQuery validator behavior
            const validator = jqForm.data('validator');
            if (validator) {
                // Validate input when user clicks away from a field
                validator.settings.onfocusout = function (element) {
                    const isCheckable = this.checkable(element);
                    const isAlreadySubmitted = element.name in this.submitted;
                    const isRequired = !this.optional(element);

                    if (!isCheckable && (isAlreadySubmitted || isRequired)) {
                        this.element(element);
                    }
                };

                // Remove error warning immediately when correcting input
                validator.settings.onkeyup = function (element) {
                    if (element.name in this.submitted) {
                        this.element(element);
                    }
                };
            }

            // Click submit button handler
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

    // Temporary placeholder message for unsupported login options
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

    // Public module exports
    return {
        init: () => {
            initTheme();
            initPasswordToggle();
            initErrorHandling();
            initFormSubmit();
            initSocialPlaceholders();
        },
        toast: (title, message, toastType) => {
            showToast(title, message, toastType);
        }
    };
})();

// Auto-run initialization when layout finishes loading
document.addEventListener('DOMContentLoaded', () => {
    LoginPage.init();
});

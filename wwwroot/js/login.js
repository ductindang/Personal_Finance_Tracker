/* -------------------------------------------------------------
 * Aura Style System - Login Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution
 * ------------------------------------------------------------- */

const LoginPage = (() => {
    const DOM = {
        themeSelect: '#theme-select',
        passwordField: '#Password',
        togglePasswordBtn: '#toggle-password-btn',
        authForm: '.auth-form',
        toastContainer: '#toast-container',
        placeholderBtns: '.placeholder-btn'
    };

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

    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }
    };

    const initPasswordToggle = () => {
        const toggleBtn = document.querySelector(DOM.togglePasswordBtn);
        const passwordField = document.querySelector(DOM.passwordField);
        if (toggleBtn && passwordField) {
            toggleBtn.addEventListener('click', () => {
                const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordField.setAttribute('type', type);
                
                // Toggle between open eye and closed eye icons
                if (type === 'password') {
                    toggleBtn.classList.remove('fa-eye');
                    toggleBtn.classList.add('fa-eye-slash');
                } else {
                    toggleBtn.classList.remove('fa-eye-slash');
                    toggleBtn.classList.add('fa-eye');
                }
            });
        }
    };

    const showToast = (title, message, type = 'info') => {
        const container = document.querySelector(DOM.toastContainer);
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;

        let iconClass = 'fa-circle-info';
        if (type === 'error') iconClass = 'fa-circle-xmark';
        else if (type === 'warning') iconClass = 'fa-circle-exclamation';
        else if (type === 'success') iconClass = 'fa-circle-check';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close message">&times;</button>
        `;

        container.appendChild(toast);

        // Force a reflow and add the active class to trigger css slide-in animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Bind click on close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto close after 5 seconds
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
            if (errors.length > 0) {
                errors.forEach(err => {
                    const text = err.textContent.trim();
                    // ASP.NET Core defaults validation summary template containing a hidden/empty first list item sometimes
                    if (text && text !== "" && err.style.display !== "none") {
                        showToast("Validation Error", text, "error");
                    }
                });
            }
        }
    };

    const initFormSubmit = () => {
        const form = document.querySelector(DOM.authForm);
        if (form) {
            const jqForm = $(form);

            // Enable on-blur (onfocusout) validation by overriding the
            // jquery-validation-unobtrusive defaults which disable it.
            const validator = jqForm.data('validator');
            if (validator) {
                validator.settings.onfocusout = function (element) {
                    // Only validate once the user has interacted (dirty)
                    if (!this.checkable(element) && (element.name in this.submitted || !this.optional(element))) {
                        this.element(element);
                    }
                };

                // Also enable eager validation after a field has been
                // marked invalid once (so correcting clears the error).
                validator.settings.onkeyup = function (element, event) {
                    if (element.name in this.submitted) {
                        this.element(element);
                    }
                };
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    if (jqForm.length && !jqForm.valid()) {
                        setTimeout(() => {
                            const firstError = form.querySelector('.field-validation-error');
                            const msg = firstError && firstError.textContent.trim() !== ""
                                ? firstError.textContent.trim() 
                                : "Please correct the highlighted errors in the form.";
                            showToast("Form Incomplete", msg, "warning");
                        }, 50);
                    }
                });
            }
        }
    };

    const initSocialPlaceholders = () => {
        const btns = document.querySelectorAll(DOM.placeholderBtns);
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.getAttribute('data-provider');
                showToast("Provider Offline", `${provider} login is not configured for this workspace. Please sign in with Google or account credentials.`, "warning");
            });
        });
    };

    return {
        init: () => {
            initTheme();
            initPasswordToggle();
            initErrorHandling();
            initFormSubmit();
            initSocialPlaceholders();
        },
        toast: (title, message, type) => showToast(title, message, type)
    };
})();

document.addEventListener('DOMContentLoaded', () => LoginPage.init());

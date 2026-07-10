/* -------------------------------------------------------------
 * Aura Style System - Login Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution.
 * This pattern isolates variables, keeping them out of the global window scope.
 * ------------------------------------------------------------- */

const LoginPage = (() => {
    // 1. Selector mapping definitions for DOM elements
    const DOM = {
        themeSelect: '#theme-select',            // Theme select element (Dark/Light dropdown)
        passwordField: '#Password',              // Password input element
        togglePasswordBtn: '#toggle-password-btn', // Toggle eye icon for password field visibility
        authForm: '.auth-form',                  // Login credentials form class selector
        toastContainer: '#toast-container',      // Toast notification wrapper selector
        placeholderBtns: '.placeholder-btn'      // Inactive social auth link placeholders
    };

    // 2. Initialize and configure theme support (Dark/Light modes)
    const initTheme = () => {
        const themeSelect = document.querySelector(DOM.themeSelect);
        // Load stored user theme configuration or default to 'dark'
        const currentTheme = localStorage.getItem('aura_theme') || 'dark';
        
        if (themeSelect) {
            themeSelect.value = currentTheme;
            applyTheme(currentTheme);

            // Handle theme changes dynamically from dropdown select changes
            themeSelect.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                localStorage.setItem('aura_theme', selectedTheme);
                applyTheme(selectedTheme);
            });
        }
    };

    // Apply the active layout theme state classes to the document body
    const applyTheme = (themeName) => {
        if (themeName === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }
    };

    // 3. Show or hide password characters on toggle button clicks
    const initPasswordToggle = () => {
        const toggleBtn = document.querySelector(DOM.togglePasswordBtn);
        const passwordField = document.querySelector(DOM.passwordField);
        if (toggleBtn && passwordField) {
            toggleBtn.addEventListener('click', () => {
                const isPassword = passwordField.getAttribute('type') === 'password';
                
                if (isPassword) {
                    // Switch type to text to reveal plaintext characters
                    passwordField.setAttribute('type', 'text');
                    toggleBtn.classList.remove('fa-eye-slash');
                    toggleBtn.classList.add('fa-eye');
                } else {
                    // Switch type to password to hide characters
                    passwordField.setAttribute('type', 'password');
                    toggleBtn.classList.remove('fa-eye');
                    toggleBtn.classList.add('fa-eye-slash');
                }
            });
        }
    };

    // 4. Toast alert rendering and close management animations
    const showToast = (title, message, toastType = 'info') => {
        const container = document.querySelector(DOM.toastContainer);
        if (!container) return;

        // Build HTML markup structure for toaster
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

        // Slide entrance transitions
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Close button click listener
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                removeToast(toast);
            });
        }

        // Auto destroy notifications after 5 seconds
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

    // 5. Check for backend validation errors or notifications passed in markup data-attributes
    const initErrorHandling = () => {
        // Read server TempData feedback tags
        const serverErrorData = document.querySelector('#server-error-data');
        if (serverErrorData && serverErrorData.dataset.message) {
            showToast("Login Failure", serverErrorData.dataset.message, "error");
        }

        const serverSuccessData = document.querySelector('#server-success-data');
        if (serverSuccessData && serverSuccessData.dataset.message) {
            showToast("Success", serverSuccessData.dataset.message, "success");
        }

        // Read standard ASP.NET model validation list elements
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

    // 6. Configure jQuery unobtrusive form validation hooks
    const initFormSubmit = () => {
        const form = document.querySelector(DOM.authForm);
        if (!form) return;

        const jqForm = $(form);
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

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Run jQuery validation checks first
            if (jqForm.length && !jqForm.valid()) {
                const firstError = form.querySelector('.field-validation-error');
                let msg = "Please correct the highlighted errors in the form.";
                if (firstError?.textContent.trim()) {
                    msg = firstError.textContent.trim();
                }
                showToast("Form Incomplete", msg, "warning");
                return;
            }

            // Perform AJAX submission
            const formData = new FormData(form);
            const bodyData = new URLSearchParams(formData);

            try {
                const response = await fetch(form.action || window.location.pathname, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: bodyData
                });

                if (!response.ok) {
                    throw new Error("Server returned an error response.");
                }

                const result = await response.json();

                if (result.success) {
                    window.location.href = result.redirectUrl;
                } else {
                    if (result.requiresVerification && result.redirectUrl) {
                        showToast("Verification Required", "Redirecting to verify your email...", "warning");
                        setTimeout(() => {
                            window.location.href = result.redirectUrl;
                        }, 1500);
                    } else if (result.errors) {
                        result.errors.forEach(err => {
                            showToast("Login Failure", err, "error");
                        });
                    } else {
                        showToast("Login Failure", "An unknown error occurred.", "error");
                    }
                }
            } catch (error) {
                showToast("Connection Error", "Failed to contact the server. Please check your connection.", "error");
            }
        });
    };

    // 7. Visual placeholders for unconfigured oauth options
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

    // Public API endpoints
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

// Auto-run module when layout loading is complete
document.addEventListener('DOMContentLoaded', () => {
    LoginPage.init();
});

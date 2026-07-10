/* -------------------------------------------------------------
 * Aura Style System - Register Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution.
 * This pattern isolates variables, keeping them out of the global window scope.
 * ------------------------------------------------------------- */

const RegisterPage = (() => {
    // 1. Selector mapping definitions for DOM elements
    const DOM = {
        themeSelect: '#theme-select',                        // Theme selection dropdown element
        passwordField: '#Password',                          // Primary password input field
        confirmPasswordField: '#ConfirmPassword',            // Confirm password input field
        togglePasswordBtn: '#toggle-password-btn',          // Toggle icon for primary password visibility
        toggleConfirmPasswordBtn: '#toggle-confirm-password-btn', // Toggle icon for confirmation password visibility
        strengthFill: '#strength-fill',                      // Div representing the progress fill bar
        strengthText: '#strength-text',                      // Text label displaying strength evaluation
        authForm: '.auth-form',                              // Main registration form class
        toastContainer: '#toast-container',                  // Toast notifications container element
        placeholderBtns: '.placeholder-btn'                  // Placeholder social auth buttons
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
        const setupToggle = (btnId, inputId) => {
            const toggleBtn = document.querySelector(btnId);
            const inputField = document.querySelector(inputId);
            if (toggleBtn && inputField) {
                toggleBtn.addEventListener('click', () => {
                    const isPassword = inputField.getAttribute('type') === 'password';
                    
                    if (isPassword) {
                        // Switch type to text to reveal plaintext characters
                        inputField.setAttribute('type', 'text');
                        toggleBtn.classList.remove('fa-eye-slash');
                        toggleBtn.classList.add('fa-eye');
                    } else {
                        // Switch type to password to hide characters
                        inputField.setAttribute('type', 'password');
                        toggleBtn.classList.remove('fa-eye');
                        toggleBtn.classList.add('fa-eye-slash');
                    }
                });
            }
        };

        // Attach event listeners for password fields
        setupToggle(DOM.togglePasswordBtn, DOM.passwordField);
        setupToggle(DOM.toggleConfirmPasswordBtn, DOM.confirmPasswordField);
    };

    // 4. Password strength evaluation meter configuration
    const initPasswordStrength = () => {
        const passwordInput = document.querySelector(DOM.passwordField);
        const strengthFill = document.querySelector(DOM.strengthFill);
        const strengthText = document.querySelector(DOM.strengthText);

        if (!passwordInput || !strengthFill || !strengthText) return;

        // Listen for user typing inputs in the password field
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            let score = 0;

            if (!val) {
                // Reset state when input is empty
                strengthFill.style.width = '0%';
                strengthFill.style.backgroundColor = 'transparent';
                strengthText.textContent = 'Password Strength';
                return;
            }

            // Score-based evaluation rules:
            if (val.length >= 8) score++;      // Rule 1: Length rule (>= 8 chars)
            if (/[a-z]/.test(val)) score++;     // Rule 2: Lower case letter present
            if (/[A-Z]/.test(val)) score++;     // Rule 3: Upper case letter present
            if (/\d/.test(val)) score++;        // Rule 4: Number digit present
            if (/[\W_]/.test(val)) score++;     // Rule 5: Special symbol character present

            let pct = 0;
            let color = '';
            let text = '';

            // Apply evaluations based on rule match counts
            switch (score) {
                case 1:
                case 2:
                    pct = 25;
                    color = '#ef4444'; // Weak score -> Red
                    text = 'Weak';
                    break;
                case 3:
                    pct = 50;
                    color = '#f59e0b'; // Fair score -> Amber
                    text = 'Fair';
                    break;
                case 4:
                    pct = 75;
                    color = '#3b82f6'; // Good score -> Blue
                    text = 'Good';
                    break;
                case 5:
                    pct = 100;
                    color = '#10b981'; // Strong score -> Green
                    text = 'Strong & Secure';
                    break;
                default:
                    pct = 0;
                    color = 'transparent';
                    text = 'Too short';
            }

            // Update DOM element states dynamically with transitions
            strengthFill.style.width = `${pct}%`;
            strengthFill.style.backgroundColor = color;
            strengthText.textContent = `Strength: ${text}`;
            strengthText.style.color = color;
        });
    };

    // 5. Toast alert rendering and close management animations
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

    // 6. Check for backend validation errors or notifications passed in markup data-attributes
    const initErrorHandling = () => {
        // Read server TempData feedback tags
        const serverErrorData = document.querySelector('#server-error-data');
        if (serverErrorData && serverErrorData.dataset.message) {
            showToast("Registration Failure", serverErrorData.dataset.message, "error");
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

    // 7. Configure Form Validation & Submission hooks via AJAX
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
                    if (result.errors) {
                        result.errors.forEach(err => {
                            showToast("Registration Failure", err, "error");
                        });
                    } else {
                        showToast("Registration Failure", "An unknown error occurred.", "error");
                    }
                }
            } catch (error) {
                showToast("Connection Error", "Failed to contact the server. Please check your connection.", "error");
            }
        });
    };

    // 8. Visual placeholders for unconfigured oauth options
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

// Auto-run module when layout loading is complete
document.addEventListener('DOMContentLoaded', () => {
    RegisterPage.init();
});

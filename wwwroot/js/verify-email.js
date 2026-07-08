/* -------------------------------------------------------------
 * Aura Style System - Verify Email Page Specific JavaScript Module
 * Encapsulated IIFE pattern to prevent global namespace pollution.
 * This pattern isolates variables, keeping them out of the global window scope.
 * ------------------------------------------------------------- */

const VerifyEmailPage = (() => {
    // 1. Selector mapping definitions for DOM elements
    const DOM = {
        themeSelect: '#theme-select',                 // Theme selector dropdown element
        codeDisplayInput: '#verification-code-display', // Visual code entry input field
        codeValueInput: '#verification-code-value',     // Hidden input holding validated code to submit
        authForm: '#verify-email-form',                 // Main email verification form container
        resendForm: '#resend-form',                     // Hidden form triggered for resending verification email
        resendBtn: '#resend-code-btn',                  // Button clicked to trigger code resend
        toastContainer: '#toast-container'              // Toast notifications wrapper element
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

    // 3. Configure code entry formatting behaviors (filtering numeric values only)
    const initCodeInput = () => {
        const displayInput = document.querySelector(DOM.codeDisplayInput);
        const valueInput = document.querySelector(DOM.codeValueInput);

        if (displayInput && valueInput) {
            // Automatically focus verification input on load
            displayInput.focus();

            displayInput.addEventListener('input', (e) => {
                // Remove any non-digit character dynamically using regular expressions
                let cleaned = e.target.value.replace(/\D/g, '');
                
                // Truncate length limit to exactly 6 digits
                if (cleaned.length > 6) {
                    cleaned = cleaned.substring(0, 6);
                }

                // Sync UI value and hidden input value
                e.target.value = cleaned;
                valueInput.value = cleaned;
            });
        }
    };

    // 4. Configure code resend buttons and rate limiting cooldown timers
    const initResendBtn = () => {
        const resendBtn = document.querySelector(DOM.resendBtn);
        const resendForm = document.querySelector(DOM.resendForm);

        if (resendBtn && resendForm) {
            const COOLDOWN_MS = 30000; // 30-second rate limit duration
            
            // Handles updating button states and countdown ticking text
            const startCooldown = (remainingMs) => {
                // Disable button and visual interactions immediately
                resendBtn.disabled = true;
                resendBtn.style.pointerEvents = 'none';
                resendBtn.style.opacity = '0.5';
                
                const updateTimer = () => {
                    const sec = Math.ceil(remainingMs / 1000);
                    resendBtn.textContent = `Resend in ${sec}s`;
                    
                    if (remainingMs <= 0) {
                        // Re-enable resend actions once timer expires
                        resendBtn.disabled = false;
                        resendBtn.style.pointerEvents = 'auto';
                        resendBtn.style.opacity = '1';
                        resendBtn.textContent = "Resend code";
                        sessionStorage.removeItem('verify_email_cooldown');
                    } else {
                        remainingMs -= 1000;
                        setTimeout(updateTimer, 1000); // Trigger countdown tick update every second
                    }
                };
                updateTimer();
            };

            // Check if verification cooldown is running from a previous page load
            const cooldownExpiry = sessionStorage.getItem('verify_email_cooldown');
            if (cooldownExpiry) {
                const diff = parseInt(cooldownExpiry) - Date.now();
                if (diff > 0) {
                    startCooldown(diff);
                } else {
                    sessionStorage.removeItem('verify_email_cooldown');
                }
            }

            // Click listener for resending code
            resendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (resendBtn.disabled) return;

                // 1. Record cooldown timestamp in sessionStorage (persists across page reloads)
                sessionStorage.setItem('verify_email_cooldown', (Date.now() + COOLDOWN_MS).toString());
                
                // 2. Synchronously disable UI button before POST action triggers (prevents double submits)
                startCooldown(COOLDOWN_MS);
                
                // 3. Issue form POST submission in background
                showToast("Sending...", "Requesting a new verification code...", "info");
                resendForm.submit();
            });
        }
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
            showToast("Verification Error", serverErrorData.dataset.message, "error");
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

    // 7. Form submission verification validation
    const initFormSubmit = () => {
        const form = document.querySelector(DOM.authForm);
        if (form) {
            form.addEventListener('submit', (e) => {
                const codeInput = document.querySelector(DOM.codeValueInput);
                // Reject form action if code does not match length requirement
                if (!codeInput || codeInput.value.length !== 6) {
                    e.preventDefault();
                    showToast("Form Incomplete", "Please enter a valid 6-digit verification code.", "warning");
                }
            });
        }
    };

    // Public API endpoints
    return {
        init: () => {
            initTheme();
            initCodeInput();
            initResendBtn();
            initErrorHandling();
            initFormSubmit();
        }
    };
})();

// Auto-run module when layout loading is complete
document.addEventListener('DOMContentLoaded', () => {
    VerifyEmailPage.init();
});

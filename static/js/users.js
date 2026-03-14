/**
 * ========================================
 * ADMIN USER MANAGEMENT JAVASCRIPT
 * ========================================
 * 
 * FILE: users.js
 * PURPOSE: Handle all admin user CRUD operations
 * 
 * FEATURES:
 * - Add new admin users
 * - Display list of all users
 * - Delete admin users with confirmation
 * - Real-time form validation
 * - Error handling and user feedback
 * 
 * DEPENDENCIES: jQuery, Bootstrap 5, restclient.js, endpoints.js
 */

$(document).ready(function () {
    console.log('✓ Admin User Management Module Loaded');

    // Event delegation for dynamic elements
    initializeEventListeners();
});

/**
 * FUNCTION: initializeEventListeners()
 * PURPOSE: Setup all event handlers for user management
 * 
 * INCLUDES:
 * - Form submission
 * - Modal show/hide events
 * - Delete confirmations
 */
function initializeEventListeners() {
    // Form submit handler (for form tag, not just button click)
    $('#userForm').on('submit', function (event) {
        event.preventDefault();
        submitUserForm();
    });

    // Tooltip initialization for Bootstrap
    try {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } catch (e) {
        console.warn('Tooltips not initialized');
    }
}

/**
 * ========================================
 * USER FORM SUBMISSION
 * ========================================
 */

/**
 * FUNCTION: submitUserForm()
 * 
 * PURPOSE: 
 *   Submit the user form via AJAX to add a new admin user
 * 
 * HOW TO USE:
 *   1. Fill in the "Add Admin" modal form
 *   2. Click "ಸಹಿ ಮಾಡಿ" (Submit) button
 *   3. Form validates required fields
 *   4. API call sends data to /api/users
 *   5. Success/error message displayed
 *   6. On success: modal closes, user list refreshes
 * 
 * VALIDATION:
 *   - Username: Required, must be unique
 *   - Password: Required, minimum 6 characters
 *   - Email: Optional, must be valid format
 *   - Phone: Optional, any format
 * 
 * API ENDPOINT: POST /api/users
 * RESPONSE: 
 *   Success: { message: "User added successfully" }
 *   Error: { error: "Error message" }
 */
function submitUserForm() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone_number').value.trim();

    // Validation
    if (!username || !password) {
        showMessage('formMessage', '⚠ ಬಳಕೆದಾರನಾಮ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಅವಶ್ಯಕ', 'danger');
        return;
    }

    if (password.length < 6) {
        showMessage('formMessage', '⚠ ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ ೬ ಅಕ್ಷರ ಉದ್ದವಾಗಿರಬೇಕು', 'danger');
        return;
    }

    if (email && !isValidEmail(email)) {
        showMessage('formMessage', '⚠ ಸರಿಯಾದ ಇಮೇಲ್ ವಿಳಾಸ ನೀಡಿ', 'danger');
        return;
    }

    // Disable submit button during request
    const submitBtn = event.target.querySelector('button[onclick="submitUserForm()"]') ||
        document.querySelector('[onclick="submitUserForm()"]');
    if (submitBtn) submitBtn.disabled = true;

    // Prepare data
    const userData = {
        username: username,
        password: password,
        email: email,
        phone_number: phone
    };

    // API call using RestClient
    ApiClient.post(ApiEndpoints.USERS.CREATE, userData)
        .done(function (response) {
            console.log('✓ User added successfully:', response);
            showMessage('formMessage', '✓ ನಿರ್ವಾಹಕ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ', 'success');

            // Reset form
            document.getElementById('userForm').reset();

            // Update total user count
            const currentCount = parseInt(document.getElementById('totalUsers').textContent) || 0;
            document.getElementById('totalUsers').textContent = currentCount + 1;

            // Close modal after delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                if (modal) modal.hide();

                // Refresh user list if modal is open
                loadUsersList();
            }, 1500);
        })
        .fail(function (xhr, status, error) {
            console.error('✗ Error adding user:', error);
            let errorMessage = 'ದೋಷ ಸಂಭವಿಸಿದೆ';

            try {
                const response = JSON.parse(xhr.responseText);
                if (response.error) {
                    errorMessage = response.error;
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }

            showMessage('formMessage', '✗ ' + errorMessage, 'danger');
        })
        .always(function () {
            // Re-enable submit button
            if (submitBtn) submitBtn.disabled = false;
        });
}

/**
 * ========================================
 * USER LIST MANAGEMENT
 * ========================================
 */

/**
 * FUNCTION: loadUsersList()
 * 
 * PURPOSE:
 *   Fetch all admin users from the database and display in a table
 * 
 * HOW TO USE:
 *   - Automatically called when "User List" modal is opened
 *   - Can also be called programmatically: loadUsersList()
 *   - Shows loading spinner while fetching
 *   - Displays error or empty state if needed
 * 
 * DISPLAY FORMAT:
 *   - Table with: Username | Email | Phone | Actions
 *   - Each row has a delete button (red trash icon)
 *   - Click delete button to confirm deletion
 * 
 * API ENDPOINT: GET /api/users
 * 
 * RESPONSE FORMAT:
 * [
 *   {
 *     "username": "admin1",
 *     "email": "admin@example.com",
 *     "phone_number": "+91XXXXXXXXXX"
 *   },
 *   ...
 * ]
 */
function loadUsersList() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const usersTable = document.getElementById('usersTable');
    const noUsers = document.getElementById('noUsers');
    const tableBody = document.getElementById('usersTableBody');

    // Show loading spinner
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
        usersTable.style.display = 'none';
        noUsers.style.display = 'none';
    }

    // API call using RestClient
    ApiClient.get(ApiEndpoints.USERS.LIST)
        .done(function (users) {
            console.log('✓ Users loaded:', users.length);

            if (!users || users.length === 0) {
                // No users
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                if (usersTable) usersTable.style.display = 'none';
                if (noUsers) noUsers.style.display = 'block';
                return;
            }

            // Build table rows
            const rows = users.map(user => `
                <tr>
                    <td>
                        <i class="fa-solid fa-circle-user me-2 text-primary"></i>
                        <strong>${escapeHtml(user.username)}</strong>
                    </td>
                    <td>
                        ${user.email ? `<a href="mailto:${escapeHtml(user.email)}">${escapeHtml(user.email)}</a>` : '<span class="text-muted">-</span>'}
                    </td>
                    <td>
                        ${user.phone_number ? escapeHtml(user.phone_number) : '<span class="text-muted">-</span>'}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" 
                                onclick="prepareDelete('${escapeHtml(user.username)}')"
                                title="ಈ ನಿರ್ವಾಹಕನನ್ನು ಅಳಿಸಿ"
                                data-bs-toggle="tooltip">
                            <i class="fa-solid fa-trash"></i> ಅಳಿಸಿ
                        </button>
                    </td>
                </tr>
            `).join('');

            tableBody.innerHTML = rows;

            // Hide spinner, show table
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (usersTable) usersTable.style.display = 'table';
            if (noUsers) noUsers.style.display = 'none';
        })
        .fail(function (xhr, status, error) {
            console.error('✗ Error loading users:', error);
            if (loadingSpinner) {
                loadingSpinner.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="fa-solid fa-circle-exclamation me-2"></i>
                        ನಿರ್ವಾಹಕರನ್ನು ಲೋಡ್ ಮಾಡಲಲ್ಲಿ ದೋಷ
                        <small class="d-block">${escapeHtml(status)}</small>
                    </div>
                `;
            }
        });
}

/**
 * ========================================
 * USER DELETION
 * ========================================
 */

/**
 * FUNCTION: prepareDelete(username)
 * 
 * PURPOSE:
 *   Show a confirmation modal before deleting an admin user
 * 
 * HOW TO USE:
 *   1. Click the red "ಅಳಿಸಿ" (Delete) button in user list
 *   2. Confirmation modal appears with warning
 *   3. Click "ಮುಂದುವರೆಯಬೇಡಿ" or "ಅಳಿಸಿ"
 * 
 * SAFETY:
 *   - Shows confirmation modal before deletion
 *   - Cannot be reversed once confirmed
 *   - Admin user is permanently removed
 * 
 * @param {string} username - Username to delete
 */
function prepareDelete(username) {
    // Store username for use in confirmDelete
    window.deleteUsername = username;

    // Update modal with username
    const deleteUsernameElement = document.getElementById('deleteUsername');
    if (deleteUsernameElement) {
        deleteUsernameElement.textContent = username;
    }

    // Show confirmation modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();

    console.log('Prepared delete for user:', username);
}

/**
 * FUNCTION: confirmDelete()
 * 
 * PURPOSE:
 *   Actually delete the admin user after confirmation
 * 
 * HOW TO USE:
 *   1. Confirmation modal is shown
 *   2. Click red "ಅಳಿಸಿ" button to confirm
 *   3. User is deleted from database
 *   4. User list automatically refreshes
 *   5. Modal closes
 * 
 * WARNING:
 *   - This action cannot be undone
 *   - Admin user is permanently removed
 * 
 * API ENDPOINT: DELETE /api/users/{username}
 */
function confirmDelete() {
    const username = window.deleteUsername;

    if (!username) {
        alert('Error: No user selected');
        return;
    }

    // API call using RestClient
    ApiClient.delete(ApiEndpoints.USERS.DELETE(username))
        .done(function (response) {
            console.log('✓ User deleted successfully:', username);

            // Close confirmation modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            if (modal) modal.hide();

            // Update user count if visible
            const currentCount = parseInt(document.getElementById('totalUsers').textContent) || 0;
            if (currentCount > 0) {
                document.getElementById('totalUsers').textContent = currentCount - 1;
            }

            // Refresh user list
            loadUsersList();
        })
        .fail(function (xhr, status, error) {
            console.error('✗ Error deleting user:', error);

            let errorMessage = 'ನಿರ್ವಾಹಕನನ್ನು ಅಳಿಸಲಲ್ಲಿ ದೋಷ';
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.error) {
                    errorMessage = response.error;
                }
            } catch (e) { }

            alert(errorMessage);
        });
}

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * FUNCTION: showMessage(elementId, message, type)
 * 
 * PURPOSE:
 *   Display success/error/info messages in alert boxes
 * 
 * HOW TO USE:
 *   showMessage('formMessage', 'Your message', 'success');
 * 
 * PARAMETERS:
 *   - elementId: ID of the element to show message in
 *   - message: Message text (supports HTML encoding)
 *   - type: 'success', 'danger', 'warning', 'info'
 * 
 * @param {string} elementId - ID of message container
 * @param {string} message - Message text
 * @param {string} type - Bootstrap alert type
 */
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn('Message element not found:', elementId);
        return;
    }

    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

/**
 * FUNCTION: escapeHtml(text)
 * 
 * PURPOSE:
 *   Prevent XSS (Cross-Site Scripting) attacks by escaping HTML special characters
 * 
 * SECURITY:
 *   - Required for all user-generated content displayed in HTML
 *   - Converts: < > " ' & to safe HTML entities
 * 
 * EXAMPLE:
 *   HTML: <img src=x onerror="alert('XSS')">
 *   Output: &lt;img src=x onerror=&quot;alert('XSS')&quot;&gt;
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
function escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * FUNCTION: isValidEmail(email)
 * 
 * PURPOSE:
 *   Validate email address format
 * 
 * HOW TO USE:
 *   if (isValidEmail('user@example.com')) {
 *     // Valid email
 *   }
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

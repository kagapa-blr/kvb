$(document).ready(function() {
    $('#userForm').on('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        // Collect form data
        const userData = {
            username: $('#username').val(),
            password: $('#password').val(),
            phone_number: $('#phone_number').val(),
            email: $('#email').val()
        };

        // Send data using jQuery's $.ajax
        $.ajax({
            url: '/api/users',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(userData),
            success: function(response) {
                console.log('Success:', response);
                $('.message').text('User data saved successfully!').removeClass('text-danger').addClass('text-success');
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                
                // Extract error message from the response
                let errorMessage = 'Failed to save user data.';
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) {
                        errorMessage = response.error;
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }

                // Display the error message
                $('.message').text(errorMessage).removeClass('text-success').addClass('text-danger');
            }
        });
    });
});

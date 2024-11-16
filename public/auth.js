async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
        const response = await fetch('/login', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            window.location.href = data.redirect; // Redirects to the transactions page
        } else {
            alert('Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('An error occurred. Please try again.');
    }
}

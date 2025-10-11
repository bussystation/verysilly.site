const contactForm = document.querySelector('.contact-form');
const contactResponse = document.querySelector('.contact-response');

if (contactForm && contactResponse) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        
        fetch(contactForm.action, {
            method: contactForm.method,
            body: formData,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                contactResponse.textContent = 'Message sent successfully!';
                contactForm.reset();
            } else {
                contactResponse.textContent = 'Failed to send message. Please try again.';
            }
        }).catch(() => {
            contactResponse.textContent = 'Failed to send message. Please try again.';
        });
    });
}
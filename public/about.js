// Function to toggle the visibility of the about sections
function toggleAbout(sectionId) {
    // Get the specific section by its ID
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Find the content and button within the section
    const content = section.querySelector('.about-content');
    const button = section.querySelector('.view-more');

    if (!content || !button) return;

    // Check if the content is currently expanded
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        // Collapse the section
        content.classList.remove('expanded');
        content.style.display = 'none';
        button.textContent = 'Expand';
    } else {
        // Expand the section
        content.classList.add('expanded');
        content.style.display = 'block';
        button.textContent = 'Collapse';
    }
}

// Add an event listener to all buttons to initialize the toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.view-more');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.closest('.about-item').id;
            toggleAbout(sectionId);
        });
    });
});

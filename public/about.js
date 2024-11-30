// Function to toggle the visibility of the about sections
function toggleAbout(sectionId) {
    // Get the specific section by its ID
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Find the content within the section
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

// Attach event listeners to buttons and titles
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.about-item');

    sections.forEach(section => {
        const sectionId = section.id;
        const button = section.querySelector('.view-more');
        const title = section.querySelector('h2');

        // Ensure the "view-more" button works
        if (button) {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering the title click event
                toggleAbout(sectionId);
            });
        }

        // The titles already work, so no need to duplicate their functionality
        if (title) {
            title.addEventListener('click', () => toggleAbout(sectionId));
        }
    });
});

// Function to toggle the visibility of a section
function toggleAbout(sectionId) {
    // Find the section by its ID
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Find the content and button within the section
    const content = section.querySelector('.about-content');
    const button = section.querySelector('.view-more');

    if (!content || !button) return;

    // Toggle the expanded state
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

// Attach event listeners after DOM has loaded
document.addEventListener('DOMContentLoaded', () => {
    // Select all sections
    const sections = document.querySelectorAll('.about-item');

    sections.forEach(section => {
        const sectionId = section.id;
        const title = section.querySelector('h2');
        const button = section.querySelector('.view-more');

        // Add a click event listener to the title
        if (title) {
            title.addEventListener('click', () => toggleAbout(sectionId));
        }

        // Add a click event listener to the button
        if (button) {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering the title's event
                toggleAbout(sectionId);
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Function to toggle the visibility and button text of about content
    window.toggleAbout = function(sectionId) {
        const section = document.getElementById(sectionId);
        const content = section.querySelector('.about-content');
        const button = section.querySelector('.view-more');

        // Toggle the expanded class
        content.classList.toggle('expanded');

        // Change button text based on current state
        if (content.classList.contains('expanded')) {
            button.textContent = 'Collapse';
        } else {
            button.textContent = 'Expand';
        }

        // Close other sections
        const allSections = document.querySelectorAll('.about-item');
        allSections.forEach(otherSection => {
            if (otherSection.id !== sectionId) {
                const otherContent = otherSection.querySelector('.about-content');
                const otherButton = otherSection.querySelector('.view-more');
                
                otherContent.classList.remove('expanded');
                otherButton.textContent = 'Expand';
            }
        });
    }
});

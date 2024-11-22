function toggleFaq(id) {
    const faqItem = document.getElementById(id);
    const faqContent = faqItem.querySelector('.faq-content');
    const button = faqItem.querySelector('.view-more');

    if (faqContent.classList.contains('expanded')) {
        faqContent.classList.remove('expanded');
        button.textContent = 'View More';
    } else {
        faqContent.classList.add('expanded');
        button.textContent = 'View Less';
    }
}

function toggleFaq(id) {
    const faqItem = document.getElementById(id);
    const faqContent = faqItem.querySelector('.faq-content'); // Select the content element within the FAQ item

    if (faqContent.classList.contains('expanded')) {
        faqContent.classList.remove('expanded');
    } else {
        faqContent.classList.add('expanded');
    }
}

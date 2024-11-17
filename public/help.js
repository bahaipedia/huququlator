function toggleFaq(id) {
    const faqItem = document.getElementById(id);
    if (faqItem.classList.contains('expanded')) {
        faqItem.classList.remove('expanded');
    } else {
        faqItem.classList.add('expanded');
    }
}

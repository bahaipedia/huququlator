function updateCalculator() {
    const a1 = parseFloat(document.getElementById('a1').value) || 0;
    const a2 = parseFloat(document.getElementById('a2').value) || 0;
    const a3 = parseFloat(document.getElementById('a3').value) || 0;
    const a4 = parseFloat(document.getElementById('a4').value) || 0;

    const r1 = document.getElementById('r1');
    const r2 = document.getElementById('r2');
    const r3 = document.getElementById('r3');
    const r4 = document.getElementById('r4');
    const r5 = document.getElementById('r5');
    const r6 = document.getElementById('r6');

    const totalWealth = a1 + a2;
    const taxableUnits = Math.floor((totalWealth - a3) / a4);
    const taxableWealth = taxableUnits * a4;
    const taxDue = taxableWealth * 0.19;

    // Update response areas only if relevant inputs have values
    if (a1 || a2) {
        r1.style.display = (totalWealth > a4) ? 'none' : 'inline';
        r1.innerText = (totalWealth > a4) ? '' : "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    }

    if (totalWealth - a3 > a4) {
        r2.style.display = 'none';
    } else {
        r2.style.display = 'inline';
        r2.innerText = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    }

    r3.style.display = 'inline';
    r3.innerText = taxableUnits > 0 ? `We rounded down from ${(totalWealth - a3) / a4} because payments are only due on whole units of Huquq.` : '';

    r4.style.display = 'inline';
    r4.innerText = `This represents the amount of wealth you are paying Huquq on.`;

    r5.style.display = 'inline';
    r5.innerText = `Huququllah is a 19% tax on the wealth listed above.`;

    r6.style.display = 'inline';
    r6.innerText = `This year you owe $${taxDue.toFixed(2)} to Huququllah.`;

    // Update calculated fields
    document.getElementById('a5').value = taxableUnits > 0 ? taxableUnits : 0;
    document.getElementById('a6').value = taxableWealth > 0 ? taxableWealth.toFixed(2) : '';
    document.getElementById('a7').value = taxDue > 0 ? taxDue.toFixed(2) : '';
}

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
    const r7 = document.getElementById('r7');

    const totalWealth = a1 + a2;
    const excessWealth = totalWealth - a3;
    const taxableUnits = Math.floor(excessWealth / a4);
    const taxableWealth = taxableUnits * a4;
    const taxDue = taxableWealth * 0.19;

    // Update response for r1: totalWealth compared to a4
    if (totalWealth > a4) {
        r1.style.visibility = 'hidden';
    } else {
        r1.style.visibility = 'visible';
        r1.innerText = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    }

    // Update response for r2: excessWealth compared to a4
    if (excessWealth > a4) {
        r2.style.visibility = 'hidden';
    } else {
        r2.style.visibility = 'visible';
        r2.innerText = "No Huququllah payment is due today because your excess wealth did not exceed 19 Mithqals of gold.";
    }

    // Update response for r3
    if (taxableUnits > 0) {
        r3.style.visibility = 'visible';
        r3.innerText = `We rounded down from ${(excessWealth / a4).toFixed(2)} because payments are only due on whole units of Huquq.`;
    } else {
        r3.style.visibility = 'hidden';
    }

    // Update response for r4 and r5
    r4.style.visibility = taxableUnits > 0 ? 'visible' : 'hidden';
    r5.style.visibility = taxableUnits > 0 ? 'visible' : 'hidden';

    if (taxableUnits > 0) {
        r4.innerText = `This represents the amount of wealth you are paying Huquq on.`;
        r5.innerText = `Huququllah is a 19% tax on the wealth listed above.`;
    }

    // Update response for r6
    if (taxDue > 0) {
        r6.style.visibility = 'visible';
        r6.innerText = `This year you owe $${taxDue.toFixed(2)} to Huququllah.`;
    } else {
        r6.style.visibility = 'hidden';
    }

    // Update calculated fields
    document.getElementById('a5').value = taxableUnits > 0 ? taxableUnits : 0;
    document.getElementById('a6').value = taxableWealth > 0 ? taxableWealth.toFixed(2) : '';
    document.getElementById('a7').value = taxDue > 0 ? taxDue.toFixed(2) : '';
}

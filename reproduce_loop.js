const JUNIOR_FIRST_NAMES = ['Luca', 'Noah', 'Arlo', 'Mika', 'Toby', 'Evan', 'Rory', 'Jude', 'Finn', 'Kai'];
const JUNIOR_LAST_NAMES = ['Mercer', 'Sloan', 'Hale', 'Bennett', 'Cross', 'Mori', 'Dawes', 'Pryce', 'Vale', 'Keane'];

function simulateJuniorIntake() {
    console.log('Season | Unique Names Generated');
    console.log('-------|-----------------------');
    
    const cumulativeSeenNames = new Set();

    for (let seasonStartYear = 2049; seasonStartYear <= 2056; seasonStartYear++) {
        const seasonNamesSet = new Set();
        
        for (let index = 0; index < 8; index += 1) {
            let attempt = 0;
            let fullName = '';

            do {
                const seed = seasonStartYear * 17 + index * 11 + attempt * 23;
                const suffix = attempt > 0 ? ' ' + String.fromCharCode(65 + ((seasonStartYear + index + attempt) % 26)) : '';
                fullName = JUNIOR_FIRST_NAMES[seed % JUNIOR_FIRST_NAMES.length] + ' ' + JUNIOR_LAST_NAMES[(seed * 3) % JUNIOR_LAST_NAMES.length] + suffix;
                attempt += 1;
            } while ((cumulativeSeenNames.has(fullName) || seasonNamesSet.has(fullName)) && attempt < 40);

            if (fullName && !cumulativeSeenNames.has(fullName) && !seasonNamesSet.has(fullName)) {
                seasonNamesSet.add(fullName);
            }
        }
        
        seasonNamesSet.forEach(name => cumulativeSeenNames.add(name));
        console.log(seasonStartYear + '   | ' + seasonNamesSet.size);
    }
}

simulateJuniorIntake();

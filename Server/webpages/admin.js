const testGroupName = document.getElementById('testGroupName');
const testLang = document.getElementById('testLang');
const testScore = document.getElementById('testScore');
const testContent = document.getElementById('testContent');
const testResults = document.getElementById('testResults');
const timeLeft = document.getElementById('timeLeft');

let testData = [];


// ------- MAIN -------
on_load();
loadTestContent(0);


// ------- FUNCTIONS -------
async function on_load() {
    testData = await fetch("test_sheets.json").then(res => res.json());
    loadTestResults(testData);
}


function formatTime(localIsoDate) {
    const z = (n) => ((n < 10 ? '0' : '') + n)
    var hh = localIsoDate.getUTCHours();
    var mm = localIsoDate.getUTCMinutes();
    var ss = localIsoDate.getUTCSeconds();
    return z(hh) + ':' + z(mm) + ':' + z(ss);
}


function loadTestResults(testData) {
    testData.sort((a, b) => {
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        if (a.timestamp > b.timestamp) return 1;
        if (a.timestamp < b.timestamp) return -1;
        return 0;
    });
    let html = `
    <table>
        <tr onclick="loadTestContent(null)">
            <th class="groupname">Csapatnév</th>
            <th class="lang">Nyelv</th>
            <th class="score">Pont</th>
            <th class="timestamp">Leadás ideje</th>
        </tr>`;
    for (const testId in testData) {
        const test = testData[testId];
        html += `
        <tr onclick="loadTestContent(${testId})">
            <td class="groupname">Csapatnév</td>
            <td class="lang">HU</td>
            <td class="score">${test.score}</td>
            <td class="timestamp">${formatTime(new Date(test.timestamp))}</td>
        </tr>`;
    }
    html += `</table>`;
    testResults.innerHTML = html;
}


function loadTestContent(testId) {
    if (testId === null) {
        testGroupName.innerText = "<csapatnév>";
        testLang.innerText = "??";
        testScore.innerText = "??/??";
        return;
    }
    const test = testData[testId];
    console.log(testId);
    testGroupName.innerText = `${testId + 1}. Csapat`;
    testLang.innerText = "HU";
    testScore.innerText = test.score;
    testContent.innerHTML = `
    <table>
        <tr>
            <th>Név</th>
            <th>Ország, Város</th>
            <th>id</th>
            <th>Szám</th>
            <th>Helyes</th>
        </tr>`;
}


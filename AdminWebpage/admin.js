const testGroupName = document.getElementById('testGroupName');
const testLang = document.getElementById('testLang');
const testScore = document.getElementById('testScore');
const testContent = document.getElementById('testContent');
const testResults = document.getElementById('testResults');
const timeLeft = document.getElementById('timeLeft');

let testData = [];


// ------- MAIN -------
on_load();


// ------- FUNCTIONS -------
async function on_load() {
    testData = await fetch("test_sheets.json").then(res => res.json());
    testData = testData.concat(testData);
    loadTestResults(testData);
    loadTestContent(0);
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
        <thead style="position: sticky; top: 0;">
            <tr onclick="loadTestContent(null)">
                <th class="groupname">Csapatnév</th>
                <th class="lang">Nyelv</th>
                <th class="score">Pont</th>
                <th class="timestamp">Leadás ideje</th>
            </tr>
        </thead>
        <tbody>`;
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
    html += `</tbody></table>`;
    testResults.innerHTML = html;
}


function loadTestContent(testId) {
    if (testId === null) {
        testGroupName.innerText = "<csapatnév>";
        testLang.innerText = "??";
        testScore.innerText = "??/??";
        testContent.innerHTML = "Kattints egy csapatra a részletek megtekintéséhez.";
        return;
    }
    const test = testData[testId];
    testGroupName.innerText = `${testId + 1}. Csapat`;
    testLang.innerText = "HU";
    testScore.innerText = test.score + "/" + test.testData.length;
    let html = `
    <table>
        <tr>
            <th class="testcontent-header testcontent-name">Név</th>
            <th class="testcontent-header testcontent-location">Ország, Város</th>
            <th class="testcontent-header testcontent-id">id</th>
            <th class="testcontent-header testcontent-number">Szám</th>
            <th class="testcontent-header testcontent-correct">Helyes</th>
        </tr>`;
    for (const i in test.testData) {
        const line = test.testData[i];
        html += `<tr>
            <td class="testcontent-name">${line.name}</td>
            <td class="testcontent-location">${line.country}, ${line.city}</td>
            <td class="testcontent-id">${line.id}</td>
            <td class="testcontent-number">${line.number}</td>
            <td class="testcontent-correct">${line.correct ? "Igen" : "Nem"}</td>
        </tr>`;
    }
    html += `</table>`;
    testContent.innerHTML = html;
}


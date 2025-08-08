const fs = require('fs');
const path = require('path');

const masterList = require('./masterList.json');

function generateBuildingList(entries) {
    return entries.map(entry => {
        const id = entry.id;
        const box = entry.box === null ? 'null' : entry.box;
        const name = entry.name_hu;
        return `${id} • ${box} • ${name}`;
    });
}

const data = [
    {
        category: 'Kiállítás',
        subcategory: '3D makett',
        title: '3D makett kiállítás',
        items: [
            {
                subcategory: '3D makett',
                title: '100db épület',
                items: generateBuildingList(masterList.entries)
            },
            "100db információs papír",
            "100db számozott tartó",
            "Piros posztók",
            "Pillanatragasztó",
            "Papírragasztó",
            "Cellux",
            "Szigetelőszalag",
            "Papírzsepi",
            "Innivalók, poharak",
            "Olló",
            "Tapétavágó kés",
            "6db “NE NYÚLJ HOZZÁ” tábla",
            "Alkoholos filc",
            "3db A3 plakát (3D makett, Ledkorszak, BotC)",
            "32” TV",
            "TV távirányító",
            "TV tápkábel",
            "Hosszabbító",
            "Pendrive a “Video-show”-val"
        ]
    },
    {
        category: 'Kiállítás',
        subcategory: 'Kvízjáték',
        title: 'Kvízjáték',
        items: [
            "Íróalátétek",
            "Bindercsipeszek",
            "Kék tollak",
            "3db piros javító toll",
            "20-as és 100-as tesztek (fájlok)",
            "Megoldókulcsok (fájl)",
            "Technikai listák - 4 féle (fájlok és papír)",
            "Játékszabályzat",
            "I., II. és III. helyezett nyeremények",
            "100-as teszt nyeremények",
            "Pendrive a Tesztekkel és Megoldókulcsokkal",
            "Laptop",
            "Laptop töltő",
            "Egér",
            "Nyomtató",
            "USB-A - USB-B kábel (nyomtatóhoz)",
            "Hálózati tápkábel (nyomtatóhoz)",
            "A4 papír (min. 120 lap)",
            "3-as elosztó (hozzáadható az ‘Audio-technika’ elosztójához)"
        ]
    },
    {
        category: 'Kiállítás',
        subcategory: 'LED korszak',
        title: 'LED-korszak kiállítás',
        items: [
            "Ledkocka",
            "BigClock",
            "Led Óra",
            "Led karácsonyfa",
            "Fekete posztó",
            "BigClock tartó",
            "Led Óra tartó",
            "27” Monitor",
            "Monitor DC adapter",
            "RPi 4 (a CubeLoader programmal)",
            "Billentyűzet, Egér",
            "RPi 4 tápegység (5V/3A, USB-C)",
            "Micro HDMI -> HDMI kábel (rövid)",
            "Ledkocka - RPi összekötő kábel",
            "Hálózati tápkábel (ledkockához)",
            "2db “NE NYÚLJ HOZZÁ” tábla",
            "2db 3-as elosztó",
            "1db 10m hosszabbító",
            "1db 5m hosszabbító"
        ]
    },
    {
        category: 'Kiegészítők',
        subcategory: 'Audio',
        title: 'Audio-technika',
        items: [
            "2x Hangfal",
            "1x Keverő",
            "1x Mikrofon",
            "1x Mikrofon állvány",
            "1x 5m XLR - XLR kábel (mikrofonhoz)",
            "2x Hálózati tápkábel",
            "1x Keverő DC adapter",
            "2x 6.3 jack - XLR mono kábel",
            "1x 3.5 jack - 2x 6.3 jack stereo kábel",
            "1db 3-as elosztó"
        ]
    },
    {
        category: 'Kiegészítők',
        subcategory: 'Egyéb',
        title: 'Egyéb',
        items: [
            "Emlékkönyv",
            "Fényképezőgép, pót-akku, töltő",
            "Fényképezőgép állvány",
            "RPi 4 (a Timelapse programmal)",
            "RPi 4 tápegység (5V/3A, USB-C)",
            "Micro HDMI -> HDMI kábel (5 méteres)",
            "RPi 4 kamera állvány (5 részes)",
            "10m hosszabbító",
            "17-es villáskulcs",
            "Tűzőgép"
        ]
    }
];

const outputPath = path.resolve(__dirname, '../public/data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('✅ data.json generated successfully.');
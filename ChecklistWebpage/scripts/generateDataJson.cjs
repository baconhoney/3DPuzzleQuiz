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
                title: '100x épület',
                items: generateBuildingList(masterList.entries)
            },
            "100x információs papír",
            "100x számozott tartó",
            "2x A3 plakát (3D makett, Ledkorszak)",
            "6x “NE NYÚLJ HOZZÁ” tábla",
            "Alkoholos filc",
            "Cellux",
            "Papírragasztó",
            "Pillanatragasztó",
            "Piros posztók",
            "Szigetelőszalag",
            "Papírzsepi",
            "7x Adag Foodora",
            "7x villa + kés + szalvéta",
            "Innivalók, poharak",
            "Olló",
            "Tapétavágó kés",
            "10m Hosszabbító",
            "38” TV (picture show)",
            "Mikró",
            "Pendrive a “Video-show”-val",
            "TV tápkábel",
            "TV távirányító"
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
            "3x piros javító toll",
            "A4 papír (min. 120 lap)",
            "Technikai listák - 4 féle (papír)",
            "Játékszabályzat",
            "100-as teszt nyeremények",
            "I., II. és III. helyezett nyeremények",
            "Online Quiz oldal, backup fileok",
            "Brother Nyomtató",
            "Hálózati tápkábel (nyomtatóhoz)",
            "USB-A - USB-B kábel (nyomtatóhoz)",
            "Laptop M + fileok",
            "Laptop M töltő (USB C)",
            "Egér",
            "Mechanikus Billentyűzet",
            "HDMI kábel (Laptop -> TV)",
            "Mini HDMI - HDMI kábel",
            "Mikro USB - A kábel",
            "Mikro USB-A OTG kábel",
            "USB 3.0 hosszabító",
            "USB C - A kábel",
            "USB-A Elosztó hub 1->4",
            "USB-C - A OTG kábel",
            "USB-C Ethernet-pd converter",
            "2x USB-A Ethernet converter",
            "2x USB töltő (5V/2A)",
            "2x 6-as elosztó",
            "3x 1.5m ethernet kábel (ha nincs akkor röbidebb)",
            "Vonalkód olvasó",
            "Vonalkód olvasó dokkoló",
            "Vonalkód olvasó Usermanual",
            "Wifi router (TP-Link)",
            "Wifi router tápegység",
            "Raspberry Pi Zero W",
            "Tűzőgép + kapocs"
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
            "2x “NE NYÚLJ HOZZÁ” tábla",
            "31.5” Monitor",
            "Monitor DC adapter",
            "Billentyűzet, Egér",
            "RPi 4 (a CubeLoader programmal)",
            "RPi 4 tápegység (5V/3A, USB-C)",
            "Micro HDMI - HDMI kábel (rövid)",
            "Ledkocka - RPi összekötő kábel",
            "Hálózati tápkábel (ledkockához)",
            "1x 10m hosszabbító",
            "1x 5m hosszabbító",
            "2x 3-as elosztó"
        ]
    },
    {
        category: 'Kiegészítők',
        subcategory: 'Audio',
        title: 'Audio-technika',
        items: [
            "2x Hangfal",
            "1x Keverő",
            "1x Keverő DC adapter",
            "1x Mikrofon",
            "1x Mikrofon állvány",
            "1x 5m XLR - XLR kábel (mikrofonhoz)",
            "2x 6.3 jack - XLR mono kábel",
            "1x 3.5 jack - 2x 6.3 jack stereo kábel",
            "2x Hálózati tápkábel",
            "1x 3-as elosztó"
        ]
    },
    {
        category: 'Kiegészítők',
        subcategory: 'Egyéb',
        title: 'Egyéb',
        items: [
            "Emlékkönyv",
            "Fényképezőgép állvány",
            "Fényképezőgép, pót-akku, töltő",
            "10m Ethernet kábel",
            "10m hosszabbító",
            "128GB Pendrive",
            "17-es villáskulcs",
            "Micro HDMI - HDMI kábel (5 méteres)",
            "RPi 4 (a Timelapse programmal)",
            "RPi 4 kamera állvány (5 részes)",
            "RPi 4 tápegység (5V/3A, USB-C)"
        ]
    }
];

const outputPath = path.resolve(__dirname, '../public/data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('✅ data.json generated successfully.');
# Admin pages

* |\<val>| is an input field
* `~` means the below or above extends to this portion (table cell merging)

## Leaderboard display

#### Usage: `getLeaderboard`

#### Arrangement

|   teamID   |   Csapatnév  | Pontszám | Leadás ideje |
| :--------: | :----------: | :------: | :----------: |
| 1234567890 | Hello World! |    14    |   16:48:38   |
|     ...    |      ...     |    ...   |      ...     |

**onClick**: shows the details of that team/answer
**on second scan**: shows the details of that team/answer (uses `showQuiz` event)

## Details display

#### Usage: `getQuizDetails?teamID=<id>`

#### Arrangement

**| Team Hello World \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ | EN | 14 / 20 |** (*header*)

|  id  |      Név     |   Elhelyezkedés  | Válasz | Helyes |
| :--: | :----------: | :--------------: | :----: | :----: |
| 6192 | Hagia Sophia | Istanbul, Turkey | \|94\| |    ✅   |
|  ... |      ...     |        ...       |   ...  |   ...  |

* "Mentés" button at the top right → sends the entered data to the server for saving (uses `uploadQuiz`)
* "Nyomtat" button at the top right → prints the selected quiz\*
* Shows a template with empty rows when not in use
* Shows details when in use
* Buttons are only displayed for team details not yet uploaded

## Controls

### Fázisváltás idő frissítése

#### Usage: `sendNewPhaseChangeAt`

```json
{
    "timestamp": "<ISO timestring>"
}
```

#### Arrangement

|               | *This table needs no headers* |     |     |        |
| ------------- | :---------------------------: | :-: | :-: | :----: |
| Váltás ideje: |           \|HH\:MM\|          |  +1 |  +5 | Küldés |
| Hátra van:    |           HH\:MM\:MM          |  -1 |  -5 |   \~   |

### Fázisváltás

#### `sendChangePhase`

```json
{
    "newPhase": "<newPhase>"
}
```

#### Arrangement

| *no headers*                |                        |
| --------------------------- | :--------------------: |
| Jelenlegi fázis: \<phase>   | "Fázis váltása" button |
| Jelenlegi kvíz sorszáma: 01 |           \~           |

### Papír-kvíz nyomtatás

#### `sendPrintJob`

```json
{
    "copyCount": 1,
    "lang": "<lang>",
    "size": 20
}
```

#### Arrangement

|       \~      | Nyelv | Méret |    \~   |
| :-----------: | :---: | :---: | :-----: |
| \|1\| példány |   HU  |   20  | Nyomtat |
|       \~      |   EN  |  100  |    \~   |

---

\*: Uses `sendPrintJob` with

```json
{
    "teamID": 1234567890
}
```

---

# Leaderboard page

## Leaderboard display

#### Usage: `getLeaderboard`

#### Arrangement

| Nyelv |   Csapatnév  | Pontszám | Leadás ideje |
| :---: | :----------: | :------: | :----------: |
|   HU  | Hello World! |    14    |   16:48:38   |
|  ...  |      ...     |    ...   |      ...     |


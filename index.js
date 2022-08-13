const fs = require("fs")

const systems = {
  nes: require("./pop-nes.json").populations,
  super_nes: require("./pop-snes.json").populations,
  n64: require("./pop-n64.json").populations,
  game_boy: require("./pop-gb.json").populations,
  game_boy_color: require("./pop-gbc.json").populations,
  game_boy_advance: require("./pop-gba.json").populations,
  ps1: require("./pop-ps1.json").populations,
  sega_cd: require("./pop-cd.json").populations,
  sega_saturn: require("./pop-saturn.json").populations,
  sega_genesis: require("./pop-genesis.json").populations,
  sega_dreamcast: require("./pop-dreamcast.json").populations,
  turbografx_16: require("./pop-turbografx16.json").populations,
}

const FIELD_NAMES = {
  title: "title",
  state: "state",
  box_variant: "box_variant",
  total: "total",
  grade_gen: "grade_gen",
  grade_pro: "grade_pro",
  grade_100: "grade_100",
  grade_98: "grade_98",
  grade_96: "grade_96",
  grade_94: "grade_94",
  grade_92: "grade_92",
  grade_90: "grade_90",
  grade_85: "grade_85",
  grade_80: "grade_80",
  grade_75: "grade_75",
  grade_70: "grade_70",
  grade_65: "grade_65",
  grade_below_65: "grade_below_65",
}

function getPops() {
  let output = ""

  for (const system in systems) {
    const games = systems[system]
    output += `\n${system
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ")}\n\n`
    let grades = {}

    for (const game of games) {
      for (const dataKey in game) {
        if (dataKey.startsWith("grade_")) {
          const boxGradeKey = dataKey
            .replace("grade_", "")
            .replace("_below", "_")
            .split("")
            .join(".")
            .replace("._", "_and_below")

          grades[boxGradeKey] = grades[boxGradeKey] || {}
          const gradeList = game[dataKey]

          for (const gradeEntry of gradeList) {
            for (const sealGradeKey in gradeEntry) {
              const formattedSealGradeKey = sealGradeKey
                .replace(/_plus/g, "+")
                .toUpperCase()
              if (!grades[boxGradeKey][formattedSealGradeKey]) {
                grades[boxGradeKey][formattedSealGradeKey] = 0
              }
              grades[boxGradeKey][formattedSealGradeKey] +=
                gradeEntry[sealGradeKey]
            }
          }
        }
      }
    }

    // correct "10" key
    if (grades["1.0.0"]) {
      grades["10"] = grades["1.0.0"]
      delete grades["1.0.0"]
    }

    // Sort everything
    let sortedGrades = Object.keys(grades)
      .sort()
      .reduce((acc, key) => {
        if (key === "10") return acc
        return { ...acc, [key]: grades[key] }
      }, {})

    output += `${JSON.stringify(sortedGrades, null, 2)}\n\n`

    // get seal count totals
    let totals = {}

    // correct "10" grade
    for (const boxGrade in grades) {
      for (const sealGrade in grades[boxGrade]) {
        totals[sealGrade] = totals[sealGrade] || 0
        totals[sealGrade] += grades[boxGrade][sealGrade]
      }
    }

    output += `Totals:\n${JSON.stringify(totals, null, 2)}\n`

    output += `\n=================================\n`
  }

  fs.writeFileSync("./content.txt", output, "utf8")
}

getPops()

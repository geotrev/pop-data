const fs = require("fs")
const path = require("path")

async function fetchWithAgent(name) {
  const res = await fetch(
    `https://www.watagames.com/populations/${name}/pop_report_${name}.json`,
    {
      credentials: "omit",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
      referrer: `https://www.watagames.com/populations/${name}/index.html`,
      method: "GET",
      mode: "cors",
    }
  )

  const data = await res.json()

  return data.populations
}

function sortObjEntries(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => ({ ...result, [key]: obj[key] }), {})
}

async function getPops() {
  const systems = {
    nes: await fetchWithAgent("nes"),
    snes: await fetchWithAgent("snes"),
    nintendo_64: await fetchWithAgent("n64"),
    game_boy: await fetchWithAgent("gb"),
    game_boy_color: await fetchWithAgent("gbc"),
    game_boy_advance: await fetchWithAgent("gba"),
    ps1: await fetchWithAgent("ps1"),
    sega_cd: await fetchWithAgent("sega_cd"),
    sega_saturn: await fetchWithAgent("saturn"),
    sega_genesis: await fetchWithAgent("genesis"),
    sega_dreamcast: await fetchWithAgent("dreamcast"),
    turbografx16: await fetchWithAgent("turbografx16"),
  }

  let output = {}

  for (const system in systems) {
    const games = systems[system]
    const systemName = system
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ")
    output[systemName] = {}

    for (const game of games) {
      for (const dataKey in game) {
        if (dataKey.startsWith("grade_")) {
          const boxGradeKey = dataKey
            .replace("grade_", "")
            .replace("_below", "_")
            .split("")
            .join(".")
            .replace("._", "_and_below")

          output[systemName][boxGradeKey] =
            output[systemName][boxGradeKey] || {}
          const gradeList = game[dataKey]

          for (const gradeEntry of gradeList) {
            for (const sealGradeKey in gradeEntry) {
              const formattedSealGradeKey = sealGradeKey
                .replace(/_plus/g, "+")
                .toUpperCase()
              if (!output[systemName][boxGradeKey][formattedSealGradeKey]) {
                output[systemName][boxGradeKey][formattedSealGradeKey] = 0
              }
              output[systemName][boxGradeKey][formattedSealGradeKey] +=
                gradeEntry[sealGradeKey]
            }
          }
        }
      }
    }

    // correct "10" key
    if (output[systemName]["1.0.0"]) {
      output[systemName]["10"] = output[systemName]["1.0.0"]
      delete output[systemName]["1.0.0"]
    }

    // Sort everything
    let sortedGrades = Object.keys(output[systemName])
      .sort()
      .reduce((acc, key) => {
        return { ...acc, [key]: sortObjEntries(output[systemName][key]) }
      }, {})

    // get combined seal count totals
    let unsortedTotals = {}

    // correct "10" grade
    for (const boxGrade in output[systemName]) {
      const sealGrades = output[systemName][boxGrade]
      for (const sealGrade in sealGrades) {
        if (!unsortedTotals[sealGrade]) {
          unsortedTotals[sealGrade] = 0
        }
        unsortedTotals[sealGrade] += output[systemName][boxGrade][sealGrade]
      }
    }
    const totals = sortObjEntries(unsortedTotals)

    output[systemName].totals = totals
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "out.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  )
}

getPops()

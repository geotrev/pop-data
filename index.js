const fs = require("fs")
const path = require("path")

async function fetchWithAgent(name) {
  const res = await fetch(
    `https://www.watagames.com/populations/${name}/pop_report_${name}_sealed.json`,
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
    2600: await fetchWithAgent("2600"),
    5200: await fetchWithAgent("5200"),
    7800: await fetchWithAgent("7800"),
    colecovision: await fetchWithAgent("colecovision"),
    gamecube: await fetchWithAgent("gamecube"),
    turbografx16: await fetchWithAgent("turbografx16"),
    turbografxcd: await fetchWithAgent("turbografxcd"),
    n64: await fetchWithAgent("n64"),
    nes: await fetchWithAgent("nes"),
    gb: await fetchWithAgent("gb"),
    gbc: await fetchWithAgent("gbc"),
    gba: await fetchWithAgent("gba"),
    intellivision: await fetchWithAgent("intellivision"),
    virtual_boy: await fetchWithAgent("virtual_boy"),
    wii: await fetchWithAgent("wii"),
    wii_u: await fetchWithAgent("wii_u"),
    snes: await fetchWithAgent("snes"),
    sega_cd: await fetchWithAgent("sega_cd"),
    dreamcast: await fetchWithAgent("dreamcast"),
    genesis: await fetchWithAgent("genesis"),
    saturn: await fetchWithAgent("saturn"),
    sms: await fetchWithAgent("sms"),
    "32x": await fetchWithAgent("32x"),
    ps1: await fetchWithAgent("ps1"),
    ps2: await fetchWithAgent("ps2"),
    xbox: await fetchWithAgent("xbox"),
    xbox_360: await fetchWithAgent("xbox_360"),
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
            .replace("._", "_below")

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
    output[systemName] = Object.keys(output[systemName])
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

  output.totals = Object.keys(output).reduce((acc, system) => {
    for (const sealGrade in output[system].totals) {
      acc[sealGrade] = acc[sealGrade] || 0
      acc[sealGrade] += output[system].totals[sealGrade]
    }
    return acc
  }, {})

  fs.writeFileSync(
    path.resolve(process.cwd(), "out.json"),
    JSON.stringify(output, null, 2),
    "utf8"
  )
}

getPops()

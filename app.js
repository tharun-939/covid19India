const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbpath = path.join(__dirname, 'covid19India.db')
let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

app.use(express.json())

app.get('/states/', async (request, response) => {
  const covidStateQuery = `SELECT * FROM state;`
  const covidStateDetails = await db.all(covidStateQuery)
  response.send(
    covidStateDetails.map(eachState => ({
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    })),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateQuery = `
  SELECT * FROM state
  WHERE state_id = ${stateId};`
  const stateDb = await db.get(stateQuery)
  response.send({
    stateId: stateDb.state_id,
    stateName: stateDb.state_name,
    population: stateDb.population,
  })
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
  INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}','${stateId}', '${cases}', '${cured}', '${active}','${deaths}');`
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetails = `
  SELECT * FROM district WHERE district_id = ${districtId};`
  const districtDetails = await db.get(getDistrictDetails)
  response.send({
    districtId: districtDetails.district_id,
    districtName: districtDetails.district_name,
    stateId: districtDetails.state_id,
    cases: districtDetails.cases,
    cured: districtDetails.cured,
    active: districtDetails.active,
    deaths: districtDetails.deaths,
  })
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM district WHERE district_id = ${districtId};`
  await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const districtId = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
  UPDATE district 
  SET district_name = '${districtName}', state_id = '${stateId}',cases = '${cases}',cured = '${cured}',active = '${active}',deaths = '${deaths}'
  WHERE district_id = ${districtId};`
  await db.run(addDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths)
  FROM district 
  WHERE state_id = ${stateId};`
  const statsDb = await db.get(getStateStatsQuery)
  console.log(statsDb)
  response.send({
    totalCases: statsDb['SUM(cases)'],
    totalCured: statsDb['SUM(cured)'],
    totalActive: statsDb['SUM(active)'],
    totalDetails: statsDb['SUM(deaths)'],
  })
})
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateIdQuery = `
  SELECT state_id FROM district WHERE district_id = ${districtId};`
  const state = await db.get(getStateIdQuery)

  const getStateNameQuery = `
  SELECT state_name AS stateName FROM state
  WHERE state_id = ${state.state_id};`;
  const stateNameQuery = await db.get(getStateNameQuery)
  response.send(stateNameQuery)
})


module.exports = app
